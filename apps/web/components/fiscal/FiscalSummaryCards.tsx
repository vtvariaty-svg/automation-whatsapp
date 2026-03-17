'use client';

import type { FiscalDashboardStats } from '@/lib/fiscal/types';

interface FiscalSummaryCardsProps {
  stats: FiscalDashboardStats;
}

export default function FiscalSummaryCards({ stats }: FiscalSummaryCardsProps) {
  const cards = [
    {
      label: 'Solicitações hoje',
      value: stats.solicitacoesHoje,
      icon: '📥',
      color: 'from-blue-50 to-indigo-50 border-blue-100',
      textColor: 'text-blue-600',
    },
    {
      label: 'Documentos emitidos',
      value: stats.documentosEmitidos,
      icon: '✅',
      color: 'from-emerald-50 to-teal-50 border-emerald-100',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Pendentes de validação',
      value: stats.pendenteValidacao,
      icon: '⏳',
      color: 'from-amber-50 to-yellow-50 border-amber-100',
      textColor: 'text-amber-600',
    },
    {
      label: 'Erros / Atenção',
      value: stats.erros,
      icon: '⚠️',
      color: 'from-red-50 to-rose-50 border-red-100',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.color} border rounded-2xl p-5`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">{card.icon}</span>
          </div>
          <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
          <p className="text-xs text-gray-500 mt-1 leading-tight">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
