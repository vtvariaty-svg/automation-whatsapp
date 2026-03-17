'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFiscalDashboard } from '@/lib/fiscal/service';
import type { FiscalDashboardStats } from '@/lib/fiscal/types';
import FiscalSummaryCards from '@/components/fiscal/FiscalSummaryCards';
import FiscalIntegrationPanel from '@/components/fiscal/FiscalIntegrationPanel';

const SHORTCUTS = [
  { href: '/dashboard/fiscal/nova', icon: '📝', label: 'Nova emissão', desc: 'Emitir documento fiscal' },
  { href: '/dashboard/fiscal/historico', icon: '📋', label: 'Histórico', desc: 'Documentos emitidos' },
  { href: '/dashboard/fiscal/clientes', icon: '👥', label: 'Clientes', desc: 'Base de clientes fiscais' },
  { href: '/dashboard/fiscal/catalogo', icon: '📦', label: 'Produtos / Serviços', desc: 'Catálogo fiscal' },
  { href: '/dashboard/fiscal/configuracoes', icon: '⚙️', label: 'Configurações', desc: 'Dados da empresa' },
  { href: '/dashboard/fiscal/whatsapp', icon: '📱', label: 'Emissão por WhatsApp', desc: 'Receber via mensagem' },
];

const FLOW_STEPS = [
  { step: 'Painel', icon: '🖥️', desc: 'Crie o documento' },
  { step: 'Validação', icon: '✔️', desc: 'Dados verificados' },
  { step: 'Emissão', icon: '🧾', desc: 'Documento gerado' },
  { step: 'Envio', icon: '📨', desc: 'Cliente notificado' },
];

const WA_FLOW_STEPS = [
  { step: 'WhatsApp', icon: '📱', desc: 'Mensagem recebida' },
  { step: 'Extração', icon: '🤖', desc: 'IA extrai dados' },
  { step: 'Validação', icon: '✔️', desc: 'Operador confirma' },
  { step: 'Emissão', icon: '🧾', desc: 'Documento gerado' },
  { step: 'Envio', icon: '📨', desc: 'Cliente notificado' },
];

export default function FiscalDashboardPage() {
  const [stats, setStats] = useState<FiscalDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFiscalDashboard().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white text-lg">🧾</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Módulo Fiscal</h1>
          </div>
          <p className="text-sm text-gray-500 ml-[52px]">
            Gerencie emissões, histórico e clientes fiscais em um só lugar.
          </p>
        </div>
        <Link
          href="/dashboard/fiscal/nova"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          <span>＋</span> Nova emissão
        </Link>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-28" />
          ))}
        </div>
      ) : stats ? (
        <FiscalSummaryCards stats={stats} />
      ) : null}

      {/* Shortcuts */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="bg-white border border-gray-200/60 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <span className="text-xl">{s.icon}</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Integration Panel */}
      {stats && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Status da integração</h2>
          <FiscalIntegrationPanel status={stats.integrationStatus} />
        </div>
      )}

      {/* Flow explanation */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Panel flow */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🖥️</span>
            <h3 className="font-semibold text-gray-900 text-sm">Emissão pelo Painel</h3>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.step} className="flex items-center gap-1">
                <div className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-1">
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-500 leading-tight">{s.step}</p>
                </div>
                {i < FLOW_STEPS.length - 1 && <span className="text-gray-300 text-xs mx-0.5">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp flow */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📱</span>
            <h3 className="font-semibold text-gray-900 text-sm">Emissão por WhatsApp</h3>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {WA_FLOW_STEPS.map((s, i) => (
              <div key={s.step} className="flex items-center gap-1">
                <div className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-1">
                    <span className="text-base">{s.icon}</span>
                  </div>
                  <p className="text-[9px] font-semibold text-gray-500 leading-tight">{s.step}</p>
                </div>
                {i < WA_FLOW_STEPS.length - 1 && <span className="text-gray-300 text-xs mx-0.5">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
