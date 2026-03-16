'use client';

import Link from 'next/link';

interface ExpansionCTAProps {
  trigger: string;
  currentPlan: string;
  suggestedPlan: string;
  onDismiss?: () => void;
}

const PLAN_PRICES: Record<string, string> = {
  starter: 'R$39,90',
  pro: 'R$79,90',
  business: 'R$149,00',
};

function getTriggerMessage(
  trigger: string,
  currentPlan: string,
  suggestedPlan: string,
): string {
  const planLabel = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

  switch (trigger) {
    case 'limit_hit':
      return `Você está usando 80%+ das mensagens do plano ${planLabel(currentPlan)}. Faça upgrade para ${planLabel(suggestedPlan)} e continue crescendo.`;
    case 'wants_multichannel':
      return `Instagram e Facebook disponíveis no plano ${planLabel(suggestedPlan)}. Conecte mais canais e alcance mais clientes.`;
    case 'high_lead_volume':
      return `Seu volume de leads está alto! O plano ${planLabel(suggestedPlan)} suporta mais automações e contatos.`;
    case 'premium_blocked':
      return `Você tentou usar recursos premium. Desbloqueie tudo no plano ${planLabel(suggestedPlan)}.`;
    case 'multi_agent':
      return `Adicione mais agentes com o plano ${planLabel(suggestedPlan)} e escale seu atendimento.`;
    default:
      return `Faça upgrade para o plano ${planLabel(suggestedPlan)} para continuar crescendo.`;
  }
}

function getTriggerGradient(trigger: string): string {
  switch (trigger) {
    case 'limit_hit':
      return 'from-red-500/20 to-orange-500/10 border-red-500/20';
    case 'wants_multichannel':
      return 'from-blue-500/20 to-purple-500/10 border-blue-500/20';
    case 'high_lead_volume':
      return 'from-green-500/20 to-emerald-500/10 border-green-500/20';
    case 'premium_blocked':
      return 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20';
    case 'multi_agent':
      return 'from-violet-500/20 to-violet-600/10 border-violet-500/20';
    default:
      return 'from-indigo-500/20 to-purple-500/10 border-indigo-500/20';
  }
}

function getTriggerIconColor(trigger: string): string {
  switch (trigger) {
    case 'limit_hit':
      return 'text-red-400';
    case 'wants_multichannel':
      return 'text-blue-400';
    case 'high_lead_volume':
      return 'text-green-400';
    case 'premium_blocked':
      return 'text-indigo-400';
    case 'multi_agent':
      return 'text-violet-400';
    default:
      return 'text-indigo-400';
  }
}

function getTriggerButtonStyle(trigger: string): string {
  switch (trigger) {
    case 'limit_hit':
      return 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600';
    case 'wants_multichannel':
      return 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600';
    case 'high_lead_volume':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600';
    case 'premium_blocked':
      return 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700';
    case 'multi_agent':
      return 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700';
    default:
      return 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600';
  }
}

function getTriggerIcon(trigger: string): string {
  switch (trigger) {
    case 'limit_hit':
      return '⚠️';
    case 'wants_multichannel':
      return '📱';
    case 'high_lead_volume':
      return '📈';
    case 'premium_blocked':
      return '🔒';
    case 'multi_agent':
      return '👥';
    default:
      return '✨';
  }
}

export default function ExpansionCTA({
  trigger,
  currentPlan,
  suggestedPlan,
  onDismiss,
}: ExpansionCTAProps) {
  const message = getTriggerMessage(trigger, currentPlan, suggestedPlan);
  const gradient = getTriggerGradient(trigger);
  const iconColor = getTriggerIconColor(trigger);
  const buttonStyle = getTriggerButtonStyle(trigger);
  const icon = getTriggerIcon(trigger);
  const price = PLAN_PRICES[suggestedPlan] ?? '';

  return (
    <div
      className={`relative rounded-xl p-4 border bg-gradient-to-r ${gradient} flex items-start gap-3`}
    >
      {/* Icon */}
      <span className={`text-xl mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium leading-snug">{message}</p>
        {price && (
          <p className="text-xs text-gray-400 mt-1">
            Plano{' '}
            <span className="font-semibold text-white">
              {suggestedPlan.charAt(0).toUpperCase() + suggestedPlan.slice(1)}
            </span>{' '}
            a partir de{' '}
            <span className="font-semibold text-white">{price}/mês</span>
          </p>
        )}
        <div className="mt-3">
          <Link
            href="/dashboard/billing"
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all shadow-sm ${buttonStyle}`}
          >
            Fazer Upgrade →
          </Link>
        </div>
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 text-gray-500 hover:text-white transition-colors p-0.5 rounded"
          aria-label="Fechar"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
