'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChurnSignalRow {
  id: string;
  tenantId: string;
  signal: string;
  severity: string;
  detail?: string | null;
  resolved: boolean;
  resolvedAt?: string | null;
  createdAt: string;
}

interface TenantGroup {
  tenantId: string;
  tenantName: string;
  signals: ChurnSignalRow[];
}

interface TenantDetail {
  signals: ChurnSignalRow[];
  playbooks: PlaybookRow[];
  healthScore?: { score: number } | null;
}

interface PlaybookRow {
  id: string;
  tenantId: string;
  signal: string;
  action: string;
  status: string;
  sentAt?: string | null;
  createdAt: string;
}

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  };
}

const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const SEVERITY_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const SIGNAL_LABELS: Record<string, string> = {
  no_channel: 'Sem Canal',
  no_automation: 'Sem Automação',
  usage_drop: 'Queda de Uso',
  trial_expiring: 'Trial Expirando',
  paid_inactive: 'Pago Inativo',
};

const ACTION_LABELS: Record<string, string> = {
  reconnect_prompted: 'Reconectar Canal',
  template_suggested: 'Sugerir Template',
  support_invited: 'Convidar Suporte',
  nudge_shown: 'Nudge Exibido',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  sent: 'bg-indigo-100 text-indigo-700',
  dismissed: 'bg-gray-100 text-gray-500',
  converted: 'bg-green-100 text-green-700',
};

const SEVERITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

function maxSeverity(signals: ChurnSignalRow[]): string {
  return signals.reduce(
    (best, s) =>
      (SEVERITY_ORDER[s.severity] ?? 0) > (SEVERITY_ORDER[best] ?? 0)
        ? s.severity
        : best,
    'low',
  );
}

