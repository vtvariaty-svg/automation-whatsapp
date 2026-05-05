import { prisma } from '@/lib/prisma';

export const PUBLIC_PLANS = ['consultorio', 'restaurante'] as const;
export type PublicPlan = typeof PUBLIC_PLANS[number];

export function isCurrentPublicPlan(plan: string | null | undefined): boolean {
  return !!plan && (PUBLIC_PLANS as readonly string[]).includes(plan);
}

export function isSubscriptionUsable(sub: {
  status: string;
  trialEnd?: Date | string | null;
} | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status === 'trialing') {
    if (!sub.trialEnd) return true;
    return new Date(sub.trialEnd) > new Date();
  }
  return false;
}

export type AccessState =
  | { accessible: true; plan: string; status: string }
  | { accessible: false; reason: 'no_subscription' | 'invalid_plan' | 'subscription_inactive'; plan: string | null; status: string | null };

export async function getSubscriptionAccessState(tenantId: string): Promise<AccessState> {
  const sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) return { accessible: false, reason: 'no_subscription', plan: null, status: null };
  if (!isCurrentPublicPlan(sub.plan)) return { accessible: false, reason: 'invalid_plan', plan: sub.plan, status: sub.status };
  if (!isSubscriptionUsable(sub)) return { accessible: false, reason: 'subscription_inactive', plan: sub.plan, status: sub.status };
  return { accessible: true, plan: sub.plan, status: sub.status };
}
