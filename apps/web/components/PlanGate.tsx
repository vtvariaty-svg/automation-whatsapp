'use client';

import Link from 'next/link';
import type { FeatureKey } from '@/lib/config/plans';
import { FEATURE_UPGRADE_MESSAGES } from '@/lib/config/plans';

interface PlanGateProps {
  /** Feature key from PLAN_V2 entitlements */
  feature: FeatureKey;
  /** Whether the tenant has this feature */
  allowed: boolean;
  /** While entitlements are loading */
  loading?: boolean;
  /** Name shown in the gate header (e.g. "WhatsApp Business") */
  name: string;
  /** Emoji icon shown in the gate */
  icon?: string;
  /** Override the default upgrade message */
  upgradeMessage?: string;
  /** The minimum plan slug required ("standard" | "pro" | "business") */
  minPlan?: 'standard' | 'pro' | 'business';
  children: React.ReactNode;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  standard: { label: 'Standard', color: 'bg-indigo-600' },
  pro: { label: 'Pro', color: 'bg-violet-600' },
  business: { label: 'Business', color: 'bg-amber-500' },
};

export default function PlanGate({
  feature,
  allowed,
  loading = false,
  name,
  icon = '🔒',
  upgradeMessage,
  minPlan = 'standard',
  children,
}: PlanGateProps) {
  if (loading) return <>{children}</>;
  if (allowed) return <>{children}</>;

  const msg = upgradeMessage ?? FEATURE_UPGRADE_MESSAGES[feature];
  const plan = PLAN_LABELS[minPlan];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200/60 bg-white shadow-sm">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-4 shadow-sm">
          {icon}
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full ${plan.color}`}>
            {plan.label}
          </span>
          <h3 className="font-bold text-gray-900 text-base">{name}</h3>
        </div>
        <p className="text-sm text-gray-500 max-w-xs mb-5">{msg}</p>
        <Link
          href="/dashboard/billing#plans"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          Fazer upgrade →
        </Link>
      </div>
    </div>
  );
}
