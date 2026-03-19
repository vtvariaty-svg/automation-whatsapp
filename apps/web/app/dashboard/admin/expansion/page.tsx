'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface ExpansionEvent {
  id: string;
  trigger: string;
  currentPlan?: string | null;
  suggestedPlan?: string | null;
  shown: boolean;
  converted: boolean;
  createdAt: string;
}

interface Opportunity {
  tenantId: string;
  tenantName: string;
  plan: string;
  events: ExpansionEvent[];
  topTrigger: string;
  estimatedUpgrade: string;
  potentialRevenue: number;
}

interface ApiResponse {
  opportunities: Opportunity[];
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${(localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}` };
}

const TRIGGER_LABELS: Record<string, string> = {
  limit_hit: 'Limite de Mensagens',
  wants_multichannel: 'Multicanal',
  high_lead_volume: 'Alto Volume Leads',
  premium_blocked: 'Premium Bloqueado',
  multi_agent: 'Multi-Agente',
};

const TRIGGER_COLORS: Record<string, string> = {
  limit_hit: 'bg-red-500/20 text-red-300 border-red-500/20',
  wants_multichannel: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  high_lead_volume: 'bg-green-500/20 text-green-300 border-green-500/20',
  premium_blocked: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20',
  multi_agent: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-500/20 text-gray-300 border-gray-500/20',
  pro: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  business: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
};

export default function ExpansionOpsPage() {
  const { isSuperAdmin } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/expansion?converted=false', {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setOpportunities(data.opportunities ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const totalOpportunities = opportunities.length;
  const totalConverted = opportunities.filter((o) =>
    o.events.some((e) => e.converted),
  ).length;
  const conversionRate =
    totalOpportunities > 0
      ? ((totalConverted / totalOpportunities) * 100).toFixed(1)
      : '0.0';
  const totalRevenue = opportunities.reduce((sum, o) => sum + o.potentialRevenue, 0);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-300">Acesso restrito</p>
          <p className="text-sm text-gray-500 mt-1">Esta página é exclusiva para superadmins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            💰 Expansion Ops — Oportunidades de Upsell
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Tenants com sinais de upgrade detectados automaticamente
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-300 hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? <span>Carregando...</span> : <span>↻ Atualizar</span>}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Oportunidades</p>
          <p className="text-2xl font-bold text-white">{totalOpportunities}</p>
        </div>
        <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Convertidas</p>
          <p className="text-2xl font-bold text-green-400">{totalConverted}</p>
        </div>
        <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Taxa de Conversão</p>
          <p className="text-2xl font-bold text-blue-400">{conversionRate}%</p>
        </div>
        <div className="bg-[#0c1120] rounded-xl p-4 border border-white/[0.06]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Receita Potencial</p>
          <p className="text-2xl font-bold text-purple-400">
            R${' '}
            {totalRevenue.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-[#0c1120] rounded-xl border border-white/[0.06] overflow-hidden">
          {opportunities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma oportunidade de upsell encontrada.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Plano Atual
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Trigger Principal
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Eventos
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Sugestão
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Receita Potencial
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {opportunities.map((opp) => (
                      <tr
                        key={opp.tenantId}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{opp.tenantName}</p>
                          <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                            {opp.tenantId.slice(0, 8)}...
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                              PLAN_COLORS[opp.plan] ?? PLAN_COLORS.starter
                            }`}
                          >
                            {opp.plan.charAt(0).toUpperCase() + opp.plan.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                              TRIGGER_COLORS[opp.topTrigger] ??
                              'bg-gray-500/20 text-gray-300 border-gray-500/20'
                            }`}
                          >
                            {TRIGGER_LABELS[opp.topTrigger] ?? opp.topTrigger}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/5 text-white font-bold text-xs">
                            {opp.events.length}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-purple-400 font-semibold">
                            {opp.estimatedUpgrade.charAt(0).toUpperCase() +
                              opp.estimatedUpgrade.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-400 font-semibold">
                            R${' '}
                            {opp.potentialRevenue.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href="/dashboard/billing"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/20 text-purple-300 text-xs font-medium transition-colors"
                          >
                            Ver Billing →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Revenue total footer */}
              <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                <span className="text-xs text-gray-500">
                  {opportunities.length} tenant(s) com oportunidade de upsell
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Receita potencial total:</span>
                  <span className="text-sm font-bold text-green-400">
                    R${' '}
                    {totalRevenue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    /mês
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-[#0c1120] rounded-xl border border-white/[0.06] p-8 text-center text-gray-500">
          Carregando oportunidades...
        </div>
      )}
    </div>
  );
}
