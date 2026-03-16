'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlanEntitlements } from '@/lib/config/plans';

interface PaywallGateProps {
  feature: string;
  upgradeMessage?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PaywallGate({
  feature,
  upgradeMessage,
  children,
  fallback,
}: PaywallGateProps) {
  const [entitlements, setEntitlements] = useState<PlanEntitlements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') ?? '';
    fetch('/api/billing/entitlements', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setEntitlements(json))
      .catch(() => setEntitlements(null))
      .finally(() => setLoading(false));
  }, []);

  // While loading, render children without any gate to avoid layout shift
  if (loading) {
    return <>{children}</>;
  }

  const allowed =
    entitlements?.features != null &&
    feature in entitlements.features &&
    entitlements.features[feature as keyof typeof entitlements.features] === true;

  if (allowed) {
    return <>{children}</>;
  }

  const message =
    upgradeMessage ?? 'Recurso disponível nos planos Pro e Business';

  // If a fallback was provided, render it instead of blurring children
  if (fallback != null) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      {/* Blurred children */}
      <div className="pointer-events-none select-none blur-sm opacity-40" aria-hidden>
        {children}
      </div>

      {/* Locked overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 backdrop-blur-[2px] rounded-lg">
        <span className="text-3xl" role="img" aria-label="locked">
          🔒
        </span>
        <p className="text-center text-sm font-medium text-gray-700 max-w-xs px-4">
          {message}
        </p>
        <Link
          href="/dashboard/billing"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
        >
          Fazer upgrade →
        </Link>
      </div>
    </div>
  );
}
