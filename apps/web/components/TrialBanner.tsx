'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';

interface SubscriptionData {
  status: string;
  trialEnd: string | null;
  plan: string | null;
}

export default function TrialBanner() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
    fetch('/api/billing/subscription', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data || data.status !== 'trialing' || !data.trialEnd) {
    return null;
  }

  const daysLeft = differenceInDays(new Date(data.trialEnd), new Date());
  const expired = daysLeft <= 0;

  return (
    <div
      className={`w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-white ${
        expired
          ? 'bg-gradient-to-r from-rose-600 to-red-500'
          : 'bg-gradient-to-r from-indigo-600 to-indigo-500'
      }`}
    >
      <span>
        {expired
          ? '⛔ Trial expirado — faça upgrade para continuar'
          : `⏳ Trial expira em ${daysLeft} dia${daysLeft === 1 ? '' : 's'} — faça upgrade para manter o acesso`}
      </span>
      <Link
        href="/dashboard/billing"
        className={`ml-4 shrink-0 rounded px-3 py-1 text-xs font-semibold transition-colors ${
          expired
            ? 'bg-white text-rose-600 hover:bg-rose-50'
            : 'bg-white text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        Fazer upgrade →
      </Link>
    </div>
  );
}
