'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChurnSignal {
  id: string;
  signal: string;
  severity: string;
  detail?: string | null;
  resolved: boolean;
}

interface ChurnPlaybook {
  id: string;
  signal: string;
  action: string;
  status: string;
}

// ─── Priority order for nudges ────────────────────────────────────────────────

const SIGNAL_PRIORITY: Record<string, number> = {
  trial_expiring: 5,
  no_channel: 4,
  usage_drop: 3,
  no_automation: 2,
  paid_inactive: 1,
};

// ─── Nudge content per action ─────────────────────────────────────────────────

type NudgeConfig = {
  message: (detail?: string | null) => string;
  ctaLabel: string;
  ctaHref: string;
};

const NUDGE_CONFIGS: Record<string, NudgeConfig> = {
  reconnect_prompted: {
    message: () => 'Conecte seu canal para começar a receber mensagens',
    ctaLabel: 'Reconectar Canal →',
    ctaHref: '/dashboard/integrations',
  },
  template_suggested: {
    message: () => 'Instale um template do seu nicho em minutos',
    ctaLabel: 'Ver Templates →',
    ctaHref: '/dashboard/onboarding',
  },
  support_invited: {
    message: (detail) => detail ?? 'Detectamos queda no uso. Podemos ajudar?',
    ctaLabel: 'Falar com Suporte →',
    ctaHref: 'mailto:suporte@variaty.com.br',
  },
  nudge_shown: {
    message: (detail) => detail ?? 'Seu trial expira em breve. Ative agora para não perder o acesso',
    ctaLabel: 'Ativar Agora →',
    ctaHref: '/dashboard/billing',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChurnNudge() {
  const [playbooks, setPlaybooks] = useState<ChurnPlaybook[]>([]);
  const [signals, setSignals] = useState<ChurnSignal[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token') ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? '';
    fetch('/api/churn', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPlaybooks(data.playbooks ?? []);
          setSignals(data.signals ?? []);
        }
      })
      .catch(() => {});
  }, []);

  // Find the highest-priority pending playbook that hasn't been locally dismissed
  const activePlaybook = playbooks
    .filter(
      (p) =>
        p.status === 'pending' &&
        !dismissedIds.has(p.id),
    )
    .sort(
      (a, b) =>
        (SIGNAL_PRIORITY[b.signal] ?? 0) - (SIGNAL_PRIORITY[a.signal] ?? 0),
    )[0];

  if (!activePlaybook) return null;

  const config = NUDGE_CONFIGS[activePlaybook.action];
  if (!config) return null;

  // Find matching signal for detail text
  const matchingSignal = signals.find(
    (s) => s.signal === activePlaybook.signal && !s.resolved,
  );

  async function handleDismiss() {
    if (dismissing) return;
    setDismissing(true);
    try {
      const token = localStorage.getItem('auth_token') ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? '';
      await fetch('/api/churn', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ playbookId: activePlaybook!.id, action: 'dismiss' }),
      });
      setDismissedIds((prev) => new Set([...prev, activePlaybook!.id]));
    } catch {
      // Dismiss locally even if request fails
      setDismissedIds((prev) => new Set([...prev, activePlaybook!.id]));
    } finally {
      setDismissing(false);
    }
  }

  const isExternal = config.ctaHref.startsWith('mailto:');

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Icon */}
        <span className="text-amber-500 shrink-0" aria-hidden="true">
          {activePlaybook.action === 'nudge_shown' && '⏰'}
          {activePlaybook.action === 'reconnect_prompted' && '🔌'}
          {activePlaybook.action === 'template_suggested' && '✨'}
          {activePlaybook.action === 'support_invited' && '💬'}
        </span>

        {/* Message */}
        <span className="text-amber-800 font-medium truncate">
          {config.message(matchingSignal?.detail)}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* CTA */}
        {isExternal ? (
          <a
            href={config.ctaHref}
            className="rounded px-3 py-1 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            {config.ctaLabel}
          </a>
        ) : (
          <Link
            href={config.ctaHref}
            className="rounded px-3 py-1 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            {config.ctaLabel}
          </Link>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Fechar aviso"
          className="text-amber-500 hover:text-amber-700 transition-colors disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
