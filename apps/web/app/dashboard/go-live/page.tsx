'use client';

import { useState, useEffect, useCallback } from 'react';

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
  setup: 'Configuração',
  ready: 'Pronto',
  live: 'LIVE',
  paused: 'Pausado',
  blocked: 'Bloqueado',
};

const CHECKLIST_HINTS: Record<string, string> = {
  canal_conectado: 'Conecte um canal em Integrações',
  automacao_ativa: 'Crie uma automação em Respostas Rápidas',
  billing_valido: 'Configure seu plano em Assinatura',
  usuario_configurado: 'Configure o usuário admin em Configurações',
  setup_completo: 'Complete o assistente de configuração em Onboarding',
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

// ─── Checklist Item ───────────────────────────────────────────────────────────

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
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.passed ? 'text-green-800' : 'text-red-800'}`}>
          {item.label}
        </p>
        {item.detail && (
          <p className={`text-xs mt-0.5 ${item.passed ? 'text-green-600' : 'text-red-600'}`}>
            {item.detail}
          </p>
        )}
        {!item.passed && CHECKLIST_HINTS[item.key] && (
          <p className="text-xs mt-1 text-red-500 font-medium">
            Como corrigir → {CHECKLIST_HINTS[item.key]}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GoLivePage() {
  const [data, setData] = useState<GoLiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/go-live', { headers: authHeaders() });
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
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-refresh every 30s when status is 'setup' or 'ready'
  useEffect(() => {
    if (!data) return;
    if (data.operationalStatus !== 'setup' && data.operationalStatus !== 'ready') return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 30_000);

    return () => clearInterval(interval);
  }, [data, fetchStatus]);

  const performAction = async (action: 'activate' | 'pause') => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/go-live', {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await fetchStatus();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Erro ao executar ação');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-6 max-w-md text-center">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={fetchStatus}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
          >
            Tentar novamente
          </button>
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

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ativação de Produção</h1>
            <p className="text-sm text-gray-500 mt-1">
              {data.tenantName} · {passedCount}/{checklist.length} requisitos atendidos
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
            <p className="text-sm text-amber-800 font-medium">
              Nenhuma conversa nas últimas 48h — verifique os webhooks
            </p>
          </div>
        )}

        {/* ── Checklist ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Requisitos para Go-Live
          </h2>
          <div className="space-y-3">
            {checklist.map((item) => (
              <ChecklistRow key={item.key} item={item} />
            ))}
          </div>
        </div>

        {/* ── Action Error ── */}
        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* ── Action Section ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Ações</h2>

          {operationalStatus === 'setup' && (
            <div>
              <button
                disabled
                className="w-full py-3 px-4 bg-gray-100 text-gray-400 rounded-xl font-semibold cursor-not-allowed"
              >
                Ativar Produção
              </button>
              <p className="text-sm text-gray-500 text-center mt-3">
                Complete todos os requisitos acima para habilitar a ativação
              </p>
            </div>
          )}

          {operationalStatus === 'ready' && (
            <div>
              <button
                onClick={() => performAction('activate')}
                disabled={actionLoading || !allPassed}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ativando...
                  </>
                ) : (
                  'Ativar Produção'
                )}
              </button>
              <p className="text-sm text-gray-500 text-center mt-3">
                Todos os requisitos foram atendidos. Clique para ir ao ar.
              </p>
            </div>
          )}

          {operationalStatus === 'live' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-green-800">LIVE</p>
                  <p className="text-xs text-green-600">Sistema ativo e recebendo mensagens</p>
                </div>
              </div>
              <button
                onClick={() => performAction('pause')}
                disabled={actionLoading}
                className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Pausando...
                  </>
                ) : (
                  'Pausar'
                )}
              </button>
            </div>
          )}

          {operationalStatus === 'paused' && (
            <div>
              <button
                onClick={() => performAction('activate')}
                disabled={actionLoading}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Reativando...
                  </>
                ) : (
                  'Reativar'
                )}
              </button>
            </div>
          )}

          {operationalStatus === 'blocked' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-sm font-semibold text-red-700">
                Conta bloqueada — entre em contato com o suporte
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
