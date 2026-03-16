'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantAttributionRow {
  tenantId: string;
  tenantName: string;
  totalLeads: number;
  totalConverted: number;
  conversionRate: number;
  totalRevenue: number;
  topSource: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  instagram_dm: 'Instagram DM',
  instagram_comment: 'Instagram Comentário',
  facebook_dm: 'Facebook DM',
  whatsapp: 'WhatsApp',
  manual: 'Manual',
  template: 'Template',
  unknown: 'Desconhecido',
};

const SOURCE_BADGE_COLORS: Record<string, string> = {
  instagram_dm: 'bg-pink-100 text-pink-700',
  instagram_comment: 'bg-purple-100 text-purple-700',
  facebook_dm: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
  manual: 'bg-gray-100 text-gray-700',
  template: 'bg-indigo-100 text-indigo-700',
  unknown: 'bg-slate-100 text-slate-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` };
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAttributionPage() {
  const [period, setPeriod] = useState<'7days' | '30days' | 'all'>('30days');
  const [tenantFilter, setTenantFilter] = useState('');
  const [data, setData] = useState<TenantAttributionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      if (tenantFilter.trim()) params.set('tenantId', tenantFilter.trim());

      const res = await fetch(`/api/admin/attribution?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.status === 403) {
        setError('Acesso negado. Apenas superadmin pode ver este relatório.');
        return;
      }
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [period, tenantFilter]);

  // Auto-fetch on period change; tenantFilter is applied only on form submit
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Summary totals
  const totals = data.reduce(
    (acc, row) => ({
      leads: acc.leads + row.totalLeads,
      converted: acc.converted + row.totalConverted,
      revenue: acc.revenue + row.totalRevenue,
    }),
    { leads: 0, converted: 0, revenue: 0 }
  );
  const totalConversionRate =
    totals.leads > 0 ? Math.round((totals.converted / totals.leads) * 10000) / 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Atribuição — Visão Geral
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Resumo cross-tenant de atribuição e receita. Superadmin only.
          </p>
        </div>

        {/* Period selector */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-1 inline-flex">
          {(['7days', '30days', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === p
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p === '7days' ? '7 dias' : p === '30days' ? '30 dias' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant filter */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          placeholder="Filtrar por Tenant ID (opcional)"
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={fetchReport}
          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Buscar
        </button>
        {tenantFilter && (
          <button
            onClick={() => {
              setTenantFilter('');
              // re-fetch without filter
              setTimeout(fetchReport, 0);
            }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${loading ? 'opacity-50' : ''}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tenant
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Leads
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Convertidos
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Taxa
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Receita
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Top Origem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 animate-pulse">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && !error && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Nenhum dado encontrado.
                </td>
              </tr>
            )}
            {!loading &&
              data.map((row) => (
                <tr key={row.tenantId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{row.tenantName}</p>
                    <p className="text-xs text-gray-400 font-mono">{row.tenantId}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {row.totalLeads}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-700">
                    {row.totalConverted}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {row.conversionRate}%
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {fmtCurrency(row.totalRevenue)}
                  </td>
                  <td className="px-4 py-3">
                    {row.topSource ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          SOURCE_BADGE_COLORS[row.topSource] ?? 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {SOURCE_LABELS[row.topSource] ?? row.topSource}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
          {/* Summary totals row */}
          {!loading && data.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                <td className="px-6 py-3 text-gray-700">
                  Total ({data.length} tenant{data.length !== 1 ? 's' : ''})
                </td>
                <td className="px-4 py-3 text-right text-gray-900">{totals.leads}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{totals.converted}</td>
                <td className="px-4 py-3 text-right text-gray-900">{totalConversionRate}%</td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {fmtCurrency(totals.revenue)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
