/**
 * G6 – Expansion Ops
 * Detects upsell/upgrade triggers for tenants and manages ExpansionEvent records.
 */
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';
import { getEntitlements } from '@/lib/services/entitlementsService';
import { getSubscription } from '@/lib/services/subscriptionService';

export type ExpansionTrigger =
  | 'limit_hit'
  | 'wants_multichannel'
  | 'high_lead_volume'
  | 'premium_blocked'
  | 'multi_agent';

export interface ExpansionEvent {
  id: string;
  tenantId: string;
  trigger: string;
  currentPlan?: string | null;
  suggestedPlan?: string | null;
  detail?: string | null;
  shown: boolean;
  converted: boolean;
  convertedAt?: Date | null;
  createdAt: Date;
}

/** Returns suggested plan given current plan slug. null = already at top. */
export function suggestNextPlan(currentPlan: string): string | null {
  if (currentPlan === 'starter') return 'pro';
  if (currentPlan === 'pro') return 'business';
  return null;
}

/**
 * Upsert helper: check for an existing unconverted ExpansionEvent for this trigger
 * created within the last 7 days. If none, create one. Returns the event either way.
 */
async function upsertExpansionEvent(
  tenantId: string,
  trigger: ExpansionTrigger,
  currentPlan: string,
  suggestedPlan: string | null,
  detail?: string,
): Promise<ExpansionEvent> {
  const since = subDays(new Date(), 7);

  const existing = await (prisma as any).expansionEvent.findFirst({
    where: {
      tenantId,
      trigger,
      converted: false,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) return existing as ExpansionEvent;

  const created = await (prisma as any).expansionEvent.create({
    data: {
      tenantId,
      trigger,
      currentPlan,
      suggestedPlan,
      detail: detail ?? null,
      shown: false,
      converted: false,
    },
  });

  return created as ExpansionEvent;
}

// ─── Individual trigger checks ────────────────────────────────────────────────

async function checkLimitHit(
  tenantId: string,
  plan: string,
  usageMessages: number,
  ent: Awaited<ReturnType<typeof getEntitlements>>,
): Promise<ExpansionEvent | null> {
  const msgLimit = ent.limits.messages;
  if (msgLimit === -1) return null; // unlimited
  if (usageMessages <= msgLimit * 0.8) return null;

  const suggested = suggestNextPlan(plan);
  if (!suggested) return null;

  return upsertExpansionEvent(
    tenantId,
    'limit_hit',
    plan,
    suggested,
    `Usage: ${usageMessages}/${msgLimit} messages`,
  );
}

async function checkWantsMultichannel(
  tenantId: string,
  plan: string,
  instagramToken: string | null,
  facebookToken: string | null,
  ent: Awaited<ReturnType<typeof getEntitlements>>,
): Promise<ExpansionEvent | null> {
  const hasInstagram = !!instagramToken;
  const hasFacebook = !!facebookToken;
  if (!hasInstagram && !hasFacebook) return null;

  const planChannels = ent.channels;
  const wantsInstagram = hasInstagram && !planChannels.includes('instagram');
  const wantsFacebook = hasFacebook && !planChannels.includes('facebook');

  if (!wantsInstagram && !wantsFacebook) return null;

  const suggested = suggestNextPlan(plan) ?? (plan === 'business' ? null : 'business');
  if (!suggested) return null;

  const detail = [
    wantsInstagram ? 'instagram configured but not in plan' : '',
    wantsFacebook ? 'facebook configured but not in plan' : '',
  ]
    .filter(Boolean)
    .join('; ');

  return upsertExpansionEvent(tenantId, 'wants_multichannel', plan, suggested, detail);
}

async function checkHighLeadVolume(
  tenantId: string,
  plan: string,
  ent: Awaited<ReturnType<typeof getEntitlements>>,
): Promise<ExpansionEvent | null> {
  const automationsLimit = ent.limits.automations;
  // If unlimited, no trigger
  if (automationsLimit === -1) return null;

  const since = subDays(new Date(), 7);
  const leadCount = await (prisma as any).conversionLead.count({
    where: {
      tenantId,
      createdAt: { gte: since },
    },
  });

  const threshold = automationsLimit * 5;
  if (leadCount <= threshold) return null;

  const suggested = suggestNextPlan(plan);
  if (!suggested) return null;

  return upsertExpansionEvent(
    tenantId,
    'high_lead_volume',
    plan,
    suggested,
    `${leadCount} leads in last 7d (threshold: ${threshold})`,
  );
}

async function checkPremiumBlocked(
  tenantId: string,
  plan: string,
): Promise<ExpansionEvent | null> {
  const since = subDays(new Date(), 7);
  const count = await (prisma as any).expansionEvent.count({
    where: {
      tenantId,
      trigger: 'premium_blocked',
      createdAt: { gte: since },
    },
  });

  if (count <= 2) return null;

  const suggested = suggestNextPlan(plan);
  if (!suggested) return null;

  return upsertExpansionEvent(
    tenantId,
    'premium_blocked',
    plan,
    suggested,
    `${count} premium_blocked events in last 7d`,
  );
}

async function checkMultiAgent(
  tenantId: string,
  plan: string,
  ent: Awaited<ReturnType<typeof getEntitlements>>,
): Promise<ExpansionEvent | null> {
  const agentsLimit = ent.limits.agents;
  if (agentsLimit === -1) return null;

  const userCount = await (prisma as any).user.count({
    where: { tenantId },
  });

  if (userCount <= agentsLimit) return null;

  const suggested = suggestNextPlan(plan);
  if (!suggested) return null;

  return upsertExpansionEvent(
    tenantId,
    'multi_agent',
    plan,
    suggested,
    `${userCount} users vs ${agentsLimit} agents limit`,
  );
}

// ─── Main detection ───────────────────────────────────────────────────────────

export async function detectExpansionTriggers(tenantId: string): Promise<ExpansionEvent[]> {
  const sub = await getSubscription(tenantId);
  const plan = sub?.plan ?? 'starter';
  const usageMessages = (sub as any)?.usageMessages ?? 0;

  const tenant = await (prisma as any).tenant.findUnique({
    where: { id: tenantId },
    select: { instagramToken: true, facebookToken: true },
  });

  const ent = await getEntitlements(tenantId);

  const [limitHit, multichannel, highLead, premiumBlocked, multiAgent] =
    await Promise.all([
      checkLimitHit(tenantId, plan, usageMessages, ent),
      checkWantsMultichannel(
        tenantId,
        plan,
        tenant?.instagramToken ?? null,
        tenant?.facebookToken ?? null,
        ent,
      ),
      checkHighLeadVolume(tenantId, plan, ent),
      checkPremiumBlocked(tenantId, plan),
      checkMultiAgent(tenantId, plan, ent),
    ]);

  const events: ExpansionEvent[] = [
    limitHit,
    premiumBlocked,
    multichannel,
    highLead,
    multiAgent,
  ].filter((e): e is ExpansionEvent => e !== null);

  return events;
}

// ─── State updates ────────────────────────────────────────────────────────────

export async function recordExpansionShown(eventId: string): Promise<void> {
  await (prisma as any).expansionEvent.update({
    where: { id: eventId },
    data: { shown: true },
  });
}

export async function recordExpansionConverted(
  tenantId: string,
  trigger: string,
): Promise<void> {
  const event = await (prisma as any).expansionEvent.findFirst({
    where: { tenantId, trigger, converted: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) return;

  await (prisma as any).expansionEvent.update({
    where: { id: event.id },
    data: { converted: true, convertedAt: new Date() },
  });
}
