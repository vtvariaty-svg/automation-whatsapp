'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BreakdownEntry {
  channel: number;
  automations: number;
  conversations: number;
  inboundMessages: number;
  aiMessages: number;
  leads: number;
  appointments: number;
}

interface TenantHealth {
  tenantId: string;
  tenantName: string;
  plan: string;
  score: number;
  riskLevel: string;
  expansionSignal: boolean;
  breakdown: BreakdownEntry;
  lastActivity: string | null;
}

type Period = '7days' | '14days' | '30days';
type RiskFilter = 'all' | 'healthy' | 'at_risk' | 'churning';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  };
}

const RISK_COLORS: Record<string, string> = {
  healthy: 'bg-green-100 text-green-700',
  at_risk: 'bg-yellow-100 text-yellow-700',
  churning: 'bg-red-100 text-red-700',
};

const RISK_LABELS: Record<string, string> = {
  healthy: 'Saudável',
  at_risk: 'Em Risco',
  churning: 'Churnando',
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 tabular-nums">{score}</span>
    </div>
  );
}

const BREAKDOWN_LABELS: Record<keyof BreakdownEntry, string> = {
  channel: 'Canal conectado',
  automations: 'Automações ativas',
  conversations: 'Conversas no período',
  inboundMessages: 'Mensagens recebidas (>5)',
  aiMessages: 'Mensagens de IA',
  leads: 'Leads gerados',
  appointments: 'Agendamentos / Vendas',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RetentionPage() {
  const [data, setData] = useState<TenantHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30days');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (riskFilter !== 'all') params.set('riskLevel', riskFilter);

      const res = await fetch(`/api/admin/retention?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [period, riskFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function recalculate(tenantId: string) {
    setRecalculating(tenantId);
    try {
      const res = await fetch(`/api/admin/retention/${tenantId}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        // Refresh list after recompute
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setRecalculating(null);
    }
  }

  // ─── Summary cards ───────────────────────────────────────────────────────────
  const totalTenants = data.length;
  const healthyCnt = data.filter((d) => d.riskLevel === 'healthy').length;
  const atRiskCnt = data.filter((d) => d.riskLevel === 'at_risk').length;
  const churningCnt = data.filter((d) => d.riskLevel === 'churning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retenção &amp; Expansão</h1>
          <p className="text-sm text-gray-500 mt-1">
            Health score por tenant — mais em risco primeiro
          </p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalTenants, color: 'text-gray-900' },
          { label: 'Saudável', value: healthyCnt, color: 'text-green-600' },
          { label: 'Em Risco', value: atRiskCnt, color: 'text-yellow-600' },
          { label: 'Churnando', value: churningCnt, color: 'text-red-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        {/* Period */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Período</label>
          <div className="flex gap-1">
            {(['7days', '14days', '30days'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p === '7days' ? '7 dias' : p === '14days' ? '14 dias' : '30 dias'}
              </button>
            ))}
          </div>
        </div>

        {/* Risk filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Risco</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos</option>
            <option value="healthy">Saudável</option>
            <option value="at_risk">Em Risco</option>
            <option value="churning">Churnando</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            Calculando scores...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm">Nenhum tenant encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Risco
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Expansão
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Última Atividade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row) => (
                  <React.Fragment key={row.tenantId}>
                    <tr
                      key={row.tenantId}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedRow(expandedRow === row.tenantId ? null : row.tenantId)
                      }
                    >
                      {/* Tenant name */}
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs ${expandedRow === row.tenantId ? 'rotate-90' : ''} transition-transform inline-block`}
                          >
                            ▶
                          </span>
                          {row.tenantName}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3 capitalize text-gray-600">{row.plan}</td>

                      {/* Score bar */}
                      <td className="px-4 py-3">
                        <ScoreBar score={row.score} />
                      </td>

                      {/* Risk badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            RISK_COLORS[row.riskLevel] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {RISK_LABELS[row.riskLevel] ?? row.riskLevel}
                        </span>
                      </td>

                      {/* Expansion signal */}
                      <td className="px-4 py-3">
                        {row.expansionSignal ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-xs font-medium">
                            Expandir
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Last activity */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {row.lastActivity
                          ? format(parseISO(row.lastActivity), "dd MMM yyyy", { locale: ptBR })
                          : '—'}
                      </td>

                      {/* Recalculate button */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => recalculate(row.tenantId)}
                          disabled={recalculating === row.tenantId}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {recalculating === row.tenantId ? 'Calculando...' : 'Recalcular'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded breakdown row */}
                    {expandedRow === row.tenantId && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-8 py-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Breakdown de métricas
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(Object.keys(row.breakdown) as (keyof BreakdownEntry)[]).map((key) => {
                              const pts = row.breakdown[key];
                              const isPositive = pts > 0;
                              return (
                                <div
                                  key={key}
                                  className={`rounded-lg border p-3 ${
                                    isPositive
                                      ? 'border-green-200 bg-green-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <p className="text-xs text-gray-600">{BREAKDOWN_LABELS[key]}</p>
                                  <p
                                    className={`text-lg font-bold mt-1 ${
                                      isPositive ? 'text-green-700' : 'text-gray-400'
                                    }`}
                                  >
                                    +{pts}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
