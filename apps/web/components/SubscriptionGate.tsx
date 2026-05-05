'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isCurrentPublicPlan, isSubscriptionUsable } from '@/lib/auth/subscriptionAccess';

const BILLING_PATH = '/dashboard/billing';

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Superadmin bypasses all subscription checks
    if (isSuperAdmin) { setChecked(true); return; }
    // Billing page is always accessible (users need to upgrade from here)
    if (pathname?.startsWith(BILLING_PATH)) { setChecked(true); return; }
    // Wait for auth to resolve before running subscription check
    if (authLoading || !user) return;

    const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
    fetch('/api/billing/subscription', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setChecked(true); return; }
        const usable = isCurrentPublicPlan(data.plan) && isSubscriptionUsable({ status: data.status, trialEnd: data.trialEnd });
        if (!usable) {
          router.replace(`${BILLING_PATH}?reason=subscription_required`);
          return;
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [authLoading, isSuperAdmin, pathname, router, user]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
