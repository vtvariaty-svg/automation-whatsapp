'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpSummary {
  overall: {
    totalLeads:        number;
    openLeads:         number;
    convertedLeads:    number;
    lostLeads:         number;
    approvedLeads:     number;
    blockedLeads:      number;
    noOwnerLeads:      number;
    dueTodayLeads:     number;
    overdueLeads:      number;
    highPriorityLeads: number;
  };
  byStage:    Record<string, number>;
  byPriority: Record<string, number>;
}

interface QueueLead {
  id:             string;
  companyName:    string;
  tradeName:      string | null;
  city:           string | null;
  state:          string | null;
  category:       string | null;
  pipelineStage:  string;
  priority:       string;
  nextActionAt:   string | null;
  lastContactAt:  string | null;
  ownerUserId:    string | null;
  outreachStatus: string;
  status:         string;
  owner:          { id: string; name: string | null; email: string } | null;
  score:          { overallScore: number; verdict: string } | null;
  searchRun:      { id: string; niche: string; city: string | null; state: string | null } | null;
}

interface AlertLead {
  id:            string;
  companyName:   string;
  tradeName:     string | null;
  pipelineStage: string;
  priority:      string;
  nextActionAt:  string | null;
  ownerUserId:   string | null;
}

interface OpAlert {
  id:             string;
  alertType:      string;
  severity:       string;
  status:         string;
  title:          string;
  detail:         string | null;
  ruleKey:        string;
  createdAt:      string;
  updatedAt:      string;
  acknowledgedAt: string | null;
  resolvedAt:     string | null;
  leadCandidate:  AlertLead | null;
  searchRun:      { id: string; niche: string; city: string | null; state: string | null } | null;
}

interface ScanResult {
  scanned:     number;
  created:     number;
  reopened:    number;
  autoResolved:number;
  openTotal:   number;
}

type Bucket = 'all' | 'open' | 'due_today' | 'overdue' | 'no_owner' | 'converted' | 'lost';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(isoStr: string | null | undefined, stage: string): boolean {
  if (!isoStr) return false;
  if (stage === 'won' || stage === 'lost') return false;
  return new Date(isoStr) < new Date();
}

function stageLabelAndColor(stage: string): { label: string; color: string } {
  switch (stage) {
    case 'new':           return { label: 'Novo',             color: 'bg-gray-100 text-gray-600' };
    case 'contacted':     return { label: 'Contactado',       color: 'bg-indigo-100 text-indigo-700' };
    case 'interested':    return { label: 'Interessado',      color: 'bg-cyan-100 text-cyan-700' };
    case 'proposal_sent': return { label: 'Proposta Enviada', color: 'bg-blue-100 text-blue-700' };
    case 'negotiating':   return { label: 'Negociando',       color: 'bg-purple-100 text-purple-700' };
    case 'won':           return { label: 'Ganho',            color: 'bg-emerald-100 text-emerald-700' };
    case 'lost':          return { label: 'Perdido',          color: 'bg-red-100 text-red-600' };
    default:              return { label: stage,              color: 'bg-gray-100 text-gray-500' };
  }
}

function priorityLabelAndColor(p: string): { label: string; color: string } {
  switch (p) {
    case 'high':   return { label: 'Alta',   color: 'bg-red-50 text-red-600 border-red-100' };
    case 'normal': return { label: 'Normal', color: 'bg-gray-50 text-gray-600 border-gray-100' };
    case 'low':    return { label: 'Baixa',  color: 'bg-blue-50 text-blue-500 border-blue-100' };
    default:       return { label: p,        color: 'bg-gray-50 text-gray-500 border-gray-100' };
  }
}

function verdictColor(v: string): string {
  switch (v) {
    case 'compensa':     return 'text-emerald-600';
    case 'revisar':      return 'text-amber-600';
    case 'nao_compensa': return 'text-red-500';
    default:             return 'text-gray-500';
  }
}

