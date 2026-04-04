'use client';

import { useState, useEffect } from 'react';
import type { PlanEntitlements, FeatureKey, LimitKey } from '@/lib/config/plans';
import { planAtLeast, getMinPlan, FEATURE_UPGRADE_MESSAGES } from '@/lib/config/plans';

export interface EntitlementsState extends PlanEntitlements {
  loading: boolean;
  plan: string | null;
}

const DEFAULT: EntitlementsState = {
  loading: true,
  plan: null,
  channels: [],
  features: {
    whatsapp: false,
    instagram: false,
    facebook: false,
    instagramComments: false,
    advancedCRM: false,
    dynamicSegments: false,
    abTesting: false,
    aiCopilot: false,
    conversionSequences: false,
    premiumTemplates: false,
    whiteLabel: false,
    agencyReseller: false,
    advancedAnalytics: false,
    leadProspectingIntel: false,
    beautyWorkspace: false,
  },
  limits: { messages: 0, agents: 1, automations: 5, contacts: 1000, conversations: 200 },
};

/** Fetches the tenant's merged entitlements once per component mount. */
export function useEntitlements(): EntitlementsState {
  const [state, setState] = useState<EntitlementsState>(DEFAULT);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
    if (!token) { setState((s) => ({ ...s, loading: false })); return; }

    Promise.all([
      fetch('/api/billing/entitlements', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/billing/subscription', { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([entRes, subRes]) => {
        const ent = entRes.ok ? await entRes.json() : null;
        const sub = subRes.ok ? await subRes.json() : null;
        if (ent) {
          setState({ loading: false, plan: sub?.plan ?? null, ...ent });
        } else {
          setState((s) => ({ ...s, loading: false, plan: sub?.plan ?? null }));
        }
      })
      .catch(() => setState((s) => ({ ...s, loading: false })));
  }, []);

  return state;
}

/** Convenience: check a single feature. Returns false while loading. */
export function useFeature(feature: FeatureKey): boolean {
  const ent = useEntitlements();
  return ent.features[feature] ?? false;
}

/** Check if tenant's plan is at least the given minimum. Returns true while loading to avoid flash. */
export function usePlanAtLeast(min: string): boolean {
  const ent = useEntitlements();
  if (ent.loading) return true;
  return planAtLeast(ent.plan, min);
}

/** Returns upgrade state for a feature: { loading, locked, minPlan, message } */
export function useUpgradeState(feature: FeatureKey): {
  loading: boolean;
  locked: boolean;
  minPlan: string;
  message: string;
} {
  const ent = useEntitlements();
  const locked = !ent.loading && !ent.features[feature];
  return {
    loading: ent.loading,
    locked,
    minPlan: getMinPlan(feature),
    message: FEATURE_UPGRADE_MESSAGES[feature],
  };
}
