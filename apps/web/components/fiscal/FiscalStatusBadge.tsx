'use client';

import type { FiscalDocumentStatus } from '@/lib/fiscal/types';
import { FISCAL_STATUS_LABELS } from '@/lib/fiscal/types';

const STATUS_STYLES: Record<FiscalDocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pendente_validacao: 'bg-amber-50 text-amber-700 border border-amber-200',
  aguardando_confirmacao: 'bg-blue-50 text-blue-700 border border-blue-200',
  pronto_para_emitir: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  emitido_mock: 'bg-gray-100 text-gray-500 border border-gray-200',
  erro_mock: 'bg-red-50 text-red-700 border border-red-200',
  cancelado: 'bg-gray-100 text-gray-500 line-through',
  // Real integration statuses
  processando: 'bg-blue-50 text-blue-700 border border-blue-200',
  autorizado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  erro_sefaz: 'bg-red-50 text-red-700 border border-red-200',
  cancelado_sefaz: 'bg-gray-100 text-gray-500',
};

const STATUS_DOTS: Record<FiscalDocumentStatus, string> = {
  draft: 'bg-gray-400',
  pendente_validacao: 'bg-amber-400',
  aguardando_confirmacao: 'bg-blue-400',
  pronto_para_emitir: 'bg-indigo-400',
  emitido_mock: 'bg-gray-400',
  erro_mock: 'bg-red-400',
  cancelado: 'bg-gray-400',
  // Real integration statuses
  processando: 'bg-blue-400 animate-pulse',
  autorizado: 'bg-emerald-400',
  erro_sefaz: 'bg-red-400',
  cancelado_sefaz: 'bg-gray-400',
};

interface FiscalStatusBadgeProps {
  status: FiscalDocumentStatus;
  size?: 'sm' | 'md';
}

export default function FiscalStatusBadge({ status, size = 'md' }: FiscalStatusBadgeProps) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${textSize} ${padding} ${STATUS_STYLES[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOTS[status]}`} />
      {FISCAL_STATUS_LABELS[status]}
    </span>
  );
}
