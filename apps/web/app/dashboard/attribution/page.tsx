'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { FEATURE_UPGRADE_MESSAGES } from '@/lib/config/plans';
import UpgradeGate from '@/components/UpgradeGate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceRow {
  source: string;
  leads: number;
  converted: number;
  conversionRate: number;
  revenue: number;
}

interface MediumRow {
  medium: string;
  leads: number;
  converted: number;
  revenue: number;
}

interface CampaignRow {
  campaign: string;
  leads: number;
  converted: number;
  revenue: number;
}

interface TouchRow {
  source: string;
  count: number;
}

interface ReportData {
  period: string;
  summary: {
    totalLeads: number;
    totalConverted: number;
    conversionRate: number;
    totalRevenue: number;
  };
  bySource: SourceRow[];
  byMedium: MediumRow[];
  byCampaign: CampaignRow[];
  firstTouch: TouchRow[];
  lastTouch: TouchRow[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  instagram_dm: 'Instagram DM',
  instagram_comment: 'Instagram Comentário',
  facebook_dm: 'Facebook DM',
  whatsapp: 'WhatsApp Direto',
  manual: 'Manual',
  template: 'Template Importado',
  unknown: 'Desconhecido',
};

const SOURCE_COLORS: Record<string, string> = {
  instagram_dm: 'bg-pink-400',
  instagram_comment: 'bg-purple-500',
  facebook_dm: 'bg-blue-500',
  whatsapp: 'bg-green-500',
  manual: 'bg-gray-400',
  template: 'bg-indigo-500',
  unknown: 'bg-slate-400',
};

const MEDIUM_LABELS: Record<string, string> = {
  organic: 'Orgânico',
  paid: 'Pago',
  referral: 'Indicação',
  direct: 'Direto',
  unknown: 'Desconhecido',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '')
      : '';
  return { Authorization: `Bearer ${token}` };
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accent ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarRow({
  label,
  widthPct,
  colorClass,
  leads,
  converted,
  conversionRate,
  revenue,
}: {
  label: string;
  widthPct: number;
  colorClass: string;
  leads: number;
  converted: number;
  conversionRate: number;
  revenue: number;
}) {
  return (
    <div className="grid grid-cols-[200px_1fr_80px_80px_80px_120px] items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
      <div className="h-5 rounded bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded transition-all ${colorClass}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className="text-sm text-gray-700 text-right">{leads}</span>
      <span className="text-sm text-gray-700 text-right">{converted}</span>
      <span className="text-sm text-gray-700 text-right">{conversionRate}%</span>
      <span className="text-sm text-gray-700 text-right">{fmtCurrency(revenue)}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttributionPage() {
  const ent = useEntitlements();
  const [period, setPeriod] = useState<'7days' | '30days' | 'all'>('30days');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attribution/report?period=${period}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (!ent.loading && !ent.features.advancedAnalytics) {
    return <UpgradeGate icon="🎯" title="Atribuição de Receita" message={FEATURE_UPGRADE_MESSAGES.advancedAnalytics} ctaPlan="Pro" />;
  }

  const maxSourceLeads = data?.bySource.length ? Math.max(...data.bySource.map((r) => r.leads)) : 1;
  const maxMediumLeads = data?.byMedium.length ? Math.max(...data.byMedium.map((r) => r.leads)) : 1;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Atribuição & Receita
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Pro+</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Rastreie a origem dos seus leads e o impacto em receita. Disponível no plano Pro e superiores.
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${loading ? 'opacity-50' : ''}`}>
        <SummaryCard
          label="Total de Leads"
          value={loading ? '...' : (data?.summary.totalLeads ?? 0)}
          sub="Contatos rastreados"
        />
        <SummaryCard
          label="Convertidos"
          value={loading ? '...' : (data?.summary.totalConverted ?? 0)}
          sub="Leads que fecharam"
          accent="text-emerald-600"
        />
        <SummaryCard
          label="Taxa de Conversão"
          value={loading ? '...' : `${data?.summary.conversionRate ?? 0}%`}
          sub="Convertidos / total"
          accent="text-indigo-600"
        />
        <SummaryCard
          label="Receita Total"
          value={loading ? '...' : fmtCurrency(data?.summary.totalRevenue ?? 0)}
          sub="De leads convertidos"
          accent="text-green-700"
        />
      </div>

      {/* By Source */}
      {!loading && data && data.bySource.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Por Origem</h2>
          {/* Column headers */}
          <div className="grid grid-cols-[200px_1fr_80px_80px_80px_120px] gap-3 pb-2 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Origem</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Volume</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Leads</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Conv.</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Taxa</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Receita</span>
          </div>
          {data.bySource.map((row) => (
            <BarRow
              key={row.source}
              label={SOURCE_LABELS[row.source] ?? row.source}
              widthPct={maxSourceLeads > 0 ? (row.leads / maxSourceLeads) * 100 : 0}
              colorClass={SOURCE_COLORS[row.source] ?? 'bg-slate-400'}
              leads={row.leads}
              converted={row.converted}
              conversionRate={row.conversionRate}
              revenue={row.revenue}
            />
          ))}
        </section>
      )}

      {/* By Medium */}
      {!loading && data && data.byMedium.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Por Mídia</h2>
          <div className="grid grid-cols-[200px_1fr_80px_80px_120px] gap-3 pb-2 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mídia</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Volume</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Leads</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Conv.</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Receita</span>
          </div>
          {data.byMedium.map((row) => (
            <div
              key={row.medium}
              className="grid grid-cols-[200px_1fr_80px_80px_120px] items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm font-medium text-gray-700 truncate">
                {MEDIUM_LABELS[row.medium] ?? row.medium}
              </span>
              <div className="h-5 rounded bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded bg-sky-400 transition-all"
                  style={{
                    width: `${maxMediumLeads > 0 ? (row.leads / maxMediumLeads) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-700 text-right">{row.leads}</span>
              <span className="text-sm text-gray-700 text-right">{row.converted}</span>
              <span className="text-sm text-gray-700 text-right">{fmtCurrency(row.revenue)}</span>
            </div>
          ))}
        </section>
      )}

      {/* First Touch vs Last Touch */}
      {!loading && data && (data.firstTouch.length > 0 || data.lastTouch.length > 0) && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            First Touch vs Last Touch
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Top 3 origens no primeiro contato do lead e no último contato antes da conversão.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* First touch */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Primeiro Contato</h3>
              <ol className="space-y-2">
                {data.firstTouch.map((row, idx) => (
                  <li key={row.source} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${SOURCE_COLORS[row.source] ?? 'bg-slate-400'}`}
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {SOURCE_LABELS[row.source] ?? row.source}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{row.count}</span>
                  </li>
                ))}
                {data.firstTouch.length === 0 && (
                  <li className="text-sm text-gray-400">Sem dados</li>
                )}
              </ol>
            </div>

            {/* Last touch */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Último Contato (Convertidos)
              </h3>
              <ol className="space-y-2">
                {data.lastTouch.map((row, idx) => (
                  <li key={row.source} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${SOURCE_COLORS[row.source] ?? 'bg-slate-400'}`}
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      {SOURCE_LABELS[row.source] ?? row.source}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{row.count}</span>
                  </li>
                ))}
                {data.lastTouch.length === 0 && (
                  <li className="text-sm text-gray-400">Sem conversões ainda</li>
                )}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!loading && data && data.summary.totalLeads === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Nenhum dado de atribuição no período.</p>
          <p className="text-sm mt-1">
            Registre pontos de contato via{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">POST /api/attribution</code> para
            ver métricas aqui.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="text-center py-16 text-gray-400 animate-pulse">
          Carregando relatório...
        </div>
      )}
    </div>
  );
}
