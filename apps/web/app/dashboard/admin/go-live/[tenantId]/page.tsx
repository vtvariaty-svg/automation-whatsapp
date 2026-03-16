'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';

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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${colorClass}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Checklist Row ────────────────────────────────────────────────────────────

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${item.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex-shrink-0 mt-0.5">
        {item.passed ? (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${item.passed ? 'text-green-800' : 'text-red-800'}`}>
          {item.label}
        </p>
        {item.detail && (
          <p className={`text-xs mt-0.5 ${item.passed ? 'text-green-600' : 'text-red-600'}`}>
            {item.detail}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton({
  label,
  onClick,
  disabled,
  loading,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant: 'green' | 'yellow' | 'red' | 'indigo' | 'gray';
}) {
  const variantClasses: Record<string, string> = {
    green: 'bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white',
    red: 'bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white',
    gray: 'bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 border border-gray-300',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${variantClasses[variant]}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminGoLiveDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = use(params);

  const [data, setData] = useState<GoLiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/go-live/${tenantId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: GoLiveStatus = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar status');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const performAction = async (
    action: 'activate' | 'pause' | 'block' | 'unblock' | 'deactivate',
  ) => {
    setActionLoading(action);
    setActionError(null);
    setActionSuccess(null);
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
      const body = await res.json();
      setActionSuccess(`Status atualizado para: ${body.newStatus}`);
      await fetchStatus();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Erro ao executar ação');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-6 max-w-md text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchStatus}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              Tentar novamente
            </button>
            <Link
              href="/dashboard/admin/go-live"
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Voltar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { operationalStatus, checklist, allPassed, noUsageAlert } = data;
  const passedCount = checklist.filter((i) => i.passed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* ── Back link ── */}
        <Link
          href="/dashboard/admin/go-live"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Control Panel
        </Link>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.tenantName}</h1>
            <p className="text-sm text-gray-400 font-mono mt-1">{data.tenantId}</p>
            <p className="text-sm text-gray-500 mt-1">
              {passedCount}/{checklist.length} requisitos atendidos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={operationalStatus} />
            <button
              onClick={fetchStatus}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Atualizar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── No Usage Alert ── */}
        {noUsageAlert && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800">Alerta de inatividade</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Nenhuma conversa nas últimas 48h — verifique os webhooks deste tenant
              </p>
            </div>
          </div>
        )}

        {/* ── Checklist ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Checklist de Go-Live
          </h2>
          <div className="space-y-3">
            {checklist.map((item) => (
              <ChecklistRow key={item.key} item={item} />
            ))}
          </div>
        </div>

        {/* ── Action Feedback ── */}
        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {actionError}
          </div>
        )}
        {actionSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {actionSuccess}
          </div>
        )}

        {/* ── Admin Actions ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Ações Administrativas
          </h2>
          <div className="flex flex-wrap gap-3">

            {/* Activate: available when ready */}
            <ActionButton
              label="Ativar (→ live)"
              onClick={() => performAction('activate')}
              disabled={operationalStatus !== 'ready' || !allPassed}
              loading={actionLoading === 'activate'}
              variant="green"
            />

            {/* Pause: available when live */}
            <ActionButton
              label="Pausar (→ paused)"
              onClick={() => performAction('pause')}
              disabled={operationalStatus !== 'live'}
              loading={actionLoading === 'pause'}
              variant="yellow"
            />

            {/* Block: superadmin only, any status */}
            <ActionButton
              label="Bloquear (→ blocked)"
              onClick={() => performAction('block')}
              disabled={operationalStatus === 'blocked'}
              loading={actionLoading === 'block'}
              variant="red"
            />

            {/* Unblock: superadmin only, from blocked */}
            <ActionButton
              label="Desbloquear (→ paused)"
              onClick={() => performAction('unblock')}
              disabled={operationalStatus !== 'blocked'}
              loading={actionLoading === 'unblock'}
              variant="indigo"
            />

            {/* Deactivate: from live or paused → setup */}
            <ActionButton
              label="Desativar (→ setup)"
              onClick={() => performAction('deactivate')}
              disabled={operationalStatus !== 'live' && operationalStatus !== 'paused'}
              loading={actionLoading === 'deactivate'}
              variant="gray"
            />

          </div>

          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p>• Ativar: requer status &apos;ready&apos; e todos os itens aprovados</p>
            <p>• Pausar: requer status &apos;live&apos;</p>
            <p>• Bloquear / Desbloquear: exclusivo superadmin</p>
            <p>• Desativar: retorna para &apos;setup&apos; (live ou paused)</p>
          </div>
        </div>

      </div>
    </div>
  );
}
