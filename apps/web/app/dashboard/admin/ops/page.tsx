'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  category: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  detail: string;
}

interface OpsCheck {
  id: string;
  name: string;
  category: string;
  status: string;
  detail?: string | null;
  checkedAt: string;
  checkedBy?: string | null;
}

interface IncidentLog {
  id: string;
  title: string;
  severity: string;
  status: string;
  description: string;
  resolvedAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OpsData {
  checks: CheckResult[];
  history: OpsCheck[];
  incidents: IncidentLog[];
  summary: { ok: number; warning: number; critical: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${(localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''}` };
}

const CHECK_LABELS: Record<string, string> = {
  neon_backup: 'Backup do Banco',
  dead_letter_clear: 'Fila de Erros',
  audit_log_active: 'Logs de Auditoria',
  unresolved_incidents: 'Incidentes Abertos',
  tenant_data_export: 'Exportação de Dados',
  circuit_breaker_health: 'Circuit Breakers',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  investigating: 'Investigando',
  resolved: 'Resolvido',
};

const INCIDENT_STATUS_NEXT: Record<string, string> = {
  open: 'investigating',
  investigating: 'resolved',
  resolved: 'resolved',
};

const INCIDENT_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/20 text-red-400 border-red-500/30',
  investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ok: 'bg-green-400 shadow-green-400/50',
    warning: 'bg-yellow-400 shadow-yellow-400/50',
    critical: 'bg-red-400 shadow-red-400/50',
    unknown: 'bg-gray-400 shadow-gray-400/50',
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shadow-sm ${colors[status] ?? colors.unknown}`}
    />
  );
}

const INCIDENT_CHECKLIST = [
  'Identificar tenant/channel afetado',
  'Verificar dead-letter queue (/dashboard/admin/diagnostics)',
  'Verificar circuit breakers',
  'Pausar automações se necessário',
  'Comunicar usuário afetado',
  'Abrir incidente no painel',
  'Resolver causa raiz',
  'Marcar incidente como resolvido',
  'Atualizar documentação se necessário',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function OpsPage() {
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Incidents
  const [allIncidents, setAllIncidents] = useState<IncidentLog[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newDescription, setNewDescription] = useState('');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);

  // Export
  const [exportTenantId, setExportTenantId] = useState('');

  // Checklist
  const [checklist, setChecklist] = useState<boolean[]>(INCIDENT_CHECKLIST.map(() => false));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ops', { headers: authHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar dados');
      const json: OpsData = await res.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    try {
      const res = await fetch('/api/admin/ops/incidents', { headers: authHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar incidentes');
      const json: IncidentLog[] = await res.json();
      setAllIncidents(json);
    } catch {
      // silently ignore
    } finally {
      setIncidentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadIncidents();
  }, [loadData, loadIncidents]);

  const handleRunChecks = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ops/save', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Falha ao executar verificações');
      await loadData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceIncident = async (incident: IncidentLog) => {
    const nextStatus = INCIDENT_STATUS_NEXT[incident.status];
    if (nextStatus === incident.status) return;
    try {
      const res = await fetch('/api/admin/ops/incidents', {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: incident.id, status: nextStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar incidente');
      await Promise.all([loadData(), loadIncidents()]);
    } catch {
      // silently ignore
    }
  };

  const handleCreateIncident = async () => {
    if (!newTitle.trim() || !newDescription.trim()) return;
    setIncidentSubmitting(true);
    try {
      const res = await fetch('/api/admin/ops/incidents', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, severity: newSeverity, description: newDescription }),
      });
      if (!res.ok) throw new Error('Falha ao criar incidente');
      setNewTitle('');
      setNewSeverity('medium');
      setNewDescription('');
      setShowNewIncident(false);
      await Promise.all([loadData(), loadIncidents()]);
    } catch {
      // silently ignore
    } finally {
      setIncidentSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!exportTenantId.trim()) return;
    window.open(
      `/api/admin/export/${encodeURIComponent(exportTenantId.trim())}`,
      '_blank',
    );
  };

  const toggleChecklist = (i: number) => {
    setChecklist((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  // Compute overall health
  const overallHealth = (): { label: string; cls: string } => {
    if (!data) return { label: 'Carregando', cls: 'bg-gray-500/20 text-gray-400' };
    if (data.summary.critical > 0) return { label: 'Crítico', cls: 'bg-red-500/20 text-red-400 border-red-500/30' };
    if (data.summary.warning > 0) return { label: 'Atenção', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'Tudo OK', cls: 'bg-green-500/20 text-green-400 border-green-500/30' };
  };

  const health = overallHealth();

  return (
    <div className="min-h-screen bg-[#080d18] text-white p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🛡️ Ops &amp; Compliance</h1>
          <p className="text-gray-400 text-sm mt-1">Backup, recuperação, auditoria e conformidade operacional</p>
        </div>
        <div className="flex items-center gap-3">
          {data && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${health.cls}`}>
              {health.label}
            </span>
          )}
          <button
            onClick={handleRunChecks}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? 'Verificando…' : 'Executar Verificações'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Section 1 – Status Operacional */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Status Operacional</h2>
        {loading ? (
          <div className="text-gray-400 text-sm">Carregando verificações…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.checks ?? []).map((check) => (
              <div
                key={check.name}
                className="bg-[#0f1629] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-white">
                    {CHECK_LABELS[check.name] ?? check.name}
                  </span>
                  <StatusDot status={check.status} />
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 self-start">
                  {check.category}
                </span>
                <p className="text-xs text-gray-400 leading-relaxed">{check.detail}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2 – Incidentes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Incidentes</h2>
          <button
            onClick={() => setShowNewIncident((v) => !v)}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition-colors"
          >
            + Novo Incidente
          </button>
        </div>

        {/* New incident form */}
        {showNewIncident && (
          <div className="bg-[#0f1629] border border-white/[0.06] rounded-xl p-5 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Criar Incidente</h3>
            <input
              type="text"
              placeholder="Título do incidente"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
            />
            <select
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
            <textarea
              placeholder="Descrição do incidente"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateIncident}
                disabled={incidentSubmitting || !newTitle.trim() || !newDescription.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {incidentSubmitting ? 'Criando…' : 'Criar Incidente'}
              </button>
              <button
                onClick={() => setShowNewIncident(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {incidentsLoading ? (
          <div className="text-gray-400 text-sm">Carregando incidentes…</div>
        ) : allIncidents.length === 0 ? (
          <div className="text-gray-500 text-sm">Nenhum incidente registrado.</div>
        ) : (
          <div className="space-y-2">
            {allIncidents.map((incident) => {
              const isResolved = incident.status === 'resolved';
              return (
                <div
                  key={incident.id}
                  className={`bg-[#0f1629] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between gap-4 ${isResolved ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${SEVERITY_COLORS[incident.severity] ?? SEVERITY_COLORS.medium}`}
                    >
                      {incident.severity}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${INCIDENT_STATUS_COLORS[incident.status] ?? ''}`}
                    >
                      {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
                    </span>
                    <span className="text-sm text-white font-medium truncate">{incident.title}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500">
                      {new Date(incident.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {!isResolved && (
                      <button
                        onClick={() => handleAdvanceIncident(incident)}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-lg font-medium transition-colors"
                      >
                        {incident.status === 'open' ? 'Investigar' : 'Resolver'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3 – Exportar Dados de Tenant */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Exportar Dados de Tenant</h2>
        <div className="bg-[#0f1629] border border-white/[0.06] rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-4">
            Exporta todos os dados de um tenant como arquivo JSON (conversas, mensagens, regras de automação, pedidos, etc.).
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="ID do Tenant"
              value={exportTenantId}
              onChange={(e) => setExportTenantId(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={handleExport}
              disabled={!exportTenantId.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Exportar JSON
            </button>
          </div>
        </div>
      </section>

      {/* Section 4 – Checklist de Incidente */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Checklist de Incidente</h2>
        <div className="bg-[#0f1629] border border-white/[0.06] rounded-xl p-5 space-y-3">
          <p className="text-xs text-gray-500 mb-2">Estado local — não persiste entre sessões.</p>
          {INCIDENT_CHECKLIST.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checklist[i]}
                onChange={() => toggleChecklist(i)}
                className="mt-0.5 w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
              <span
                className={`text-sm leading-relaxed transition-colors ${
                  checklist[i] ? 'line-through text-gray-600' : 'text-gray-300 group-hover:text-white'
                }`}
              >
                {item}
              </span>
            </label>
          ))}
          <button
            onClick={() => setChecklist(INCIDENT_CHECKLIST.map(() => false))}
            className="mt-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Limpar checklist
          </button>
        </div>
      </section>

      {/* History (last saved) */}
      {data && data.history.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Últimas Verificações Salvas</h2>
          <div className="bg-[#0f1629] border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Detalhe</th>
                  <th className="px-4 py-3 text-left">Verificado em</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((h) => (
                  <tr key={h.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white font-medium">
                      {CHECK_LABELS[h.name] ?? h.name}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{h.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusDot status={h.status} />
                        <span className="text-gray-300">{h.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{h.detail}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(h.checkedAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