function severityBadge(s: string): { label: string; color: string } {
  switch (s) {
    case 'critical': return { label: 'Crítico',  color: 'bg-red-100 text-red-800 border-red-200' };
    case 'high':     return { label: 'Alta',     color: 'bg-orange-100 text-orange-700 border-orange-200' };
    case 'medium':   return { label: 'Média',    color: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'low':      return { label: 'Baixa',    color: 'bg-blue-50 text-blue-600 border-blue-100' };
    default:         return { label: s,          color: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

function alertStatusBadge(s: string): { label: string; color: string } {
  switch (s) {
    case 'open':         return { label: 'Aberto',      color: 'bg-red-50 text-red-700' };
    case 'acknowledged': return { label: 'Reconhecido', color: 'bg-amber-50 text-amber-700' };
    case 'resolved':     return { label: 'Resolvido',   color: 'bg-emerald-50 text-emerald-700' };
    default:             return { label: s,             color: 'bg-gray-50 text-gray-600' };
  }
}

function alertTypeLabel(t: string): string {
  switch (t) {
    case 'overdue_next_action':     return 'Ação vencida';
    case 'no_owner_high_priority':  return 'Alta prioridade sem dono';
    case 'stalled_follow_up':       return 'Follow-up parado';
    case 'replied_no_next_action':  return 'Sem próxima ação';
    case 'ready_no_activation':     return 'Pronto, sem ativação';
    default: return t;
  }
}

const STAGES = [
  { value: 'new',           label: 'Novo' },
  { value: 'contacted',     label: 'Contactado' },
  { value: 'interested',    label: 'Interessado' },
  { value: 'proposal_sent', label: 'Proposta Enviada' },
  { value: 'negotiating',   label: 'Negociando' },
  { value: 'won',           label: 'Ganho' },
  { value: 'lost',          label: 'Perdido' },
];

const BUCKETS: { value: Bucket; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'open',      label: 'Em aberto' },
  { value: 'overdue',   label: 'Vencidos' },
  { value: 'due_today', label: 'Hoje' },
  { value: 'no_owner',  label: 'Sem responsável' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'lost',      label: 'Perdidos' },
];

const ALERT_TYPES = [
  { value: 'overdue_next_action',    label: 'Ação vencida' },
  { value: 'no_owner_high_priority', label: 'Alta prioridade sem dono' },
  { value: 'stalled_follow_up',      label: 'Follow-up parado' },
  { value: 'replied_no_next_action', label: 'Sem próxima ação' },
  { value: 'ready_no_activation',    label: 'Pronto, sem ativação' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadOperationsPage() {
  const [summary, setSummary] = useState<OpSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [leads, setLeads] = useState<QueueLead[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);

  // Filters
  const [bucket, setBucket]     = useState<Bucket>('all');
  const [stage, setStage]       = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch]     = useState('');
  const [searchInput, setSearchInput] = useState(''); // debounced

  // Per-lead pipeline draft
  const [pipelineDraft, setPipelineDraft] = useState<Record<string, {
    pipelineStage: string;
    nextActionAt: string;
  }>>({});
  const [savingPipeline, setSavingPipeline] = useState<Record<string, boolean>>({});

  // Per-lead note
  const [noteText, setNoteText]       = useState<Record<string, string>>({});
  const [savingNote, setSavingNote]   = useState<Record<string, boolean>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // ── Alerts state ─────────────────────────────────────────────────────────

  const [alerts, setAlerts]             = useState<OpAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [scanning, setScanning]         = useState(false);
  const [scanResult, setScanResult]     = useState<ScanResult | null>(null);
  const [alertsOpen, setAlertsOpen]     = useState(true);

  // Alert filters
  const [alertStatusFilter, setAlertStatusFilter]   = useState('open');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
  const [alertTypeFilter, setAlertTypeFilter]       = useState('');

  // Per-alert action loading
  const [alertActionIds, setAlertActionIds] = useState<Record<string, boolean>>({});

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/lead-intelligence/operations/summary', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) setSummary(await res.json());
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    setLoadingQueue(true);
    setQueueError(null);
    try {
      const params = new URLSearchParams();
      if (bucket)   params.set('bucket',   bucket);
      if (stage)    params.set('stage',    stage);
      if (priority) params.set('priority', priority);
      if (search)   params.set('search',   search);
      params.set('limit', '100');

      const res = await fetch(`/api/lead-intelligence/operations/queue?${params}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Erro ao carregar fila.');
      const data = await res.json();
      const fetched: QueueLead[] = data.leads ?? [];
      setLeads(fetched);
      setPipelineDraft(prev => {
        const next = { ...prev };
        for (const l of fetched) {
          if (!next[l.id]) {
            next[l.id] = {
              pipelineStage: l.pipelineStage,
              nextActionAt:  l.nextActionAt ? l.nextActionAt.substring(0, 16) : '',
            };
          }
        }
        return next;
      });
    } catch (e: unknown) {
      setQueueError(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setLoadingQueue(false);
    }
  }, [bucket, stage, priority, search]);

  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const params = new URLSearchParams();
      if (alertStatusFilter)   params.set('status',    alertStatusFilter);
      if (alertSeverityFilter) params.set('severity',  alertSeverityFilter);
      if (alertTypeFilter)     params.set('alertType', alertTypeFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/lead-intelligence/alerts?${params}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } finally {
      setLoadingAlerts(false);
    }
  }, [alertStatusFilter, alertSeverityFilter, alertTypeFilter]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadQueue(); }, [loadQueue]);
  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function refresh() {
    await Promise.all([loadSummary(), loadQueue(), loadAlerts()]);
  }

  // ── Alert scan ─────────────────────────────────────────────────────────────

  async function handleScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch('/api/lead-intelligence/alerts', {
        method:  'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data: ScanResult = await res.json();
        setScanResult(data);
        await Promise.all([loadAlerts(), loadSummary()]);
      }
    } finally {
      setScanning(false);
    }
  }

  // ── Alert action ───────────────────────────────────────────────────────────

  async function handleAlertAction(alertId: string, action: 'acknowledge' | 'resolve' | 'reopen') {
    setAlertActionIds(prev => ({ ...prev, [alertId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/alerts/${alertId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body:    JSON.stringify({ action }),
      });
      if (res.ok) await loadAlerts();
    } finally {
      setAlertActionIds(prev => ({ ...prev, [alertId]: false }));
    }
  }

  // ── Pipeline save ──────────────────────────────────────────────────────────

  async function handleSavePipeline(leadId: string) {
    const draft = pipelineDraft[leadId];
    if (!draft) return;
    setSavingPipeline(prev => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/candidates/${leadId}/pipeline`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body:    JSON.stringify({
          pipelineStage: draft.pipelineStage,
          nextActionAt:  draft.nextActionAt || null,
        }),
      });
      if (res.ok) await refresh();
    } finally {
      setSavingPipeline(prev => ({ ...prev, [leadId]: false }));
    }
  }

  // ── Follow-up log ──────────────────────────────────────────────────────────

  async function handleAddLog(leadId: string, type: 'note' | 'manual_contact') {
    const content = noteText[leadId]?.trim();
    if (!content) return;
    setSavingNote(prev => ({ ...prev, [leadId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/candidates/${leadId}/follow-up-log`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body:    JSON.stringify({ type, content }),
      });
      if (res.ok) {
        setNoteText(prev => ({ ...prev, [leadId]: '' }));
        await refresh();
      }
    } finally {
      setSavingNote(prev => ({ ...prev, [leadId]: false }));
    }
  }

  // ── Derived alert counts ───────────────────────────────────────────────────

  const openAlerts     = alerts.filter(a => a.status === 'open').length;
  const highAlerts     = alerts.filter(a => (a.severity === 'high' || a.severity === 'critical') && a.status !== 'resolved').length;
  const overdueAlerts  = alerts.filter(a => a.alertType === 'overdue_next_action' && a.status !== 'resolved').length;
  const noOwnerAlerts  = alerts.filter(a => a.alertType === 'no_owner_high_priority' && a.status !== 'resolved').length;
  const stalledAlerts  = alerts.filter(a => a.alertType === 'stalled_follow_up' && a.status !== 'resolved').length;

  // ── Render ────────────────────────────────────────────────────────────────

  const overall = summary?.overall;

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/dashboard/lead-intelligence"
          className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-3 transition-colors"
        >
          ← Prospecção IA
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">📋</span>
              <h1 className="text-xl font-bold text-gray-900">Operação de Leads</h1>
            </div>
            <p className="text-sm text-gray-500 max-w-2xl">
              Fila centralizada de follow-up diário. Visualize e gerencie leads de todas as buscas em um único lugar, filtre por vencimento, prioridade ou responsável, e registre contatos e notas sem sair desta página.
            </p>
          </div>
          <button
            onClick={refresh}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 hover:border-indigo-300 bg-white text-gray-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-all"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: 'Em aberto',
            value: overall?.openLeads,
            color: 'text-indigo-700',
            bucket: 'open' as Bucket,
          },
          {
            label: 'Vencidos',
            value: overall?.overdueLeads,
            color: overall?.overdueLeads ? 'text-red-600' : 'text-gray-700',
            bucket: 'overdue' as Bucket,
          },
          {
            label: 'Hoje',
            value: overall?.dueTodayLeads,
            color: overall?.dueTodayLeads ? 'text-amber-600' : 'text-gray-700',
            bucket: 'due_today' as Bucket,
          },
          {
            label: 'Sem responsável',
            value: overall?.noOwnerLeads,
            color: overall?.noOwnerLeads ? 'text-orange-600' : 'text-gray-700',
            bucket: 'no_owner' as Bucket,
          },
          {
            label: 'Alta prioridade',
            value: overall?.highPriorityLeads,
            color: overall?.highPriorityLeads ? 'text-red-500' : 'text-gray-700',
            bucket: 'open' as Bucket,
          },
          {
            label: 'Convertidos',
            value: overall?.convertedLeads,
            color: 'text-emerald-700',
            bucket: 'converted' as Bucket,
          },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => setBucket(item.bucket)}
            className={`bg-white rounded-2xl border p-4 text-center transition-all hover:-translate-y-0.5 ${
              bucket === item.bucket ? 'border-indigo-300 shadow-sm' : 'border-gray-200'
            }`}
          >
            {loadingSummary ? (
              <p className="text-xl font-black text-gray-300 animate-pulse">—</p>
            ) : (
              <p className={`text-2xl font-black ${item.color}`}>{item.value ?? 0}</p>
            )}
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-0.5 leading-tight">
              {item.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Alerts section ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Alerts header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAlertsOpen(o => !o)}
              className="text-gray-400 hover:text-gray-700 text-sm font-bold transition-colors"
            >
              {alertsOpen ? '▼' : '▶'}
            </button>
            <span className="text-sm font-bold text-gray-900">🚨 Alertas operacionais</span>
            {openAlerts > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {openAlerts} aberto{openAlerts !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Alert summary counters */}
            {!loadingAlerts && (
              <div className="flex items-center gap-3 text-[10px] font-semibold text-gray-500 mr-2">
                {highAlerts    > 0 && <span className="text-orange-600">🔴 {highAlerts} alta/crítico</span>}
                {overdueAlerts > 0 && <span className="text-red-600">⏰ {overdueAlerts} vencidos</span>}
                {noOwnerAlerts > 0 && <span className="text-amber-600">👤 {noOwnerAlerts} sem dono</span>}
                {stalledAlerts > 0 && <span className="text-gray-500">🛑 {stalledAlerts} parados</span>}
              </div>
            )}

            <button
              onClick={handleScan}
              disabled={scanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-all"
            >
              {scanning ? '⏳ Escaneando...' : '🔍 Atualizar alertas'}
            </button>
          </div>
        </div>

        {/* Scan result banner */}
        {scanResult && (
          <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-800 flex flex-wrap gap-4 items-center">
            <span className="font-bold">Resultado do scan:</span>
            <span>📊 {scanResult.scanned} leads analisados</span>
            <span className="text-emerald-700 font-semibold">+{scanResult.created} criados</span>
            <span className="text-amber-600 font-semibold">↺ {scanResult.reopened} reabertos</span>
            <span className="text-gray-500">✅ {scanResult.autoResolved} auto-resolvidos</span>
            <span className="font-bold text-red-600">{scanResult.openTotal} alertas abertos no total</span>
            <button
              onClick={() => setScanResult(null)}
              className="ml-auto text-indigo-400 hover:text-indigo-700 font-bold"
            >✕</button>
          </div>
        )}

        {alertsOpen && (
          <div className="p-5 space-y-4">
            {/* Alert filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={alertStatusFilter}
                onChange={e => setAlertStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Todos os status</option>
                <option value="open">Abertos</option>
                <option value="acknowledged">Reconhecidos</option>
                <option value="resolved">Resolvidos</option>
              </select>

              <select
                value={alertSeverityFilter}
                onChange={e => setAlertSeverityFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Todas as severidades</option>
                <option value="critical">Crítico</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>

              <select
                value={alertTypeFilter}
                onChange={e => setAlertTypeFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">Todos os tipos</option>
                {ALERT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {(alertStatusFilter || alertSeverityFilter || alertTypeFilter) && (
                <button
                  onClick={() => { setAlertStatusFilter('open'); setAlertSeverityFilter(''); setAlertTypeFilter(''); }}
                  className="text-xs text-gray-400 hover:text-gray-700 font-semibold"
                >
                  ✕ Limpar
                </button>
              )}
            </div>

            {/* Alert list */}
            {loadingAlerts ? (
              <p className="text-xs text-gray-400 py-4 text-center">Carregando alertas...</p>
            ) : alerts.length === 0 ? (
              <div className="border-2 border-dashed border-gray-100 rounded-xl py-10 flex flex-col items-center justify-center text-center">
                <span className="text-2xl mb-2">✅</span>
                <p className="text-sm font-semibold text-gray-400">Nenhum alerta para este filtro</p>
                <p className="text-xs text-gray-400 mt-1">Execute o scan para detectar riscos nos seus leads.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => {
                  const sev    = severityBadge(alert.severity);
                  const aStatus = alertStatusBadge(alert.status);
                  const lead   = alert.leadCandidate;
                  const stage_ = lead ? stageLabelAndColor(lead.pipelineStage) : null;
                  const loading = alertActionIds[alert.id] ?? false;

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-xl border p-4 space-y-2 ${
                        alert.status === 'resolved' ? 'border-gray-100 bg-gray-50 opacity-70' :
                        alert.severity === 'high' || alert.severity === 'critical' ? 'border-orange-100 bg-orange-50' :
                        'border-gray-200 bg-white'
                      }`}
                    >
                      {/* Alert header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sev.color}`}>
                              {sev.label}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${aStatus.color}`}>
                              {aStatus.label}
                            </span>
                            <span className="text-[9px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {alertTypeLabel(alert.alertType)}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-gray-900">{alert.title}</p>
                          {alert.detail && (
                            <p className="text-[10px] text-gray-600">{alert.detail}</p>
                          )}

                          {lead && (
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500 pt-0.5">
                              <span className="font-semibold text-gray-700">{lead.companyName}{lead.tradeName ? ` (${lead.tradeName})` : ''}</span>
                              {stage_ && (
                                <span className={`font-bold px-1.5 py-px rounded-full text-[9px] ${stage_.color}`}>
                                  {stage_.label}
                                </span>
                              )}
                              {lead.nextActionAt && (
                                <span className="text-amber-600">🗓 {formatDateShort(lead.nextActionAt)}</span>
                              )}
                            </div>
                          )}

                          {alert.searchRun && (
                            <p className="text-[9px] text-gray-400">
                              🎯 Busca: {alert.searchRun.niche}
                              {[alert.searchRun.city, alert.searchRun.state].filter(Boolean).join(', ') ? ` · ${[alert.searchRun.city, alert.searchRun.state].filter(Boolean).join(', ')}` : ''}
                            </p>
                          )}

                          <p className="text-[9px] text-gray-400">Criado em {formatDate(alert.createdAt)}</p>
                        </div>

                        {/* Alert actions */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          {alert.searchRun && (
                            <Link
                              href={`/dashboard/lead-intelligence/${alert.searchRun.id}`}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors border border-indigo-100"
                            >
                              Ver busca →
                            </Link>
                          )}

                          {alert.status === 'open' && (
                            <button
                              onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                              disabled={loading}
                              className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 px-2 py-1 rounded-lg border border-amber-200 transition-all"
                            >
                              {loading ? '⏳' : 'Reconhecer'}
                            </button>
                          )}

                          {(alert.status === 'open' || alert.status === 'acknowledged') && (
                            <button
                              onClick={() => handleAlertAction(alert.id, 'resolve')}
                              disabled={loading}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 px-2 py-1 rounded-lg border border-emerald-200 transition-all"
                            >
                              {loading ? '⏳' : 'Resolver'}
                            </button>
                          )}

                          {alert.status === 'resolved' && (
                            <button
                              onClick={() => handleAlertAction(alert.id, 'reopen')}
                              disabled={loading}
                              className="text-[10px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 px-2 py-1 rounded-lg border border-gray-200 transition-all"
                            >
                              {loading ? '⏳' : 'Reabrir'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        {/* Bucket pills */}
        <div className="flex flex-wrap gap-1.5">
          {BUCKETS.map(b => (
            <button
              key={b.value}
              onClick={() => setBucket(b.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                bucket === b.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-gray-50">
          <select
            value={stage}
            onChange={e => setStage(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Todos os estágios</option>
            {STAGES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Todas as prioridades</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
            <option value="low">Baixa</option>
          </select>

          <input
            type="text"
            placeholder="Buscar empresa, cidade..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[200px]"
          />

          {(stage || priority || searchInput) && (
            <button
              onClick={() => { setStage(''); setPriority(''); setSearchInput(''); setSearch(''); }}
              className="text-xs text-gray-400 hover:text-gray-700 font-semibold"
            >
              ✕ Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Queue ──────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">
            {loadingQueue ? 'Carregando...' : `${leads.length} lead${leads.length !== 1 ? 's' : ''} na fila`}
          </p>
        </div>

        {queueError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {queueError}
          </div>
        )}

        {!loadingQueue && leads.length === 0 && !queueError && (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">✅</span>
            <p className="text-sm font-semibold text-gray-400">Nenhum lead para este filtro</p>
            <p className="text-xs text-gray-400 mt-1">Tente mudar o bucket ou limpar os filtros.</p>
          </div>
        )}

        {leads.map(lead => {
          const stage_ = stageLabelAndColor(lead.pipelineStage);
          const prio_  = priorityLabelAndColor(lead.priority);
          const overdue = isOverdue(lead.nextActionAt, lead.pipelineStage);
          const draft  = pipelineDraft[lead.id];
          const expanded = expandedIds[lead.id] ?? false;
          const runLocation = [lead.searchRun?.city, lead.searchRun?.state].filter(Boolean).join(', ');

          return (
            <div
              key={lead.id}
              className={`bg-white rounded-2xl border p-5 space-y-3 transition-all ${
                overdue ? 'border-red-200' : 'border-gray-200'
              }`}
            >
              {/* ── Lead info row ────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{lead.companyName}</p>
                    {lead.tradeName && (
                      <span className="text-xs text-gray-400">({lead.tradeName})</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage_.color}`}>
                      {stage_.label}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${prio_.color}`}>
                      {prio_.label}
                    </span>
                    {overdue && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        VENCIDO
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                    {lead.searchRun && (
                      <span>🎯 {lead.searchRun.niche}{runLocation ? ` · ${runLocation}` : ''}</span>
                    )}
                    {(lead.city || lead.state) && (
                      <span>📍 {[lead.city, lead.state].filter(Boolean).join(', ')}</span>
                    )}
                    {lead.category && <span>🏷️ {lead.category}</span>}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                    {lead.nextActionAt && (
                      <span className={overdue ? 'text-red-500 font-semibold' : 'text-amber-600'}>
                        🗓 Próx. ação: {formatDateShort(lead.nextActionAt)}
                      </span>
                    )}
                    {lead.lastContactAt && (
                      <span>📞 Último contato: {formatDateShort(lead.lastContactAt)}</span>
                    )}
                    {lead.owner && (
                      <span>👤 {lead.owner.name ?? lead.owner.email}</span>
                    )}
                    {lead.score && (
                      <span className={`font-semibold ${verdictColor(lead.score.verdict)}`}>
                        Score: {lead.score.overallScore}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {lead.searchRun && (
                    <Link
                      href={`/dashboard/lead-intelligence/${lead.searchRun.id}`}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors border border-indigo-100"
                    >
                      Ver busca →
                    </Link>
                  )}
                  <button
                    onClick={() => setExpandedIds(prev => ({ ...prev, [lead.id]: !prev[lead.id] }))}
                    className="text-[10px] font-bold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200"
                  >
                    {expanded ? '▲ Fechar' : '▼ Ações'}
                  </button>
                </div>
              </div>

              {/* ── Inline actions (expanded) ────────────────────────────── */}
              {expanded && draft && (
                <div className="border-t border-gray-100 pt-3 space-y-4">

                  {/* Pipeline update */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Atualizar pipeline</p>
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-600">Estágio</label>
                        <select
                          value={draft.pipelineStage}
                          onChange={e =>
                            setPipelineDraft(prev => ({
                              ...prev,
                              [lead.id]: { ...prev[lead.id], pipelineStage: e.target.value },
                            }))
                          }
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          {STAGES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-gray-600">Próxima ação</label>
                        <input
                          type="datetime-local"
                          value={draft.nextActionAt}
                          onChange={e =>
                            setPipelineDraft(prev => ({
                              ...prev,
                              [lead.id]: { ...prev[lead.id], nextActionAt: e.target.value },
                            }))
                          }
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>

                      <button
                        onClick={() => handleSavePipeline(lead.id)}
                        disabled={savingPipeline[lead.id]}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        {savingPipeline[lead.id] ? '⏳ Salvando...' : '💾 Salvar'}
                      </button>
                    </div>
                  </div>

                  {/* Note / contact */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Registrar follow-up</p>
                    <textarea
                      rows={2}
                      placeholder="Descreva o contato ou adicione uma nota..."
                      value={noteText[lead.id] ?? ''}
                      onChange={e => setNoteText(prev => ({ ...prev, [lead.id]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddLog(lead.id, 'manual_contact')}
                        disabled={savingNote[lead.id] || !noteText[lead.id]?.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all"
                      >
                        {savingNote[lead.id] ? '⏳' : '📞 Contato realizado'}
                      </button>
                      <button
                        onClick={() => handleAddLog(lead.id, 'note')}
                        disabled={savingNote[lead.id] || !noteText[lead.id]?.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-all"
                      >
                        {savingNote[lead.id] ? '⏳' : '📝 Salvar nota'}
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-400">
                      "Contato realizado" atualiza automaticamente a data do último contato.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Helper note ─────────────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex items-start gap-3">
        <span className="text-lg shrink-0">ℹ️</span>
        <div>
          <p className="font-bold mb-1">Sobre esta página</p>
          <p>
            Esta página serve para <strong>operação diária e follow-up manual</strong>. Ela centraliza leads de múltiplas buscas em uma única fila operacional, facilitando a priorização e o registro de contatos sem precisar entrar em cada busca individualmente.<br />
            Os <strong>alertas operacionais</strong> detectam leads travados ou em risco (ação vencida, sem responsável, follow-up parado, estágio avançado sem próxima ação, pronto sem ativação) e permitem que você reconheça, resolva ou reabra cada alerta individualmente.<br />
            <strong>Não cria automação de envio</strong> — disparos de email e WhatsApp continuam sendo realizados nas páginas individuais de cada busca.
          </p>
        </div>
      </div>

    </div>
  );
}
