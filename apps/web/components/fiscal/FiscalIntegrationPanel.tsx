'use client';

import type { FiscalIntegrationStatus } from '@/lib/fiscal/types';

interface FiscalIntegrationPanelProps {
  status: FiscalIntegrationStatus;
}

const STATUS_CONFIG: Record<
  FiscalIntegrationStatus,
  { label: string; description: string; icon: string; color: string; dot: string }
> = {
  desconectado: {
    label: 'Não conectado',
    description: 'O backend fiscal externo ainda não foi configurado. Configure em Configurações Fiscais.',
    icon: '🔌',
    color: 'bg-gray-50 border-gray-200',
    dot: 'bg-gray-400',
  },
  em_validacao: {
    label: 'Integração em validação',
    description: 'A conexão com o backend fiscal está sendo validada. Este processo pode levar alguns dias.',
    icon: '🔄',
    color: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-400 animate-pulse',
  },
  ativo: {
    label: 'Integração ativa',
    description: 'O backend fiscal está conectado e operacional. Emissões reais estão habilitadas.',
    icon: '🟢',
    color: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-400',
  },
};

export default function FiscalIntegrationPanel({ status }: FiscalIntegrationPanelProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`rounded-2xl border p-5 ${cfg.color}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{cfg.icon}</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className="text-sm font-semibold text-gray-900">{cfg.label}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{cfg.description}</p>
      {status !== 'ativo' && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 rounded-lg border border-gray-200/60 text-[11px] font-medium text-gray-500">
          <span>🧾</span>
          Simulação visual ativa — pronto para conexão com backend fiscal
        </div>
      )}
    </div>
  );
}
