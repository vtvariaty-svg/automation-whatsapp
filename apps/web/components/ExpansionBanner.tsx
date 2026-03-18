'use client';

import { useEffect, useState } from 'react';
import ExpansionCTA from './ExpansionCTA';

interface ExpansionEvent {
  id: string;
  tenantId: string;
  trigger: string;
  currentPlan?: string | null;
  suggestedPlan?: string | null;
  detail?: string | null;
  shown: boolean;
  converted: boolean;
  convertedAt?: string | null;
  createdAt: string;
}

interface ExpansionResponse {
  events: ExpansionEvent[];
  suggestedPlan: string | null;
}

const TRIGGER_PRIORITY = [
  'limit_hit',
  'premium_blocked',
  'wants_multichannel',
  'high_lead_volume',
  'multi_agent',
];

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}` };
}

function pickTopEvent(events: ExpansionEvent[]): ExpansionEvent | null {
  for (const trigger of TRIGGER_PRIORITY) {
    const found = events.find((e) => e.trigger === trigger);
    if (found) return found;
  }
  return events[0] ?? null;
}

export default function ExpansionBanner() {
  const [topEvent, setTopEvent] = useState<ExpansionEvent | null>(null);
  const [suggestedPlan, setSuggestedPlan] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchExpansion() {
      try {
        const res = await fetch('/api/expansion', {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const data: ExpansionResponse = await res.json();

        if (cancelled) return;

        if (data.events && data.events.length > 0) {
          setTopEvent(pickTopEvent(data.events));
          setSuggestedPlan(data.suggestedPlan);
        }
      } catch {
        // Silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchExpansion();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDismiss() {
    if (!topEvent) return;

    try {
      await fetch('/api/expansion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ eventId: topEvent.id, action: 'dismissed' }),
      });
    } catch {
      // Silently ignore
    }

    setDismissed(true);
  }

  if (loading || dismissed || !topEvent) return null;

  const currentPlan = topEvent.currentPlan ?? 'starter';
  const suggested = topEvent.suggestedPlan ?? suggestedPlan ?? 'pro';

  return (
    <div className="px-4 py-2">
      <ExpansionCTA
        trigger={topEvent.trigger}
        currentPlan={currentPlan}
        suggestedPlan={suggested}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
