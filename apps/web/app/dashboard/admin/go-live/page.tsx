'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  key: string;
  label: string;
  passed: boolean;
  detail?: string;
}

interface GoLiveStatus {
  tenantId: string;
  tenantName: string;
  operationalStatus: string;
  checklist: ChecklistItem[];
  allPassed: boolean;
  noUsageAlert: boolean;
}

type StatusFilter = 'all' | 'setup' | 'ready' | 'live' | 'paused' | 'blocked';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('token') ?? '')
      : '';
  return { Authorization: `Bearer ${token}` };
}

const STATUS_COLORS: Record<string, string> = {
  setup: 'bg-gray-100 text-gray-700 border-gray-300',
  ready: 'bg-blue-100 text-blue-700 border-blue-300',
  live: 'bg-green-100 text-green-700 border-green-300',
  paused: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  blocked: 'bg-red-100 text-red-700 border-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  setup: 'Setup',
  ready: 'Ready',
  live: 'Live',
  paused: 'Pausado',
  blocked: 'Bloqueado',
};

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'setup', label: 'Setup' },
  { key: 'ready', label: 'Ready' },
  { key: 'live', label: 'Live' },
  { key: 'paused', label: 'Pausado' },
  { key: 'blocked', label: 'Bloqueado' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  count,
  colorClass,
  onClick,
  active,
}: {
  label: string;
  count: number;
  colorClass: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
        active ? 'border-indigo-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
      } bg-white`}
    >
      <span className={`text-2xl font-bold ${colorClass}`}>{count}</span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminGoLivePage() {
  const [data, setData] = useState<GoLiveStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');

  const fetchData = useCallback(async (filter: StatusFilter = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filter === 'all'
          ? '/api/admin/go-live'
          : `/api/admin/go-live?status=${filter}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: GoLiveStatus[] = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeFilter);
  }, [fetchData, activeFilter]);

  const performAction = async (
    tenantId: string,
    action: 'activate' | 'pause' | 'block' | 'unblock' | 'deactivate',
  ) => {
    setActionLoadingId(tenantId);
    setActionErrors((prev) => ({ ...prev, [tenantId]: '' }));
    try {
      const res = await fetch(`/api/admin/go-live/${tenantId}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await fetchData(activeFilter);
    } catch (e) {
      setActionErrors((prev) => ({
        ...prev,
        [tenantId]: e instanceof Error ? e.message : 'Erro ao executar ação',
      }));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Summary counts from current full data (always fetch 'all' for counts)
  const [allData, setAllData] = useState<GoLiveStatus[]>([]);
  useEffect(() => {
    fetch('/api/admin/go-live', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setAllData(d))
      .catch(() => {});
  }, [loading]);

  const countByStatus = (s: string) => allData.filter((t) => t.operationalStatus === s).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Go-Live Control Panel</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerenciamento de status operacional dos tenants
            </p>
          </div>
          <button
            onClick={() => fetchData(activeFilter)}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Atualizar
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <SummaryCard
            label="Total"
            count={allData.length}
            colorClass="text-gray-700"
            onClick={() => setActiveFilter('all')}
            active={activeFilter === 'all'}
          />
          <SummaryCard
            label="Setup"
            count={countByStatus('setup')}
            colorClass="text-gray-600"
            onClick={() => setActiveFilter('setup')}
            active={activeFilter === 'setup'}
          />
          <SummaryCard
            label="Ready"
            count={countByStatus('ready')}
            colorClass="text-blue-600"
            onClick={() => setActiveFilter('ready')}
            active={activeFilter === 'ready'}
          />
          <SummaryCard
            label="Live"
            count={countByStatus('live')}
            colorClass="text-green-600"
            onClick={() => setActiveFilter('live')}
            active={activeFilter === 'live'}
          />
          <SummaryCard
            label="Pausado"
            count={countByStatus('paused')}
            colorClass="text-yellow-600"
            onClick={() => setActiveFilter('paused')}
            active={activeFilter === 'paused'}
          />
          <SummaryCard
            label="Bloqueado"
            count={countByStatus('blocked')}
            colorClass="text-red-600"
            onClick={() => setActiveFilter('blocked')}
            active={activeFilter === 'blocked'}
          />
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Carregando tenants...</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm">Nenhum tenant encontrado para o filtro selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Checklist
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Alertas
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((tenant) => {
                    const passedCount = tenant.checklist.filter((i) => i.passed).length;
                    const isLoading = actionLoadingId === tenant.tenantId;
                    const tenantError = actionErrors[tenant.tenantId];
                    const status = tenant.operationalStatus;

                    return (
                      <tr key={tenant.tenantId} className="hover:bg-gray-50 transition-colors">
                        {/* Tenant name */}
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{tenant.tenantName}</p>
                            <p className="text-xs text-gray-400 font-mono truncate max-w-[160px]">
                              {tenant.tenantId}
                            </p>
                            {tenantError && (
                              <p className="text-xs text-red-600 mt-0.5">{tenantError}</p>
                            )}
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>

                        {/* Checklist progress */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {tenant.checklist.map((item) => (
                                <div
                                  key={item.key}
                                  className={`w-2 h-2 rounded-full ${item.passed ? 'bg-green-500' : 'bg-red-300'}`}
                                  title={item.label}
                                />
                              ))}
                            </div>
                            <span className={`text-xs font-medium ${passedCount === 5 ? 'text-green-600' : 'text-gray-500'}`}>
                              {passedCount}/5
                            </span>
                          </div>
                        </td>

                        {/* Alerts */}
                        <td className="px-4 py-3">
                          {tenant.noUsageAlert && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Sem uso 48h
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {status === 'ready' && (
                              <button
                                onClick={() => performAction(tenant.tenantId, 'activate')}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                {isLoading ? '...' : 'Ativar'}
                              </button>
                            )}

                            {status === 'live' && (
                              <>
                                <button
                                  onClick={() => performAction(tenant.tenantId, 'pause')}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  {isLoading ? '...' : 'Pausar'}
                                </button>
                                <button
                                  onClick={() => performAction(tenant.tenantId, 'block')}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  {isLoading ? '...' : 'Bloquear'}
                                </button>
                              </>
                            )}

                            {status === 'paused' && (
                              <>
                                <button
                                  onClick={() => performAction(tenant.tenantId, 'activate')}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  {isLoading ? '...' : 'Reativar'}
                                </button>
                                <button
                                  onClick={() => performAction(tenant.tenantId, 'block')}
                                  disabled={isLoading}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-xs font-medium transition-colors"
                                >
                                  {isLoading ? '...' : 'Bloquear'}
                                </button>
                              </>
                            )}

                            {status === 'blocked' && (
                              <button
                                onClick={() => performAction(tenant.tenantId, 'unblock')}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                {isLoading ? '...' : 'Desbloquear'}
                              </button>
                            )}

                            <Link
                              href={`/dashboard/admin/go-live/${tenant.tenantId}`}
                              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-medium transition-colors"
                            >
                              Ver Detalhes
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
