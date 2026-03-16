/**
 * L2 – Plan Entitlements Service
 * Returns merged entitlements (plan matrix + per-tenant admin override).
 * All consumer code should call checkFeature / checkLimit instead of reading
 * plan config directly.
 */
import { isSuperAdmin } from '@/lib/superadmin';
import {
  PLAN_ENTITLEMENTS,
  FEATURE_UPGRADE_MESSAGES,
  PlanEntitlements,
  FeatureKey,
  LimitKey,
} from '@/lib/config/plans';
import { getSubscription } from './subscriptionService';

/** Resolve final entitlements for a tenant, merging plan defaults + any admin override. */
export async function getEntitlements(tenantId: string, role?: string): Promise<PlanEntitlements> {
  if (role && isSuperAdmin(role)) return PLAN_ENTITLEMENTS['superadmin'];

  const sub = await getSubscription(tenantId);

  // Canceled subscriptions or expired trials fall back to starter limits (no features unlocked).
  const isExpiredTrial =
    sub?.status === 'trialing' && sub.trialEnd != null && new Date() > sub.trialEnd;
  const isCanceled = sub?.status === 'canceled';

  const planKey =
    isCanceled || isExpiredTrial ? 'starter' : sub?.plan || 'starter';
  const base: PlanEntitlements =
    PLAN_ENTITLEMENTS[planKey] ?? PLAN_ENTITLEMENTS['starter'];

  // Admin override stored on Subscription.entitlementsOverride (Json?)
  const override = (sub as any)?.entitlementsOverride as Partial<PlanEntitlements> | null;
  if (!override) return base;

  return {
    channels: override.channels ?? base.channels,
    features: { ...base.features, ...(override.features ?? {}) },
    limits: { ...base.limits, ...(override.limits ?? {}) },
  };
}

/** Check if a boolean feature is enabled for the tenant. */
export async function checkFeature(
  tenantId: string,
  feature: FeatureKey,
  role?: string,
): Promise<{ allowed: boolean; upgradeMessage?: string }> {
  const ent = await getEntitlements(tenantId, role);
  if (ent.features[feature]) return { allowed: true };
  return { allowed: false, upgradeMessage: FEATURE_UPGRADE_MESSAGES[feature] };
}

/**
 * Check if a numeric limit allows one more unit (currentCount is the CURRENT usage).
 * Pass currentCount = 0 to check if the feature is available at all.
 */
export async function checkLimit(
  tenantId: string,
  limitKey: LimitKey,
  currentCount: number,
  role?: string,
): Promise<{ allowed: boolean; upgradeMessage?: string }> {
  const ent = await getEntitlements(tenantId, role);
  const limit = ent.limits[limitKey];
  if (limit === -1 || currentCount < limit) return { allowed: true };
  return {
    allowed: false,
    upgradeMessage: `Você atingiu o limite de ${limit} ${limitKey} do seu plano. Faça upgrade para continuar.`,
  };
}
