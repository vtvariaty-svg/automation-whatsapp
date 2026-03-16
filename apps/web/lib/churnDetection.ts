/**
 * G3 – Churn Prevention & Rescue
 * Signal detection and playbook creation helpers.
 */
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, differenceInDays } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChurnSignalType =
  | 'no_channel'
  | 'no_automation'
  | 'usage_drop'
  | 'trial_expiring'
  | 'paid_inactive';

export type ChurnSeverity = 'low' | 'medium' | 'high';

export type PlaybookAction =
  | 'nudge_shown'
  | 'support_invited'
  | 'template_suggested'
  | 'reconnect_prompted';

// ─── Signal detection ─────────────────────────────────────────────────────────

async function detectNoChannel(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { whatsappToken: true, instagramToken: true, facebookToken: true },
  });
  if (!tenant) return null;
  const noChannel =
    !tenant.whatsappToken && !tenant.instagramToken && !tenant.facebookToken;
  return noChannel
    ? { signal: 'no_channel' as ChurnSignalType, severity: 'high' as ChurnSeverity, detail: 'Nenhum canal conectado' }
    : null;
}

async function detectNoAutomation(tenantId: string) {
  const count = await prisma.automationRule.count({
    where: { tenantId, active: true },
  });
  return count === 0
    ? { signal: 'no_automation' as ChurnSignalType, severity: 'medium' as ChurnSeverity, detail: 'Nenhuma automação ativa' }
    : null;
}

async function detectUsageDrop(tenantId: string) {
  const now = new Date();
  const last7Start = startOfDay(subDays(now, 7));
  const last14Start = startOfDay(subDays(now, 14));

  const [convLast7, convPrev7] = await Promise.all([
    prisma.conversation.count({
      where: { tenantId, createdAt: { gte: last7Start } },
    }),
    prisma.conversation.count({
      where: { tenantId, createdAt: { gte: last14Start, lt: last7Start } },
    }),
  ]);

  return convLast7 === 0 && convPrev7 > 0
    ? {
        signal: 'usage_drop' as ChurnSignalType,
        severity: 'high' as ChurnSeverity,
        detail: `Sem conversas nos últimos 7 dias (tinha ${convPrev7} na semana anterior)`,
      }
    : null;
}

async function detectTrialExpiring(tenantId: string) {
  const [subscription, tenant] = await Promise.all([
    prisma.subscription.findUnique({
      where: { tenantId },
      select: { status: true, trialEnd: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { operationalStatus: true },
    }),
  ]);

  if (
    !subscription ||
    subscription.status !== 'trialing' ||
    !subscription.trialEnd ||
    tenant?.operationalStatus === 'live'
  ) {
    return null;
  }

  const daysLeft = differenceInDays(new Date(subscription.trialEnd), new Date());
  return daysLeft >= 0 && daysLeft <= 3
    ? {
        signal: 'trial_expiring' as ChurnSignalType,
        severity: 'high' as ChurnSeverity,
        detail: `Trial expira em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}`,
      }
    : null;
}

async function detectPaidInactive(tenantId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { status: true },
  });

  if (!subscription || subscription.status !== 'active') return null;

  const since14d = startOfDay(subDays(new Date(), 14));
  const convCount = await prisma.conversation.count({
    where: { tenantId, createdAt: { gte: since14d } },
  });

  return convCount === 0
    ? {
        signal: 'paid_inactive' as ChurnSignalType,
        severity: 'high' as ChurnSeverity,
        detail: 'Conta paga sem conversas nos últimos 14 dias',
      }
    : null;
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────

async function upsertSignal(
  tenantId: string,
  signal: ChurnSignalType,
  severity: ChurnSeverity,
  detail?: string,
) {
  // Return existing unresolved signal if already present
  const existing = await prisma.churnSignal.findFirst({
    where: { tenantId, signal, resolved: false },
  });
  if (existing) return existing;

  return prisma.churnSignal.create({
    data: { tenantId, signal, severity, detail: detail ?? null, resolved: false },
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function detectChurnSignals(tenantId: string) {
  const [noChannel, noAutomation, usageDrop, trialExpiring, paidInactive] =
    await Promise.all([
      detectNoChannel(tenantId),
      detectNoAutomation(tenantId),
      detectUsageDrop(tenantId),
      detectTrialExpiring(tenantId),
      detectPaidInactive(tenantId),
    ]);

  const detected = [noChannel, noAutomation, usageDrop, trialExpiring, paidInactive].filter(
    Boolean,
  ) as { signal: ChurnSignalType; severity: ChurnSeverity; detail?: string }[];

  const signals = await Promise.all(
    detected.map((d) => upsertSignal(tenantId, d.signal, d.severity, d.detail)),
  );

  return signals;
}

export async function createPlaybookIfNeeded(
  tenantId: string,
  signal: string,
  action: string,
): Promise<void> {
  const existing = await prisma.churnPlaybook.findFirst({
    where: {
      tenantId,
      signal,
      status: { not: 'dismissed' },
    },
  });
  if (existing) return;

  await prisma.churnPlaybook.create({
    data: { tenantId, signal, action, status: 'pending' },
  });
}

export async function runChurnDetectionForAll(): Promise<
  { tenantId: string; signals: number }[]
> {
  const tenants = await prisma.tenant.findMany({
    select: { id: true },
  });

  const results: { tenantId: string; signals: number }[] = [];

  for (const tenant of tenants) {
    try {
      const signals = await detectChurnSignals(tenant.id);
      results.push({ tenantId: tenant.id, signals: signals.length });
    } catch (err) {
      console.error(`[ChurnDetection] Failed for tenant ${tenant.id}:`, err);
      results.push({ tenantId: tenant.id, signals: 0 });
    }
  }

  return results;
}
