'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TenantListItem {
  id: string;
  name: string;
  isDemo: boolean;
  createdAt: string;
  subscription: { plan: string; status: string } | null;
}

interface Channel {
  connected: boolean;
  hasToken: boolean;
  enabled: boolean;
}

interface DeadLetterEvent {
  id: string;
  event: string;
  error: string;
  attempts: number;
  status: string;
  createdAt: string;
  channel: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  userId: string | null;
  resource: string | null;
  createdAt: string;
}

interface SupportNote {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

interface CircuitState {
  open: boolean;
  failures: number;
  openSince: string | null;
}

interface DiagnosticData {
  tenant: {
    id: string;
    name: string;
    isDemo: boolean;
    enabledChannels: string | null;
    channelKillSwitch: string | null;
    createdAt: string;
  };
  channels: {
    whatsapp: Channel;
    instagram: Channel;
    facebook: Channel;
  };
  subscription: { plan: string; status: string; trialEnd: string | null } | null;
  automations: { active: number; total: number };
  recentErrors: DeadLetterEvent[];
  recentAudit: AuditEntry[];
  circuitBreaker: Record<string, CircuitState>;
  notes: SupportNote[];
  stats: { conversations7d: number; messages7d: number; aiTokens7d: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${(localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}`,
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, variant }: { label: string; variant: 'green' | 'red' | 'yellow' | 'gray' | 'indigo' }) {
  const cls = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-700',
    indigo: 'bg-indigo-100 text-indigo-800',
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function ChannelCard({
  name,
  channel,
  killSwitchActive,
  circuitKey,
  circuits,
  onToggleKillSwitch,
  loading,
}: {
  name: string;
  channel: Channel;
  killSwitchActive: boolean;
  circuitKey: string;
  circuits: Record<string, CircuitState>;
  onToggleKillSwitch: (ch: string) => void;
  loading: boolean;
}) {
  const circuit = Object.entries(circuits).find(([k]) => k.endsWith(`:${name}`));
  const circuitState = circuit ? circuit[1] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-800 capitalize">{name}</span>
        {channel.connected ? (
          <Badge label="Conectado" variant="green" />
        ) : (
          <Badge label="Desconectado" variant="gray" />
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div>Token: {channel.hasToken ? <span className="text-green-600">presente</span> : <span className="text-red-500">ausente</span>}</div>
        <div>Habilitado: {channel.enabled ? <span className="text-green-600">sim</span> : <span className="text-gray-400">não</span>}</div>
        {circuitState && (
          <div>
            Circuit:{' '}
            {circuitState.open ? (
              <span className="text-red-500">ABERTO ({circuitState.failures} falhas)</span>
            ) : (
              <span className="text-green-600">fechado ({circuitState.failures} falhas)</span>
            )}
          </div>
        )}
      </div>

      <button
        disabled={loading}
        onClick={() => onToggleKillSwitch(name)}
        className={`w-full text-xs font-medium py-1.5 rounded-lg transition-colors ${
          killSwitchActive
            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
        }`}
      >
        {killSwitchActive ? 'Kill Switch ATIVO — Reativar' : 'Ativar Kill Switch'}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DiagnosticsPage() {
  const { isSuperAdmin } = useAuth();
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tenant list on mount
  useEffect(() => {
    async function load() {
      setLoadingTenants(true);
      try {
        const res = await fetch('/api/admin/tenants', { headers: authHeaders() });
        if (!res.ok) throw new Error('Falha ao carregar tenants');
        setTenants(await res.json());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido');
      } finally {
        setLoadingTenants(false);
      }
    }
    load();
  }, []);

  // Load diagnostics when tenant selected
  const loadDiagnostics = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    setLoadingDiag(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/admin/diagnostics/${tenantId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar diagnóstico');
      setData(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setLoadingDiag(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadDiagnostics(selectedId);
  }, [selectedId, loadDiagnostics]);

  // Generic action dispatcher
  async function callAction(action: string, payload?: Record<string, unknown>) {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/diagnostics/${selectedId}/actions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Ação falhou');
      }
      await loadDiagnostics(selectedId);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro na ação');
    } finally {
      setActionLoading(false);
    }
  }

  async function submitNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !noteBody.trim()) return;
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/admin/diagnostics/${selectedId}/notes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ body: noteBody }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Falha ao salvar nota');
      }
      setNoteBody('');
      await loadDiagnostics(selectedId);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar nota');
    } finally {
      setNoteLoading(false);
    }
  }

  const killSwitchSet = new Set(
    (data?.tenant.channelKillSwitch ?? '').split(',').filter(Boolean),
  );

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Acesso restrito</p>
          <p className="text-sm text-gray-500 mt-1">Esta página é exclusiva para superadmins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Ops — Diagnóstico</h1>
        <p className="text-sm text-gray-500 mt-1">Visão completa de um tenant para suporte e depuração.</p>
      </div>

      {/* Tenant Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Selecionar Tenant</label>
        {loadingTenants ? (
          <p className="text-sm text-gray-400">Carregando tenants...</p>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
          >
            <option value="">-- Escolha um tenant --</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.isDemo ? '[DEMO]' : ''} — {t.subscription?.plan ?? 'sem plano'} / {t.subscription?.status ?? '-'}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loadingDiag && (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando diagnóstico...</div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Tenant Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{data.tenant.name}</h2>
                  {data.tenant.isDemo && <Badge label="DEMO" variant="yellow" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">ID: {data.tenant.id}</p>
                <p className="text-xs text-gray-400">Criado em: {fmtDate(data.tenant.createdAt)}</p>
              </div>
              <div className="text-right space-y-1">
                {data.subscription ? (
                  <>
                    <Badge label={data.subscription.plan} variant="indigo" />
                    {' '}
                    <Badge
                      label={data.subscription.status}
                      variant={
                        data.subscription.status === 'active' ? 'green'
                        : data.subscription.status === 'trialing' ? 'yellow'
                        : 'red'
                      }
                    />
                    {data.subscription.trialEnd && (
                      <p className="text-xs text-gray-400">Trial até: {fmtDate(data.subscription.trialEnd)}</p>
                    )}
                  </>
                ) : (
                  <Badge label="Sem assinatura" variant="gray" />
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{data.stats.conversations7d}</p>
                <p className="text-xs text-gray-500">Conversas (7d)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{data.stats.messages7d}</p>
                <p className="text-xs text-gray-500">Mensagens (7d)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{data.stats.aiTokens7d.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Tokens IA (7d)</p>
              </div>
            </div>
          </div>

          {/* Channels Grid */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Canais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['whatsapp', 'instagram', 'facebook'] as const).map((ch) => (
                <ChannelCard
                  key={ch}
                  name={ch}
                  channel={data.channels[ch]}
                  killSwitchActive={killSwitchSet.has(ch)}
                  circuitKey={`${data.tenant.id}:${ch}`}
                  circuits={data.circuitBreaker}
                  onToggleKillSwitch={(channel) =>
                    callAction('toggle_kill_switch', { channel })
                  }
                  loading={actionLoading}
                />
              ))}
            </div>
          </div>

          {/* Automations */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Automações</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.automations.active} ativas de {data.automations.total} no total
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => callAction('pause_automations')}
                  className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Pausar todas
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => callAction('resume_automations')}
                  className="px-4 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  Retomar todas
                </button>
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Erros Recentes (Dead Letter)</h3>
            </div>
            {data.recentErrors.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhum erro recente.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Evento</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Erro</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tentativas</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recentErrors.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{ev.event}</td>
                        <td className="px-4 py-3 text-xs text-red-600 max-w-xs truncate" title={ev.error}>{ev.error}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{ev.attempts}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(ev.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={actionLoading}
                            onClick={() => callAction('resolve_dead_letter', { deadLetterId: ev.id })}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                          >
                            Resolver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Audit Trail (últimos 10)</h3>
            </div>
            {data.recentAudit.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhum evento de auditoria.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.recentAudit.map((entry) => (
                  <li key={entry.id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50">
                    <div>
                      <span className="font-mono text-xs text-gray-800">{entry.action}</span>
                      {entry.resource && (
                        <span className="ml-2 text-xs text-gray-400">{entry.resource}</span>
                      )}
                      {entry.userId && (
                        <span className="ml-2 text-xs text-gray-400">by {entry.userId.slice(0, 8)}…</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Support Notes */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Notas de Suporte</h3>
            </div>

            {/* Add note form */}
            <form onSubmit={submitNote} className="px-5 py-4 border-b border-gray-100 flex gap-3">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={2}
                placeholder="Adicionar nota interna sobre este tenant..."
                className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={noteLoading || !noteBody.trim()}
                className="self-end px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                Salvar
              </button>
            </form>

            {data.notes.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhuma nota de suporte.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.notes.map((note) => (
                  <li key={note.id} className="px-5 py-4 hover:bg-gray-50">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {fmtDate(note.createdAt)} — autor: {note.authorId.slice(0, 8)}…
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