// Default playbook action per signal
const DEFAULT_PLAYBOOK_ACTION: Record<string, string> = {
  no_channel: 'reconnect_prompted',
  no_automation: 'template_suggested',
  usage_drop: 'support_invited',
  trial_expiring: 'nudge_shown',
  paid_inactive: 'support_invited',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChurnPage() {
  const [data, setData] = useState<TenantGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{ scanned: number; newSignals: number } | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, TenantDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [creatingPlaybook, setCreatingPlaybook] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ resolved: 'false' });
      if (severityFilter !== 'all') params.set('severity', severityFilter);
      const res = await fetch(`/api/admin/churn?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [severityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleScan() {
    setScanLoading(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/admin/churn/scan', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setScanResult(json);
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setScanLoading(false);
    }
  }

  async function loadTenantDetail(tenantId: string) {
    if (detailData[tenantId]) return;
    setDetailLoading(tenantId);
    try {
      const res = await fetch(`/api/admin/churn/${tenantId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const json: TenantDetail = await res.json();
        setDetailData((prev) => ({ ...prev, [tenantId]: json }));
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(null);
    }
  }

  function toggleExpand(tenantId: string) {
    if (expandedTenantId === tenantId) {
      setExpandedTenantId(null);
    } else {
      setExpandedTenantId(tenantId);
      loadTenantDetail(tenantId);
    }
  }

  async function resolveSignal(tenantId: string, signalId: string) {
    setResolvingId(signalId);
    try {
      const res = await fetch(`/api/admin/churn/${tenantId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'resolve_signal', signalId }),
      });
      if (res.ok) {
        // Refresh detail and list
        setDetailData((prev) => {
          const detail = prev[tenantId];
          if (!detail) return prev;
          return {
            ...prev,
            [tenantId]: {
              ...detail,
              signals: detail.signals.map((s) =>
                s.id === signalId ? { ...s, resolved: true, resolvedAt: new Date().toISOString() } : s,
              ),
            },
          };
        });
        await fetchData();
      }
    } catch {
      // ignore
    } finally {
      setResolvingId(null);
    }
  }

  async function createPlaybook(tenantId: string, signal: string, playbookAction: string) {
    setCreatingPlaybook(`${tenantId}-${signal}`);
    try {
      const res = await fetch(`/api/admin/churn/${tenantId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'create_playbook', signal, playbookAction }),
      });
      if (res.ok) {
        // Reload detail data
        setDetailData((prev) => {
          const next = { ...prev };
          delete next[tenantId];
          return next;
        });
        await loadTenantDetail(tenantId);
      }
    } catch {
      // ignore
    } finally {
      setCreatingPlaybook(null);
    }
  }

  // Summary counts
  const highCount = data.filter((g) => maxSeverity(g.signals) === 'high').length;
  const mediumCount = data.filter((g) => maxSeverity(g.signals) === 'medium').length;
  const totalSignals = data.reduce((sum, g) => sum + g.signals.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prevenção de Churn</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sinais de risco detectados por tenant
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={fetchData}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Atualizar
          </button>
          <button
            onClick={handleScan}
            disabled={scanLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {scanLoading ? 'Escaneando...' : 'Escanear Todos os Tenants'}
          </button>
        </div>
      </div>

      {/* Scan result */}
      {scanResult && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Escaneados <strong>{scanResult.scanned}</strong> tenants —{' '}
          <strong>{scanResult.newSignals}</strong> sinais detectados.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Grupos', value: data.length, color: 'text-gray-900' },
          { label: 'Sinais Alta Severidade', value: highCount, color: 'text-red-600' },
          { label: 'Total de Sinais', value: totalSignals, color: 'text-yellow-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Severity filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as SeverityFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setSeverityFilter(f)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              severityFilter === f
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'high' ? 'Alta' : f === 'medium' ? 'Média' : 'Baixa'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            Carregando sinais...
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm">Nenhum sinal de churn encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((group) => {
              const topSeverity = maxSeverity(group.signals);
              const isExpanded = expandedTenantId === group.tenantId;
              const detail = detailData[group.tenantId];

              return (
                <div key={group.tenantId}>
                  {/* Tenant row */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(group.tenantId)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className={`text-xs transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        ▶
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{group.tenantName}</p>
                        <p className="text-xs text-gray-500">{group.tenantId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-gray-600">
                        {group.signals.length} sinal{group.signals.length !== 1 ? 'is' : ''}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          SEVERITY_COLORS[topSeverity] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {SEVERITY_LABELS[topSeverity] ?? topSeverity}
                      </span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="bg-gray-50 px-6 py-4 space-y-4 border-t border-gray-100">
                      {detailLoading === group.tenantId && (
                        <p className="text-sm text-gray-500">Carregando detalhes...</p>
                      )}

                      {detail && (
                        <>
                          {/* Signals list */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Sinais
                            </p>
                            <div className="space-y-2">
                              {detail.signals
                                .filter((s) => !s.resolved)
                                .map((signal) => (
                                  <div
                                    key={signal.id}
                                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-900">
                                          {SIGNAL_LABELS[signal.signal] ?? signal.signal}
                                        </span>
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                            SEVERITY_COLORS[signal.severity] ?? ''
                                          }`}
                                        >
                                          {SEVERITY_LABELS[signal.severity] ?? signal.severity}
                                        </span>
                                      </div>
                                      {signal.detail && (
                                        <p className="text-xs text-gray-500 mt-0.5">{signal.detail}</p>
                                      )}
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {format(parseISO(signal.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {/* Create playbook */}
                                      <button
                                        onClick={() =>
                                          createPlaybook(
                                            group.tenantId,
                                            signal.signal,
                                            DEFAULT_PLAYBOOK_ACTION[signal.signal] ?? 'support_invited',
                                          )
                                        }
                                        disabled={creatingPlaybook === `${group.tenantId}-${signal.signal}`}
                                        className="rounded border border-indigo-300 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                                      >
                                        {creatingPlaybook === `${group.tenantId}-${signal.signal}`
                                          ? 'Criando...'
                                          : 'Criar Playbook'}
                                      </button>
                                      {/* Resolve */}
                                      <button
                                        onClick={() => resolveSignal(group.tenantId, signal.id)}
                                        disabled={resolvingId === signal.id}
                                        className="rounded border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                                      >
                                        {resolvingId === signal.id ? '...' : 'Resolver'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              {detail.signals.filter((s) => !s.resolved).length === 0 && (
                                <p className="text-sm text-gray-500">Nenhum sinal ativo.</p>
                              )}
                            </div>
                          </div>

                          {/* Playbooks list */}
                          {detail.playbooks.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Playbooks
                              </p>
                              <div className="space-y-1">
                                {detail.playbooks.map((pb) => (
                                  <div
                                    key={pb.id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
                                  >
                                    <div>
                                      <span className="text-xs font-medium text-gray-800">
                                        {SIGNAL_LABELS[pb.signal] ?? pb.signal}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        → {ACTION_LABELS[pb.action] ?? pb.action}
                                      </span>
                                    </div>
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                        STATUS_COLORS[pb.status] ?? 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {pb.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Health score */}
                          {detail.healthScore && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Health Score:</span>
                              <span
                                className={`text-sm font-bold ${
                                  detail.healthScore.score >= 70
                                    ? 'text-green-600'
                                    : detail.healthScore.score >= 40
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {detail.healthScore.score}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
