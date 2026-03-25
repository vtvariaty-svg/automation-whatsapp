'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadScore {
  overallScore: number;
  icpFitScore: number;
  commercialPotentialScore: number;
  digitalMaturityScore: number;
  approachabilityScore: number;
  confidenceScore: number;
  verdict: string; // compensa | revisar | nao_compensa
  reasons?: string[] | null;
}

interface LeadFollowUpLog {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
  loggedAt: string;
}

interface LeadCandidate {
  id: string;
  companyName: string;
  tradeName: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  address: string | null;
  category: string | null;
  rating: number | null;
  reviewsCount: number | null;
  status: string;
  source: string;
  createdAt: string;
  score: LeadScore | null;
  emailConsentStatus: string;
  whatsappConsentStatus: string;
  outreachStatus: string;
  outreachBlockReason: string | null;
  lastReadinessCheckedAt: string | null;
  suppressions?: LeadSuppression[];
  // Pipeline (LEAD3)
  pipelineStage: string;
  ownerUserId: string | null;
  priority: string;
  nextActionAt: string | null;
  lastContactAt: string | null;
  internalNotes: string | null;
  // Company registry (LEAD6)
  cnpj?: string | null;
  legalName?: string | null;
  cnpjStatus?: string | null;
  cnpjSource?: string | null;
  registryConfidence?: number | null;
  companyRegistryLastCheckedAt?: string | null;
}

interface LeadCompanyRegistrySnapshot {
  id: string;
  provider: string;
  matched: boolean;
  confidence: number | null;
  cnpj: string | null;
  legalName: string | null;
  tradeName: string | null;
  companyType: string | null;
  mainActivity: string | null;
  city: string | null;
  state: string | null;
  cnpjStatus: string | null;
  rawSummary: string | null;
  notes: string[] | null;
  createdAt: string;
}

interface LeadSuppression {
  id: string;
  channel: string;
  reason: string;
  source: string;
  active: boolean;
  createdAt: string;
}

interface CampaignDraft {
  id: string;
  channel: string;
  status: string;
  subject: string | null;
  messageBody: string;
  createdAt: string;
  approvedAt?: string | null;
  sentAt?: string | null;
  errorMessage?: string | null;
  deliveryMeta?: { deliveredTo?: string } | null;
  leadCandidate?: {
    id: string;
    companyName: string;
    email: string | null;
    phone: string | null;
    mobilePhone: string | null;
    status: string;
  };
}

interface CampaignExecutionItem {
  id: string;
  channel: string;
  status: string;
  reason?: string | null;
  providerMessageId?: string | null;
  deliveredTo?: string | null;
  processedAt: string;
  leadCandidate?: { companyName: string };
  draft?: { channel: string; subject?: string | null };
  responseStatus?: string;
  outcomeNotes?: string | null;
  conversionValue?: number | null;
  respondedAt?: string | null;
  convertedAt?: string | null;
  outcomeUpdatedAt?: string | null;
  outcomeSource?: string;
  lastProviderEventType?: string | null;
  lastProviderEventAt?: string | null;
}

interface CampaignExecution {
  id: string;
  channel: string;
  status: string;
  requestedCount: number;
  eligibleCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  batchSize: number;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  items?: CampaignExecutionItem[];
}

interface RunAnalytics {
  overall: any;
  rates: any;
  byChannel: any;
  recentExecutions: any[];
}

interface EnrichmentAttempt {
  id: string;
  provider: string;
  status: string;
  attemptedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  responseSummary?: Record<string, any> | null;
}

interface SearchRunSummary {
  provider: string;
  query: string;
  discovered: number;
  created: number;
  skipped: number;
  lastDiscoveryAt: string;
}

interface SearchRun {
  id: string;
  niche: string;
  city: string | null;
  state: string | null;
  radiusKm: number | null;
  maxResults: number;
  minTicket: number | null;
  minRating: number | null;
  minReviews: number | null;
  requiresWebsite: boolean;
  requiresCommercialPhone: boolean;
  localB2BOnly: boolean;
  status: string;
  totalCandidates: number;
  createdAt: string;
  candidates: LeadCandidate[];
  enrichmentAttempts: EnrichmentAttempt[];
  summary?: SearchRunSummary | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'queued':         return { label: 'Na fila',         color: 'bg-blue-100 text-blue-700' };
    case 'running':        return { label: 'Executando',      color: 'bg-blue-100 text-blue-700' };
    case 'completed':      return { label: 'Concluída',       color: 'bg-green-100 text-green-700' };
    case 'partial':        return { label: 'Parcial',         color: 'bg-amber-100 text-amber-700' };
    case 'failed':         return { label: 'Falhou',          color: 'bg-red-100 text-red-600' };
    case 'approved':       return { label: 'Aprovado',        color: 'bg-green-100 text-green-700' };
    case 'rejected':       return { label: 'Rejeitado',       color: 'bg-red-100 text-red-600' };
    case 'archived':       return { label: 'Arquivado',       color: 'bg-gray-100 text-gray-500' };
    case 'success':        return { label: 'Sucesso',         color: 'bg-green-100 text-green-700' };
    case 'pending':        return { label: 'Pendente',        color: 'bg-yellow-100 text-yellow-700' };
    case 'pending_review': return { label: 'Em revisão',      color: 'bg-yellow-100 text-yellow-700' };
    default:               return { label: status,            color: 'bg-gray-100 text-gray-600' };
  }
}

function verdictBadge(verdict: string): { label: string; color: string } {
  switch (verdict) {
    case 'compensa':      return { label: 'Compensa',       color: 'bg-green-100 text-green-700' };
    case 'revisar':       return { label: 'Revisar',        color: 'bg-amber-100 text-amber-700' };
    case 'nao_compensa':  return { label: 'Não compensa',   color: 'bg-red-100 text-red-600' };
    default:              return { label: verdict,          color: 'bg-gray-100 text-gray-600' };
  }
}

// ─── Candidate form empty state ───────────────────────────────────────────────

const EMPTY_CANDIDATE = {
  companyName: '',
  tradeName: '',
  cnpj: '',
  website: '',
  email: '',
  phone: '',
  mobilePhone: '',
  address: '',
  city: '',
  state: '',
  category: '',
  rating: '',
  reviewsCount: '',
};

type StatusFilter = 'all' | 'pending_review' | 'approved' | 'rejected' | 'archived';
type VerdictFilter = 'todos' | 'compensa' | 'revisar' | 'nao_compensa';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchRunDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [run, setRun] = useState<SearchRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Candidate form state
  const [candidateFormOpen, setCandidateFormOpen] = useState(false);
  const [candidateForm, setCandidateForm] = useState(EMPTY_CANDIDATE);
  const [candidateSubmitting, setCandidateSubmitting] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  // Per-candidate action states
  const [scoringIds, setScoringIds]   = useState<Record<string, boolean>>({});
  const [statusIds, setStatusIds]     = useState<Record<string, boolean>>({});

  // Filters
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all');
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('todos');

  // Discovery state
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverSuccess, setDiscoverSuccess] = useState<{ discovered: number; created: number; skipped: number } | null>(null);

  // Enrichment state
  const [enrichingIds, setEnrichingIds] = useState<Record<string, boolean>>({});

  // ── Pipeline state (LEAD3) ─────────────────────────────────────────────────
  // Which candidate has the pipeline panel open
  const [openPipelineIds, setOpenPipelineIds] = useState<Record<string, boolean>>({});
  // Saving pipeline patch per candidate
  const [pipelineSaving, setPipelineSaving] = useState<Record<string, boolean>>({});
  // Local form state per candidate (staged edits before save)
  const [pipelineDrafts, setPipelineDrafts] = useState<Record<string, {
    pipelineStage: string;
    priority: string;
    ownerUserId: string;
    nextActionAt: string;
    internalNotes: string;
  }>>({});
  // Follow-up log state per candidate
  const [followUpLogs, setFollowUpLogs] = useState<Record<string, LeadFollowUpLog[]>>({});
  const [followUpLogsLoading, setFollowUpLogsLoading] = useState<Record<string, boolean>>({});
  const [followUpNote, setFollowUpNote] = useState<Record<string, string>>({});
  const [followUpSubmitting, setFollowUpSubmitting] = useState<Record<string, boolean>>({});

  // ── Company Registry state (LEAD6) ────────────────────────────────────────
  const [registryLoadingIds, setRegistryLoadingIds] = useState<Record<string, boolean>>({});
  const [registrySnapshots, setRegistrySnapshots] = useState<Record<string, LeadCompanyRegistrySnapshot[]>>({});
  const [registrySnapshotsOpen, setRegistrySnapshotsOpen] = useState<Record<string, boolean>>({});

  async function handleEnrich(candidateId: string) {
    setEnrichingIds(prev => ({ ...prev, [candidateId]: true }));
    try {
      const token = getAuthToken();
      await fetch(`/api/lead-intelligence/candidates/${candidateId}/enrich`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadRun();
    } finally {
      setEnrichingIds(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  async function handleRegistryValidate(candidateId: string) {
    setRegistryLoadingIds(prev => ({ ...prev, [candidateId]: true }));
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/lead-intelligence/candidates/${candidateId}/company-registry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Update candidate in run state
        setRun(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            candidates: prev.candidates.map(c =>
              c.id === candidateId ? { ...c, ...data.candidate } : c,
            ),
          };
        });
        // Prepend new snapshot
        if (data.snapshot) {
          setRegistrySnapshots(prev => ({
            ...prev,
            [candidateId]: [data.snapshot, ...(prev[candidateId] ?? [])].slice(0, 10),
          }));
        }
      }
    } finally {
      setRegistryLoadingIds(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  async function handleDiscover() {
    setIsDiscovering(true);
    setDiscoverError(null);
    setDiscoverSuccess(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/discover`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Erro na descoberta.');
      }
      setDiscoverSuccess({
        discovered: data.discovered,
        created: data.created,
        skipped: data.skipped,
      });
      await loadRun();
    } catch (e: any) {
      setDiscoverError(e.message ?? 'Erro de conexão.');
    } finally {
      setIsDiscovering(false);
    }
  }

  // ── Fetch detail ─────────────────────────────────────────────────────────

  const loadRun = useCallback(async () => {
    if (!id) return;
    const token = getAuthToken();
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error('Erro ao carregar a busca.');
      const data = await res.json();
      setRun(data.run);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const [drafts, setDrafts] = useState<CampaignDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftSummary, setDraftSummary] = useState<any>(null);

  const [suppressions, setSuppressions] = useState<Record<string, LeadSuppression[]>>({});
  const [suppressionsLoading, setSuppressionsLoading] = useState<Record<string, boolean>>({});
  const [showSuppHistory, setShowSuppHistory] = useState<Record<string, boolean>>({});

  const loadSuppressions = useCallback(async (candidateId: string) => {
    setSuppressionsLoading(prev => ({ ...prev, [candidateId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/candidates/${candidateId}/suppression`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuppressions(prev => ({ ...prev, [candidateId]: data.suppressions || [] }));
      }
    } finally {
      setSuppressionsLoading(prev => ({ ...prev, [candidateId]: false }));
    }
  }, []);

  async function handleToggleSuppression(candidateId: string, channel: string, reason: string) {
    const candSuppressions = suppressions[candidateId] || [];
    const activeSupp = candSuppressions.find(s => s.active && s.channel === channel);
    
    setSuppressionsLoading(prev => ({ ...prev, [candidateId]: true }));
    try {
      if (activeSupp) {
        await fetch(`/api/lead-intelligence/candidates/${candidateId}/suppression`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify({ suppressionId: activeSupp.id, active: false })
        });
      } else {
        await fetch(`/api/lead-intelligence/candidates/${candidateId}/suppression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
          body: JSON.stringify({ channel, reason })
        });
      }
      await loadSuppressions(candidateId);
      await loadRun(); // opcional para dar refresh na label se quiser
    } finally {
      setSuppressionsLoading(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  function getActiveSuppressionText(candidateId: string) {
    const supps = suppressions[candidateId] || [];
    const active = supps.filter(s => s.active);
    if (active.length === 0) return null;
    if (active.some(s => s.channel === 'all')) return 'Todos os canais bloqueados';
    const channels = active.map(s => s.channel === 'email' ? 'Email' : 'WhatsApp');
    return `${channels.join(' e ')} bloqueado(s)`;
  }

  const [executions, setExecutions] = useState<CampaignExecution[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<CampaignExecution | null>(null);
  const [executionDetailLoading, setExecutionDetailLoading] = useState(false);

  // Form states for execution
  const [execFormChannel, setExecFormChannel] = useState<'email' | 'whatsapp'>('email');
  const [execFormBatchSize, setExecFormBatchSize] = useState<number>(10);
  const [execFormNotes, setExecFormNotes] = useState<string>('');
  const [executingBatch, setExecutingBatch] = useState(false);

  const loadDrafts = useCallback(async () => {
    if (!id) return;
    setDraftsLoading(true);
    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/campaign-drafts`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } finally {
      setDraftsLoading(false);
    }
  }, [id]);

  const loadExecutions = useCallback(async () => {
    if (!id) return;
    setExecutionsLoading(true);
    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/campaign-executions`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions || []);
      }
    } finally {
      setExecutionsLoading(false);
    }
  }, [id]);

  const [analytics, setAnalytics] = useState<RunAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!id) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/analytics`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [id]);

  const loadTeamUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/lead-intelligence/team', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTeamUsers(data.users || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadRun();
    loadDrafts();
    loadExecutions();
    loadAnalytics();
    loadTeamUsers();
  }, [loadRun, loadDrafts, loadExecutions, loadAnalytics, loadTeamUsers]);

  const [outcomeLoadings, setOutcomeLoadings] = useState<Record<string, boolean>>({});

  async function handleUpdateOutcome(itemId: string, responseStatus: string, notes?: string, value?: number) {
    setOutcomeLoadings(prev => ({ ...prev, [itemId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/execution-items/${itemId}/outcome`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ responseStatus, outcomeNotes: notes, conversionValue: value })
      });
      if (res.ok) {
        await loadAnalytics();
        if (selectedExecution) {
          // Re-fetch detail
          const detailRes = await fetch(`/api/lead-intelligence/campaign-executions/${selectedExecution.id}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
          if (detailRes.ok) {
            const data = await detailRes.json();
            setSelectedExecution(data.execution || null);
          }
        }
      }
    } finally {
      setOutcomeLoadings(prev => ({ ...prev, [itemId]: false }));
    }
  }

  // ── Pipeline actions (LEAD3) ─────────────────────────────────────────────

  function openPipelinePanel(candidate: LeadCandidate) {
    setOpenPipelineIds(prev => ({ ...prev, [candidate.id]: true }));
    // Initialise draft from candidate's current values
    setPipelineDrafts(prev => ({
      ...prev,
      [candidate.id]: {
        pipelineStage: candidate.pipelineStage ?? 'new',
        priority: candidate.priority ?? 'normal',
        ownerUserId: candidate.ownerUserId ?? '',
        nextActionAt: candidate.nextActionAt ? candidate.nextActionAt.substring(0, 16) : '',
        internalNotes: candidate.internalNotes ?? '',
      },
    }));
    // Load follow-up logs if not yet loaded
    if (!followUpLogs[candidate.id]) {
      loadFollowUpLogs(candidate.id);
    }
  }

  async function loadFollowUpLogs(candidateId: string) {
    setFollowUpLogsLoading(prev => ({ ...prev, [candidateId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/candidates/${candidateId}/follow-up-log`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowUpLogs(prev => ({ ...prev, [candidateId]: data.logs ?? [] }));
      }
    } finally {
      setFollowUpLogsLoading(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  async function handlePipelineSave(candidateId: string) {
    const draft = pipelineDrafts[candidateId];
    if (!draft) return;
    setPipelineSaving(prev => ({ ...prev, [candidateId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/candidates/${candidateId}/pipeline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          pipelineStage: draft.pipelineStage,
          priority: draft.priority,
          ownerUserId: draft.ownerUserId || null,
          nextActionAt: draft.nextActionAt || null,
          internalNotes: draft.internalNotes || null,
        }),
      });
      if (res.ok) {
        await loadRun();
        await loadFollowUpLogs(candidateId);
      }
    } finally {
      setPipelineSaving(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  async function handleFollowUpSubmit(candidateId: string, type: 'note' | 'manual_contact') {
    const content = followUpNote[candidateId]?.trim();
    if (!content) return;
    setFollowUpSubmitting(prev => ({ ...prev, [candidateId]: true }));
    try {
      const res = await fetch(`/api/lead-intelligence/candidates/${candidateId}/follow-up-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ type, content }),
      });
      if (res.ok) {
        setFollowUpNote(prev => ({ ...prev, [candidateId]: '' }));
        await loadFollowUpLogs(candidateId);
        if (type === 'manual_contact') await loadRun();
      }
    } finally {
      setFollowUpSubmitting(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  // ── Readiness e Drafts Actions ────────────────────────────────────────────

  const [readinessIds, setReadinessIds] = useState<Record<string, boolean>>({});

  async function handleConsentPatch(candidateId: string, field: string, value: string) {
    try {
      const token = getAuthToken();
      await fetch(`/api/lead-intelligence/candidates/${candidateId}/outreach-readiness`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: value }),
      });
      // Auto-trigger readiness check so outreachStatus updates immediately without manual click
      await fetch(`/api/lead-intelligence/candidates/${candidateId}/outreach-readiness`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadRun();
    } catch {}
  }

  async function handleReadinessCheck(candidateId: string) {
    setReadinessIds(prev => ({ ...prev, [candidateId]: true }));
    try {
      await fetch(`/api/lead-intelligence/candidates/${candidateId}/outreach-readiness`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      await loadRun();
    } finally {
      setReadinessIds(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  const [generatingDrafts, setGeneratingDrafts] = useState(false);

  async function handleGenerateDrafts(channel: string) {
    setGeneratingDrafts(true);
    setDraftSummary(null);
    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/campaign-drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (res.ok) {
        setDraftSummary(data.summary);
        await loadDrafts();
      }
    } finally {
      setGeneratingDrafts(false);
    }
  }

  const [draftActionIds, setDraftActionIds] = useState<Record<string, string>>({});

  async function handleDraftApprove(draftId: string, action: 'approved' | 'rejected') {
    setDraftActionIds(prev => ({ ...prev, [draftId]: 'approving' }));
    try {
      const res = await fetch(`/api/lead-intelligence/campaign-drafts/${draftId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await loadDrafts();
    } finally {
      setDraftActionIds(prev => ({ ...prev, [draftId]: '' }));
    }
  }

  async function handleDraftSend(draftId: string) {
    setDraftActionIds(prev => ({ ...prev, [draftId]: 'sending' }));
    try {
      const res = await fetch(`/api/lead-intelligence/campaign-drafts/${draftId}/send-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) await loadDrafts();
    } finally {
      setDraftActionIds(prev => ({ ...prev, [draftId]: '' }));
    }
  }

  async function handleDraftSendWhatsapp(draftId: string) {
    setDraftActionIds(prev => ({ ...prev, [draftId]: 'sending' }));
    try {
      const res = await fetch(`/api/lead-intelligence/campaign-drafts/${draftId}/send-whatsapp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (res.ok) await loadDrafts();
    } finally {
      setDraftActionIds(prev => ({ ...prev, [draftId]: '' }));
    }
  }

  async function handleExecuteBatch() {
    setExecutingBatch(true);
    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/campaign-executions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          channel: execFormChannel,
          batchSize: execFormBatchSize,
          notes: execFormNotes
        })
      });
      if (res.ok) {
        await loadDrafts();
        await loadExecutions();
      }
    } finally {
      setExecutingBatch(false);
    }
  }

  async function loadExecutionDetail(execId: string) {
    if (selectedExecution?.id === execId) {
      setSelectedExecution(null);
      return;
    }
    setExecutionDetailLoading(true);
    try {
      const res = await fetch(`/api/lead-intelligence/campaign-executions/${execId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedExecution(data.execution || null);
      }
    } finally {
      setExecutionDetailLoading(false);
    }
  }

  // ── Candidate form helpers ────────────────────────────────────────────────

  function setCandidateField(key: keyof typeof EMPTY_CANDIDATE, value: string) {
    setCandidateForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleCandidateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCandidateError(null);

    if (!candidateForm.companyName.trim()) {
      setCandidateError('O campo "Razão Social" é obrigatório.');
      return;
    }

    const body: Record<string, unknown> = {
      companyName:  candidateForm.companyName.trim(),
      tradeName:    candidateForm.tradeName.trim()    || undefined,
      cnpj:         candidateForm.cnpj.trim()         || undefined,
      website:      candidateForm.website.trim()      || undefined,
      email:        candidateForm.email.trim()        || undefined,
      phone:        candidateForm.phone.trim()        || undefined,
      mobilePhone:  candidateForm.mobilePhone.trim()  || undefined,
      address:      candidateForm.address.trim()      || undefined,
      city:         candidateForm.city.trim()         || undefined,
      state:        candidateForm.state.trim()        || undefined,
      category:     candidateForm.category.trim()     || undefined,
      rating:       candidateForm.rating !== '' ? Number(candidateForm.rating) : undefined,
      reviewsCount: candidateForm.reviewsCount !== '' ? Number(candidateForm.reviewsCount) : undefined,
      source:       'manual',
    };

    setCandidateSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setCandidateError(data.error ?? 'Erro ao criar candidato.');
        return;
      }
      setCandidateForm(EMPTY_CANDIDATE);
      setCandidateFormOpen(false);
      await loadRun();
    } catch {
      setCandidateError('Erro de conexão. Tente novamente.');
    } finally {
      setCandidateSubmitting(false);
    }
  }

  // ── Score action ──────────────────────────────────────────────────────────

  async function handleScore(candidateId: string) {
    setScoringIds(prev => ({ ...prev, [candidateId]: true }));
    try {
      const token = getAuthToken();
      await fetch(`/api/lead-intelligence/candidates/${candidateId}/score`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadRun();
    } finally {
      setScoringIds(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  // ── Status action ─────────────────────────────────────────────────────────

  async function handleStatus(candidateId: string, status: string) {
    setStatusIds(prev => ({ ...prev, [candidateId]: true }));
    try {
      const token = getAuthToken();
      await fetch(`/api/lead-intelligence/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      await loadRun();
    } finally {
      setStatusIds(prev => ({ ...prev, [candidateId]: false }));
    }
  }

  // ── Export helpers ────────────────────────────────────────────────────────

  function handleExport(format: 'csv' | 'json') {
    const token = getAuthToken();
    const url = `/api/lead-intelligence/search-runs/${id}/export?format=${format}`;

    if (format === 'csv') {
      // Trigger download via hidden anchor
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.blob())
        .then(blob => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `leads-aprovados.csv`;
          link.click();
          URL.revokeObjectURL(link.href);
        });
    } else {
      // JSON: open in new tab (browser will download or display)
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.blob())
        .then(blob => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `leads-aprovados.json`;
          link.click();
          URL.revokeObjectURL(link.href);
        });
    }
  }

  // ── Filtered candidates ───────────────────────────────────────────────────

  const filteredCandidates = useMemo(() => {
    if (!run) return [];
    return run.candidates.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (verdictFilter !== 'todos') {
        if (!c.score || c.score.verdict !== verdictFilter) return false;
      }
      return true;
    });
  }, [run, statusFilter, verdictFilter]);

  // ── Summary counts ────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    if (!run) return { total: 0, approved: 0, rejected: 0, archived: 0, pending: 0 };
    const cs = run.candidates;
    return {
      total:    cs.length,
      approved: cs.filter(c => c.status === 'approved').length,
      rejected: cs.filter(c => c.status === 'rejected').length,
      archived: cs.filter(c => c.status === 'archived').length,
      pending:  cs.filter(c => c.status === 'pending_review').length,
    };
  }, [run]);

  // ── Bulk selection state ─────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectByPredicate(pred: (c: LeadCandidate) => boolean) {
    setSelectedIds(new Set(filteredCandidates.filter(pred).map(c => c.id)));
  }

  function clearSelection() { setSelectedIds(new Set()); }

  function waEligibility(c: LeadCandidate): 'ready' | 'no_phone' | 'no_consent' | 'blocked' | 'not_approved' {
    if (c.status !== 'approved') return 'not_approved';
    if (!c.mobilePhone && !c.phone) return 'no_phone';
    if (c.whatsappConsentStatus !== 'granted') return 'no_consent';
    if (c.outreachStatus !== 'ready_whatsapp' && c.outreachStatus !== 'ready_multichannel') return 'blocked';
    return 'ready';
  }

  const WA_ELIGIBILITY_BADGE: Record<string, { label: string; color: string }> = {
    ready:        { label: 'Pronto para WhatsApp', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    no_phone:     { label: 'Sem telefone',         color: 'bg-gray-100 text-gray-500 border-gray-200' },
    no_consent:   { label: 'Sem consentimento',    color: 'bg-amber-50 text-amber-600 border-amber-200' },
    blocked:      { label: 'Bloqueado',             color: 'bg-red-50 text-red-600 border-red-200' },
    not_approved: { label: 'Não aprovado',          color: 'bg-gray-100 text-gray-400 border-gray-200' },
  };

  // ── Team users (for pipeline owner select) ───────────────────────────────
  const [teamUsers, setTeamUsers] = useState<{ id: string; name: string | null; email: string }[]>([]);

  // ── WA Quick-batch modal state ────────────────────────────────────────────
  const [waBatchOpen, setWaBatchOpen] = useState(false);
  const [waBatchMessage, setWaBatchMessage] = useState('');
  const [waBatchSize, setWaBatchSize] = useState(20);
  const [waBatchSending, setWaBatchSending] = useState(false);
  const [waBatchResult, setWaBatchResult] = useState<{
    sent: number; failed: number; skipped: number;
    skippedReasons: Record<string, number>; executionId?: string;
    errorMessage?: string;
  } | null>(null);

  // ── Bulk approve ──────────────────────────────────────────────────────────
  const [bulkApproving, setBulkApproving] = useState(false);

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return;
    setBulkApproving(true);
    try {
      const token = getAuthToken();
      await Promise.all(
        Array.from(selectedIds).map(candidateId =>
          fetch(`/api/lead-intelligence/candidates/${candidateId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: 'approved' }),
          })
        )
      );
      await loadRun();
      clearSelection();
    } finally {
      setBulkApproving(false);
    }
  }

  async function handleWaQuickBatch() {
    setWaBatchSending(true);
    setWaBatchResult(null);
    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/whatsapp-quick-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          candidateIds: Array.from(selectedIds),
          messageBody: waBatchMessage,
          batchSize: waBatchSize,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaBatchResult(data);
        await loadRun();
        await loadExecutions();
      } else {
        setWaBatchResult({
          sent: 0, failed: 0, skipped: 0, skippedReasons: {},
          errorMessage: data.error || 'Erro desconhecido ao processar o envio.',
        });
      }
    } finally {
      setWaBatchSending(false);
    }
  }

  // ── Bulk download helpers ─────────────────────────────────────────────────
  async function handleDownloadPhones(fmt: 'csv' | 'txt') {
    const res = await fetch(`/api/lead-intelligence/search-runs/${id}/selected-phones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
      body: JSON.stringify({ candidateIds: Array.from(selectedIds), format: fmt }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `numeros.${fmt}`; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportSelected(fmt: 'csv' | 'json') {
    const res = await fetch(`/api/lead-intelligence/search-runs/${id}/export-selected`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
      body: JSON.stringify({ candidateIds: Array.from(selectedIds), format: fmt }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-exportados.${fmt}`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── States ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Carregando busca...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-24 space-y-3">
        <p className="text-4xl">🔍</p>
        <p className="text-base font-semibold text-gray-700">Busca não encontrada</p>
        <p className="text-sm text-gray-400">Este registro não existe ou não pertence à sua conta.</p>
        <Link href="/dashboard/lead-intelligence" className="inline-block mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold">
          ← Voltar para Prospecção IA
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700 max-w-lg">
        {error}
        <Link href="/dashboard/lead-intelligence" className="ml-3 underline text-red-600 text-xs">
          Voltar
        </Link>
      </div>
    );
  }

  if (!run) return null;

  const runStatus = statusBadge(run.status);
  const location = [run.city, run.state].filter(Boolean).join(', ');

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Breadcrumb + Header */}
      <div>
        <Link
          href="/dashboard/lead-intelligence"
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1 mb-3"
        >
          ← Prospecção IA
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <h1 className="text-xl font-bold text-gray-900">{run.niche}</h1>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${runStatus.color}`}>
                {runStatus.label}
              </span>
            </div>
            {location && (
              <p className="text-sm text-gray-500 mt-1 ml-9">📍 {location}</p>
            )}
          </div>
          <p className="text-xs text-gray-400 sm:text-right ml-9 sm:ml-0">
            Criada em {formatDate(run.createdAt)}
          </p>
        </div>
      </div>

      {/* ── Seção 1: Resumo da busca ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">📋 Parâmetros da busca</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            ['Nicho',           run.niche],
            ['Cidade',          run.city ?? '—'],
            ['Estado',          run.state ?? '—'],
            ['Raio',            run.radiusKm ? `${run.radiusKm} km` : '—'],
            ['Qtd. máxima',     String(run.maxResults)],
            ['Ticket mínimo',   run.minTicket != null ? `R$ ${run.minTicket}` : '—'],
            ['Rating mínimo',   run.minRating != null ? String(run.minRating) : '—'],
            ['Mín. reviews',    run.minReviews != null ? String(run.minReviews) : '—'],
          ].map(([label, value]) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Boolean filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {run.requiresWebsite && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              ✔ Precisa ter site
            </span>
          )}
          {run.requiresCommercialPhone && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              ✔ Precisa ter telefone comercial
            </span>
          )}
          {run.localB2BOnly && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              ✔ Foco B2B local
            </span>
          )}
          {!run.requiresWebsite && !run.requiresCommercialPhone && !run.localB2BOnly && (
            <span className="text-xs text-gray-400">Sem filtros booleanos aplicados.</span>
          )}
        </div>
      </div>

      {/* ── Nova Seção: Descoberta de Empresas ────────────────────────────────*/}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">🔍 Descoberta de Empresas</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Este passo utiliza o Google Places para encontrar listagens públicas de empresas na região da busca. 
              <strong>Nota:</strong> CNPJ e e-mails não são coletados nesta etapa. Empresas já salvas são ignoradas para evitar duplicações.
            </p>
          </div>
          <button
            onClick={handleDiscover}
            disabled={isDiscovering || run.status === 'queued'}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            {isDiscovering ? '⏳ Buscando...' : '🔍 Buscar empresas no Google'}
          </button>
        </div>

        {discoverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {discoverError}
          </div>
        )}

        {discoverSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
            <strong>✅ Busca concluída!</strong> Encontradas {discoverSuccess.discovered} empresas. {discoverSuccess.created} novos candidatos salvos ({discoverSuccess.skipped} ignorados por duplicação).
          </div>
        )}

        {run.summary && (
          <div className="bg-gray-50 rounded-xl p-4 mt-2">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Última Descoberta</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Provedor</p>
                <p className="text-sm font-semibold text-gray-900">{run.summary.provider}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Query Usada</p>
                <p className="text-sm font-semibold text-gray-900 truncate" title={run.summary.query}>{run.summary.query}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Status do Processamento</p>
                <p className="text-sm font-semibold text-gray-900">Criados: {run.summary.created} / Skipped: {run.summary.skipped}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Data</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(run.summary.lastDiscoveryAt)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Seção 2: Candidatos ─────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">🏢 Candidatos</h2>
            <p className="text-[10px] text-gray-500 mt-1 max-w-lg">
              ⚠️ Leads suprimidos não entram em novos rascunhos nem enviados nos lotes. A supressão age como proteção e preserva histórico.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export buttons */}
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-200"
            >
              ⬇ CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-200"
            >
              ⬇ JSON
            </button>
            <button
              onClick={() => { setCandidateFormOpen(o => !o); setCandidateError(null); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              {candidateFormOpen ? '✕ Cancelar' : '+ Adicionar candidato'}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total de leads',  value: counts.total,    color: 'text-gray-900' },
            { label: 'Aprovados',       value: counts.approved,  color: 'text-green-700' },
            { label: 'Rejeitados',      value: counts.rejected,  color: 'text-red-600' },
            { label: 'Arquivados',      value: counts.archived,  color: 'text-gray-500' },
            { label: 'Pendentes',       value: counts.pending,   color: 'text-amber-600' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {(
              [
                ['all',            'Todos'],
                ['pending_review', 'Em revisão'],
                ['approved',       'Aprovados'],
                ['rejected',       'Rejeitados'],
                ['archived',       'Arquivados'],
              ] as [StatusFilter, string][]
            ).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === val
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Verdict filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {(
              [
                ['todos',         'Todos'],
                ['compensa',      '✅ Compensa'],
                ['revisar',       '🟡 Revisar'],
                ['nao_compensa',  '❌ Não compensa'],
              ] as [VerdictFilter, string][]
            ).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setVerdictFilter(val)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  verdictFilter === val
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Selection helpers */}
        {filteredCandidates.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-semibold">Selecionar:</span>
            <button onClick={() => selectByPredicate(() => true)} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all">Todos os filtrados</button>
            <button onClick={() => selectByPredicate(c => c.status === 'approved')} className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-semibold transition-all border border-green-200">Aprovados</button>
            <button onClick={() => selectByPredicate(c => !!(c.mobilePhone || c.phone))} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition-all border border-blue-200">Com telefone</button>
            <button onClick={() => selectByPredicate(c => waEligibility(c) === 'ready')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold transition-all border border-emerald-200">Prontos p/ WhatsApp</button>
            {selectedIds.size > 0 && <button onClick={clearSelection} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-all border border-red-200">Limpar seleção ({selectedIds.size})</button>}
          </div>
        )}

        {/* Sticky Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-16 z-30 bg-indigo-700 text-white rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3 shadow-lg shadow-indigo-500/30">
            <span className="font-bold text-sm">{selectedIds.size} selecionado(s)</span>
            <div className="flex flex-wrap gap-2 ml-auto">
              <button
                onClick={handleBulkApprove}
                disabled={bulkApproving}
                className="px-3 py-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all"
              >
                {bulkApproving ? '⏳ Aprovando...' : '✅ Aprovar selecionados'}
              </button>
              <button onClick={() => handleDownloadPhones('txt')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all">📥 Baixar números (.txt)</button>
              <button onClick={() => handleDownloadPhones('csv')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all">📥 Baixar números (.csv)</button>
              <button onClick={() => handleExportSelected('csv')} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all">⬇ Exportar leads (.csv)</button>
              <button onClick={() => { setWaBatchMessage(''); setWaBatchResult(null); setWaBatchOpen(true); }} className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-xs font-bold transition-all">📱 Enviar lote WhatsApp</button>
              <button onClick={clearSelection} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold transition-all">✕ Limpar</button>
            </div>
          </div>
        )}

        {/* Manual candidate creation form */}
        {candidateFormOpen && (
          <form
            onSubmit={handleCandidateSubmit}
            className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-gray-900">Novo candidato manual</h3>
              <p className="text-xs text-gray-500 mt-0.5">Preencha os dados da empresa a ser adicionada nesta busca.</p>
            </div>

            {candidateError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700">
                {candidateError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Razão Social <span className="text-red-500">*</span>
                </label>
                <input type="text" value={candidateForm.companyName} onChange={e => setCandidateField('companyName', e.target.value)} placeholder="Nome empresarial" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome Fantasia</label>
                <input type="text" value={candidateForm.tradeName} onChange={e => setCandidateField('tradeName', e.target.value)} placeholder="Nome fantasia" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">CNPJ</label>
                <input type="text" value={candidateForm.cnpj} onChange={e => setCandidateField('cnpj', e.target.value)} placeholder="00.000.000/0000-00" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Categoria</label>
                <input type="text" value={candidateForm.category} onChange={e => setCandidateField('category', e.target.value)} placeholder="Ex: Clínica de Estética" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Site</label>
                <input type="url" value={candidateForm.website} onChange={e => setCandidateField('website', e.target.value)} placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
                <input type="email" value={candidateForm.email} onChange={e => setCandidateField('email', e.target.value)} placeholder="contato@empresa.com.br" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone</label>
                <input type="tel" value={candidateForm.phone} onChange={e => setCandidateField('phone', e.target.value)} placeholder="(11) 3000-0000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Celular</label>
                <input type="tel" value={candidateForm.mobilePhone} onChange={e => setCandidateField('mobilePhone', e.target.value)} placeholder="(11) 9 9000-0000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Endereço</label>
                <input type="text" value={candidateForm.address} onChange={e => setCandidateField('address', e.target.value)} placeholder="Rua, número, bairro" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade</label>
                <input type="text" value={candidateForm.city} onChange={e => setCandidateField('city', e.target.value)} placeholder="São Paulo" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estado (UF)</label>
                <input type="text" value={candidateForm.state} onChange={e => setCandidateField('state', e.target.value)} placeholder="SP" maxLength={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rating (0–5)</label>
                <input type="number" value={candidateForm.rating} onChange={e => setCandidateField('rating', e.target.value)} placeholder="Ex: 4.2" min={0} max={5} step={0.1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Qtd. de reviews</label>
                <input type="number" value={candidateForm.reviewsCount} onChange={e => setCandidateField('reviewsCount', e.target.value)} placeholder="Ex: 87" min={0} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
            </div>

            <div className="flex justify-end pt-1 border-t border-gray-100">
              <button type="submit" disabled={candidateSubmitting} className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all">
                {candidateSubmitting ? '⏳ Salvando...' : '💾 Salvar candidato'}
              </button>
            </div>
          </form>
        )}

        {/* Candidate list */}
        {filteredCandidates.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🏢</span>
            <p className="text-sm font-semibold text-gray-400">
              {run.candidates.length === 0 ? 'Nenhum candidato ainda' : 'Nenhum candidato para este filtro'}
            </p>
            {run.candidates.length === 0 && (
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Clique em <strong>+ Adicionar candidato</strong> para incluir empresas manualmente.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCandidates.map(c => {
              const cs = statusBadge(c.status);
              const candidateLocation = [c.city, c.state].filter(Boolean).join(', ');
              const isScoring = scoringIds[c.id] === true;
              const isUpdatingStatus = statusIds[c.id] === true;
              const reasons = c.score?.reasons as string[] | null | undefined;

              const statusActions: { label: string; value: string; color: string }[] = [
                { label: '✅ Aprovar',          value: 'approved',       color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' },
                { label: '❌ Rejeitar',          value: 'rejected',       color: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' },
                { label: '📦 Arquivar',          value: 'archived',       color: 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200' },
                { label: '🔄 Voltar p/ revisão', value: 'pending_review', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' },
              ].filter(a => a.value !== c.status);

              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                  <div className="flex gap-3">
                    {/* Checkbox column */}
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 accent-indigo-600 cursor-pointer"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Info principal */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{c.companyName}</p>
                        {c.tradeName && (
                          <span className="text-xs text-gray-500">({c.tradeName})</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cs.color}`}>
                          {cs.label}
                        </span>
                        {c.score && (() => {
                          const v = verdictBadge(c.score.verdict);
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.color}`}>
                              {v.label}
                            </span>
                          );
                        })()}
                        {/* WA Eligibility Badge */}
                        {(() => {
                          const el = waEligibility(c);
                          const badge = WA_ELIGIBILITY_BADGE[el];
                          return (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {candidateLocation && <span>📍 {candidateLocation}</span>}
                        {c.category    && <span>🏷️ {c.category}</span>}
                        {c.rating != null && <span>⭐ {c.rating.toFixed(1)}{c.reviewsCount != null ? ` (${c.reviewsCount} reviews)` : ''}</span>}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[200px]">
                            🌐 {c.website}
                          </a>
                        )}
                        {c.email       && <span>✉️ {c.email}</span>}
                        {c.phone       && <span>📞 {c.phone}</span>}
                        {c.mobilePhone && <span>📱 {c.mobilePhone}</span>}
                      </div>
                    </div>

                    {/* Score panel + score action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {c.score ? (
                        <div className="flex flex-col items-center bg-gray-50 rounded-xl px-4 py-3 min-w-[90px]">
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Score</p>
                          <p className="text-2xl font-black text-indigo-600 mt-0.5">{c.score.overallScore}</p>
                          <p className="text-[10px] text-gray-400">/ 100</p>
                        </div>
                      ) : null}
                      <button
                        onClick={() => handleScore(c.id)}
                        disabled={isScoring || isUpdatingStatus || enrichingIds[c.id]}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200"
                      >
                        {isScoring ? '⏳ Calculando...' : '🧮 Calcular score'}
                      </button>

                      <button
                        onClick={() => handleEnrich(c.id)}
                        disabled={!c.website || enrichingIds[c.id] || isUpdatingStatus || isScoring}
                        title={!c.website ? 'Adicione um site para enriquecer' : ''}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200"
                      >
                        {enrichingIds[c.id] ? '⏳ Buscando...' : '🌐 Enriquecer lead'}
                      </button>
                    </div>
                    </div>
                  </div>

                  {/* Review action buttons */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                    {isUpdatingStatus ? (
                      <span className="text-xs text-gray-400 py-1">⏳ Atualizando status...</span>
                    ) : (
                      statusActions.map(action => (
                        <button
                          key={action.value}
                          onClick={() => handleStatus(c.id, action.value)}
                          disabled={isScoring}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border disabled:opacity-50 ${action.color}`}
                        >
                          {action.label}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Readiness e Consentimentos */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Status de Ativação / Consentimentos</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <label className="text-gray-600">Email:</label>
                          <select 
                            value={c.emailConsentStatus || 'unknown'} 
                            onChange={(e) => handleConsentPatch(c.id, 'emailConsentStatus', e.target.value)}
                            className="border border-gray-200 rounded px-1.5 py-0.5 text-gray-800 bg-gray-50 text-[11px] focus:outline-none focus:border-indigo-300"
                          >
                            <option value="unknown">Desconhecido</option>
                            <option value="granted">Concedido</option>
                            <option value="denied">Negado</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="text-gray-600">WhatsApp:</label>
                          <select 
                            value={c.whatsappConsentStatus || 'unknown'} 
                            onChange={(e) => handleConsentPatch(c.id, 'whatsappConsentStatus', e.target.value)}
                            className="border border-gray-200 rounded px-1.5 py-0.5 text-gray-800 bg-gray-50 text-[11px] focus:outline-none focus:border-indigo-300"
                          >
                            <option value="unknown">Desconhecido</option>
                            <option value="granted">Concedido</option>
                            <option value="denied">Negado</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-xs">
                        <span className="font-semibold text-gray-700">Readiness: </span>
                        <span className={`font-bold ${c.outreachStatus === 'blocked' ? 'text-red-600' : c.outreachStatus === 'not_ready' ? 'text-gray-400' : 'text-emerald-600'}`}>
                          {c.outreachStatus || 'not_ready'}
                        </span>
                        {c.outreachBlockReason && (
                          <p className="text-[10px] text-red-500 mt-0.5">Motivo bloqueio: {c.outreachBlockReason}</p>
                        )}
                        {c.lastReadinessCheckedAt && (
                          <p className="text-[9px] text-gray-400 mt-0.5">Checado em: {formatDate(c.lastReadinessCheckedAt)}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleReadinessCheck(c.id)}
                      disabled={readinessIds[c.id]}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 shrink-0"
                    >
                      {readinessIds[c.id] ? '⏳ Validando...' : '🛡️ Validar ativação'}
                    </button>
                  </div>

                  {/* Suppression Controls */}
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex gap-4 items-center">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Proteção Comercial (DNC)</p>
                      <button 
                        onClick={() => {
                          setShowSuppHistory(prev => ({ ...prev, [c.id]: !prev[c.id] }));
                          if (!showSuppHistory[c.id] && !suppressions[c.id]) {
                            loadSuppressions(c.id);
                          }
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        {showSuppHistory[c.id] ? 'Esconder Histórico / Gerenciar' : 'Gerenciar Supressões'}
                      </button>
                    </div>
                    {getActiveSuppressionText(c.id) && (
                      <p className="text-[10px] text-red-600 font-bold bg-red-50 inline-block px-1.5 py-0.5 rounded">
                        ⚠️ {getActiveSuppressionText(c.id)}
                      </p>
                    )}
                    
                    {showSuppHistory[c.id] && (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-2 space-y-3">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {['email', 'whatsapp', 'all'].map(chan => {
                            const isBlocked = (suppressions[c.id] || []).some(s => s.active && s.channel === chan);
                            return (
                              <button
                                key={chan}
                                onClick={() => handleToggleSuppression(c.id, chan, 'Supressão manual pelo painel')}
                                disabled={suppressionsLoading[c.id]}
                                className={`px-2 py-1 rounded-lg font-bold border ${isBlocked ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                              >
                                {suppressionsLoading[c.id] ? '⏳...' : isBlocked ? `Reativar ${chan === 'all' ? 'tudo' : chan}` : `Bloquear ${chan === 'all' ? 'tudo' : chan}`}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {(suppressions[c.id] || []).length === 0 ? (
                            <p className="text-[10px] text-gray-400">Nenhum histórico de supressão para este lead.</p>
                          ) : (
                            (suppressions[c.id] || []).map(s => (
                              <div key={s.id} className="text-[10px] flex justify-between items-center border-b border-gray-100 pb-1">
                                <div>
                                  <span className={`px-1.5 py-0.5 rounded font-bold ${s.active ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {s.active ? 'BLOQUEADO' : 'INATIVO'} ({s.channel})
                                  </span>
                                  <span className="ml-1 text-gray-600">{s.reason}</span>
                                </div>
                                <span className="text-gray-400">{formatDate(s.createdAt)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Score breakdown */}
                  {c.score && (
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Detalhamento do score</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          ['ICP Fit',             c.score.icpFitScore,              35],
                          ['Pot. Comercial',       c.score.commercialPotentialScore,  25],
                          ['Mat. Digital',         c.score.digitalMaturityScore,      20],
                          ['Abordabilidade',       c.score.approachabilityScore,      10],
                          ['Confiança',            c.score.confidenceScore,           10],
                        ].map(([label, value, max]) => (
                          <div key={String(label)} className="bg-gray-50 rounded-xl p-2 text-center">
                            <p className="text-[9px] font-semibold text-gray-500 leading-tight">{label}</p>
                            <p className="text-base font-black text-gray-800 mt-0.5">{value}</p>
                            <p className="text-[9px] text-gray-400">/ {max}</p>
                          </div>
                        ))}
                      </div>

                      {reasons && reasons.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Justificativas</p>
                          <ul className="space-y-0.5">
                            {reasons.map((reason, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="text-indigo-400 mt-px">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Pipeline (LEAD3) ───────────────────────────────────── */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Pipeline Comercial</p>
                        {/* Stage pill */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.pipelineStage === 'won'        ? 'bg-emerald-100 text-emerald-700' :
                          c.pipelineStage === 'lost'       ? 'bg-red-100 text-red-600' :
                          c.pipelineStage === 'negotiating'? 'bg-purple-100 text-purple-700' :
                          c.pipelineStage === 'proposal_sent'? 'bg-blue-100 text-blue-700' :
                          c.pipelineStage === 'interested' ? 'bg-cyan-100 text-cyan-700' :
                          c.pipelineStage === 'contacted'  ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {c.pipelineStage === 'new'          ? 'Novo' :
                           c.pipelineStage === 'contacted'    ? 'Contactado' :
                           c.pipelineStage === 'interested'   ? 'Interessado' :
                           c.pipelineStage === 'proposal_sent'? 'Proposta Enviada' :
                           c.pipelineStage === 'negotiating'  ? 'Negociando' :
                           c.pipelineStage === 'won'          ? 'Ganho' :
                           c.pipelineStage === 'lost'         ? 'Perdido' :
                           c.pipelineStage}
                        </span>
                        {c.priority === 'high' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                            🔴 Alta prioridade
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (openPipelineIds[c.id]) {
                            setOpenPipelineIds(prev => ({ ...prev, [c.id]: false }));
                          } else {
                            openPipelinePanel(c);
                          }
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        {openPipelineIds[c.id] ? 'Fechar pipeline' : 'Gerenciar pipeline'}
                      </button>
                    </div>

                    {c.lastContactAt && (
                      <p className="text-[9px] text-gray-400 mt-1">
                        Último contato: {formatDate(c.lastContactAt)}
                      </p>
                    )}
                    {c.nextActionAt && (
                      <p className="text-[9px] text-amber-600 font-semibold mt-0.5">
                        Próxima ação: {formatDate(c.nextActionAt)}
                      </p>
                    )}

                    {openPipelineIds[c.id] && pipelineDrafts[c.id] && (
                      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
                        {/* Pipeline form */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Estágio</label>
                            <select
                              value={pipelineDrafts[c.id].pipelineStage}
                              onChange={e => setPipelineDrafts(prev => ({ ...prev, [c.id]: { ...prev[c.id], pipelineStage: e.target.value } }))}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                              <option value="new">Novo</option>
                              <option value="contacted">Contactado</option>
                              <option value="interested">Interessado</option>
                              <option value="proposal_sent">Proposta Enviada</option>
                              <option value="negotiating">Negociando</option>
                              <option value="won">Ganho</option>
                              <option value="lost">Perdido</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Prioridade</label>
                            <select
                              value={pipelineDrafts[c.id].priority}
                              onChange={e => setPipelineDrafts(prev => ({ ...prev, [c.id]: { ...prev[c.id], priority: e.target.value } }))}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                              <option value="low">Baixa</option>
                              <option value="normal">Normal</option>
                              <option value="high">Alta</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                              Próxima ação (data/hora)
                            </label>
                            <input
                              type="datetime-local"
                              value={pipelineDrafts[c.id].nextActionAt}
                              onChange={e => setPipelineDrafts(prev => ({ ...prev, [c.id]: { ...prev[c.id], nextActionAt: e.target.value } }))}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                              Responsável
                            </label>
                            <select
                              value={pipelineDrafts[c.id].ownerUserId}
                              onChange={e => setPipelineDrafts(prev => ({ ...prev, [c.id]: { ...prev[c.id], ownerUserId: e.target.value } }))}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                              <option value="">Sem responsável</option>
                              {teamUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                              Notas internas
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Observações privadas sobre este lead..."
                              value={pipelineDrafts[c.id].internalNotes}
                              onChange={e => setPipelineDrafts(prev => ({ ...prev, [c.id]: { ...prev[c.id], internalNotes: e.target.value } }))}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-100 pt-2">
                          <button
                            onClick={() => handlePipelineSave(c.id)}
                            disabled={pipelineSaving[c.id]}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            {pipelineSaving[c.id] ? '⏳ Salvando...' : '💾 Salvar pipeline'}
                          </button>
                        </div>

                        {/* Follow-up actions */}
                        <div className="border-t border-gray-100 pt-3 space-y-2">
                          <p className="text-[10px] font-bold text-gray-600 uppercase">Registrar follow-up</p>
                          <textarea
                            rows={2}
                            placeholder="Descreva o contato ou adicione uma nota..."
                            value={followUpNote[c.id] ?? ''}
                            onChange={e => setFollowUpNote(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleFollowUpSubmit(c.id, 'manual_contact')}
                              disabled={followUpSubmitting[c.id] || !followUpNote[c.id]?.trim()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all"
                            >
                              {followUpSubmitting[c.id] ? '⏳' : '📞 Contato realizado'}
                            </button>
                            <button
                              onClick={() => handleFollowUpSubmit(c.id, 'note')}
                              disabled={followUpSubmitting[c.id] || !followUpNote[c.id]?.trim()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-all"
                            >
                              {followUpSubmitting[c.id] ? '⏳' : '📝 Salvar nota'}
                            </button>
                          </div>
                          <p className="text-[9px] text-gray-400">
                            "Contato realizado" registra o follow-up e atualiza a data do último contato automaticamente.
                          </p>
                        </div>

                        {/* Follow-up history */}
                        <div className="border-t border-gray-100 pt-3 space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-600 uppercase">Histórico de follow-ups</p>
                          {followUpLogsLoading[c.id] ? (
                            <p className="text-[10px] text-gray-400">Carregando...</p>
                          ) : !followUpLogs[c.id] || followUpLogs[c.id].length === 0 ? (
                            <p className="text-[10px] text-gray-400">Nenhum registro ainda.</p>
                          ) : (
                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                              {followUpLogs[c.id].map(log => (
                                <div key={log.id} className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
                                  <span className="shrink-0 text-[10px] mt-0.5">
                                    {log.type === 'stage_change'    ? '🔄' :
                                     log.type === 'manual_contact'  ? '📞' :
                                     log.type === 'auto_event'      ? '⚡' : '📝'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-700 break-words">{log.content}</p>
                                    <p className="text-[9px] text-gray-400 mt-0.5">{formatDate(log.loggedAt)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Validação Empresa / CNPJ (LEAD6) ──────────────────── */}
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Validação Empresa / CNPJ</p>
                      <button
                        onClick={() => handleRegistryValidate(c.id)}
                        disabled={registryLoadingIds[c.id]}
                        className="text-[10px] font-bold text-indigo-600 hover:underline disabled:opacity-50"
                      >
                        {registryLoadingIds[c.id] ? '⏳ Validando...' : '🏛 Validar via Receita Federal'}
                      </button>
                    </div>

                    {/* Current registry data */}
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[10px] text-gray-600">
                      <div>
                        <span className="font-semibold text-gray-500">CNPJ: </span>
                        {c.cnpj ? (
                          <span className="font-mono">{c.cnpj}</span>
                        ) : (
                          <span className="text-gray-400 italic">Não informado</span>
                        )}
                      </div>
                      {c.legalName && (
                        <div className="col-span-2">
                          <span className="font-semibold text-gray-500">Razão Social: </span>
                          <span>{c.legalName}</span>
                        </div>
                      )}
                      {c.cnpjStatus && (
                        <div>
                          <span className="font-semibold text-gray-500">Situação: </span>
                          <span className={
                            c.cnpjStatus === 'active'   ? 'text-green-600 font-bold' :
                            c.cnpjStatus === 'inactive' ? 'text-red-600 font-bold'   : 'text-gray-500'
                          }>
                            {c.cnpjStatus === 'active' ? 'Ativa' : c.cnpjStatus === 'inactive' ? 'Inativa' : 'Desconhecida'}
                          </span>
                        </div>
                      )}
                      {c.registryConfidence != null && (
                        <div>
                          <span className="font-semibold text-gray-500">Confiança: </span>
                          <span className={c.registryConfidence >= 80 ? 'text-green-600 font-bold' : c.registryConfidence >= 50 ? 'text-amber-600 font-bold' : 'text-red-600 font-bold'}>
                            {c.registryConfidence}%
                          </span>
                        </div>
                      )}
                      {c.companyRegistryLastCheckedAt && (
                        <div>
                          <span className="font-semibold text-gray-500">Última validação: </span>
                          <span>{formatDate(c.companyRegistryLastCheckedAt)}</span>
                        </div>
                      )}
                      {!c.cnpj && (
                        <div className="col-span-3 mt-1 text-[9px] text-amber-600">
                          Adicione o CNPJ ao candidato para validar automaticamente via Receita Federal (BrasilAPI).
                        </div>
                      )}
                    </div>

                    {/* Snapshots history toggle */}
                    {(registrySnapshots[c.id]?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setRegistrySnapshotsOpen(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                          className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 hover:underline"
                        >
                          {registrySnapshotsOpen[c.id] ? 'Esconder histórico' : `Ver histórico (${registrySnapshots[c.id].length} consulta${registrySnapshots[c.id].length !== 1 ? 's' : ''})`}
                        </button>

                        {registrySnapshotsOpen[c.id] && (
                          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                            {registrySnapshots[c.id].map(snap => (
                              <div key={snap.id} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[10px] text-gray-600 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${snap.matched ? 'text-green-600' : 'text-gray-400'}`}>
                                    {snap.matched ? '✓ Match' : '✗ Sem match'}
                                  </span>
                                  {snap.confidence != null && (
                                    <span className="text-gray-400">{snap.confidence}% confiança</span>
                                  )}
                                  <span className="ml-auto text-gray-400">{formatDate(snap.createdAt)}</span>
                                </div>
                                {snap.cnpj      && <div><span className="font-semibold">CNPJ:</span> <span className="font-mono">{snap.cnpj}</span></div>}
                                {snap.legalName && <div><span className="font-semibold">Razão Social:</span> {snap.legalName}</div>}
                                {snap.tradeName && <div><span className="font-semibold">Nome Fantasia:</span> {snap.tradeName}</div>}
                                {(snap.city || snap.state) && <div><span className="font-semibold">Localização:</span> {[snap.city, snap.state].filter(Boolean).join('/')}</div>}
                                {snap.cnpjStatus && <div><span className="font-semibold">Situação:</span> {snap.cnpjStatus === 'active' ? 'Ativa' : snap.cnpjStatus === 'inactive' ? 'Inativa' : 'Desconhecida'}</div>}
                                {snap.notes && snap.notes.length > 0 && (
                                  <div className="text-amber-600">{snap.notes.join(' | ')}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Seção 3: Tentativas de enriquecimento ────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">🔄 Histórico de Enriquecimento</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            A etapa de enriquecimento coleta dados comerciais <strong>apenas de páginas públicas do site </strong>
            (como a home e páginas de contato). Campanhas de WhatsApp e e-mail marketing não são disparadas de forma automatizada por aqui.
          </p>
        </div>

        {run.enrichmentAttempts.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-gray-400">Nenhuma tentativa de enriquecimento</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              O histórico de enriquecimento aparecerá aqui quando o processamento for iniciado.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Provedor</th>
                    <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                    <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Iniciada em</th>
                    <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Concluída em</th>
                    <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {run.enrichmentAttempts.map((a, i) => {
                    const as_ = statusBadge(a.status);
                    const filledCount = a.responseSummary?.filledFields?.length ?? 0;
                    return (
                      <tr key={a.id} className={`${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                        <td className="px-5 py-3 font-medium text-gray-800">{a.provider === 'website_public' ? 'Site' : a.provider}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${as_.color}`}>
                            {as_.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs hidden sm:table-cell">
                          {formatDate(a.attemptedAt)}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                          {a.completedAt ? formatDate(a.completedAt) : '—'}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {a.errorMessage ? (
                            <span className="text-red-600 max-w-[200px] truncate block" title={a.errorMessage}>
                              {a.errorMessage}
                            </span>
                          ) : (
                            <span className="text-gray-600 block">
                              {filledCount > 0 ? `${filledCount} campos preenchidos` : 'Sem novos dados'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Seção 4: Preparação e Rascunhos de Ativação ────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">📝 Rascunhos de Ativação (Outreach)</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Esta etapa prepara e envia campanhas individuais para candidatos aprovados e com <strong>consentimento concedido</strong>.
            <span className="text-emerald-700 font-semibold block mt-1">Os envios de Email e WhatsApp são feitos individualmente. Não existe disparo em massa aqui.</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleGenerateDrafts('email')}
              disabled={generatingDrafts}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all"
            >
              {generatingDrafts ? '⏳ Gerando...' : '✉️ Gerar rascunhos de Email'}
            </button>
            <button
              onClick={() => handleGenerateDrafts('whatsapp')}
              disabled={generatingDrafts}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all"
            >
              {generatingDrafts ? '⏳ Gerando...' : '💬 Gerar rascunhos de WhatsApp'}
            </button>
          </div>

          {draftSummary && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 mt-3 flex items-center gap-4 flex-wrap">
              <span><strong>Resumo da geração:</strong></span>
              <span>Requisitados: {draftSummary.requested}</span>
              <span>Elegíveis: {draftSummary.eligible}</span>
              <span className="text-emerald-600 font-bold">Criados: {draftSummary.created}</span>
              <span className="text-amber-600">Ignorados: {draftSummary.skipped}</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            {draftsLoading ? (
              <p className="text-xs text-gray-400">Carregando rascunhos...</p>
            ) : drafts.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum rascunho de campanha gerado para esta busca.</p>
            ) : (
              <div className="space-y-4">
                {drafts.map(d => (
                  <div key={d.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-3">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${d.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {d.channel}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{d.leadCandidate?.companyName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          d.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                          d.status === 'approved' ? 'bg-amber-100 text-amber-700' :
                          d.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {d.status === 'draft' ? 'Rascunho' : d.status === 'approved' ? 'Aprovado' : d.status === 'sent' ? 'Enviado' : d.status === 'rejected' ? 'Rejeitado' : 'Falhou'}
                        </span>
                      </div>
                      
                      {/* Draft actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {d.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleDraftApprove(d.id, 'approved')}
                              disabled={draftActionIds[d.id] === 'approving'}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            >
                              {draftActionIds[d.id] === 'approving' ? '⏳' : '✅ Aprovar'}
                            </button>
                            <button
                              onClick={() => handleDraftApprove(d.id, 'rejected')}
                              disabled={draftActionIds[d.id] === 'approving'}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            >
                              ❌ Rejeitar
                            </button>
                          </>
                        )}
                        {d.status === 'approved' && d.channel === 'email' && (
                          <button
                            onClick={() => handleDraftSend(d.id)}
                            disabled={draftActionIds[d.id] === 'sending'}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {draftActionIds[d.id] === 'sending' ? '⏳ Enviando...' : '🚀 Enviar email'}
                          </button>
                        )}
                        {d.status === 'approved' && d.channel === 'whatsapp' && (
                          <button
                            onClick={() => handleDraftSendWhatsapp(d.id)}
                            disabled={draftActionIds[d.id] === 'sending'}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                          >
                            {draftActionIds[d.id] === 'sending' ? '⏳ Enviando...' : '💬 Enviar WhatsApp'}
                          </button>
                        )}
                        {d.channel === 'whatsapp' && d.status !== 'approved' && d.status !== 'sent' && (
                           <span className="text-[10px] text-gray-500 font-semibold bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">Aprove para enviar WhatsApp</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      {d.subject && (
                        <p className="text-xs font-semibold text-gray-800 mb-2">Assunto: <span className="font-normal text-gray-600">{d.subject}</span></p>
                      )}
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                        {d.messageBody}
                      </div>
                    </div>

                    {/* Metadata / Erros */}
                    <div className="flex gap-4 pt-2 border-t border-gray-50">
                      {d.approvedAt && (
                        <p className="text-[10px] text-gray-400">Aprovado em: {formatDate(d.approvedAt)}</p>
                      )}
                      {d.sentAt && (
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Enviado em: {formatDate(d.sentAt)}
                          {d.deliveryMeta?.deliveredTo ? ` para ${d.deliveryMeta.deliveredTo}` : ''}
                        </p>
                      )}
                    </div>
                    {d.errorMessage && (
                      <p className="text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 mt-2">
                        <strong>Falha no envio:</strong> {d.errorMessage}
                      </p>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Seção 5: Execução de Campanha Múltipla ────────────────────── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">🚀 Execução de Campanha (Lote Controlado)</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-3xl">
            Apenas leads aprovados, com <strong>consentimento</strong> e readiness válidos entram no lote. O envio é controlado por lote pequeno (máx 20).
            <span className="text-red-700 font-semibold block mt-1">Não existe blasting irrestrito nem retry oculto aqui.</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          {/* Formulário de Execução */}
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs font-bold text-gray-700">Canal</label>
              <select 
                value={execFormChannel}
                onChange={e => setExecFormChannel(e.target.value as 'email' | 'whatsapp')}
                className="p-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-xs font-bold text-gray-700">Tamanho do Lote (Máx: 20)</label>
              <input 
                type="number" 
                min={1} 
                max={20} 
                value={execFormBatchSize}
                onChange={e => setExecFormBatchSize(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded-lg text-sm bg-white w-full sm:w-32"
              />
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-auto flex-1">
              <label className="text-xs font-bold text-gray-700">Notas Opcionais</label>
              <input 
                type="text" 
                placeholder="Ex: Disparo manhã..."
                value={execFormNotes}
                onChange={e => setExecFormNotes(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg text-sm bg-white w-full"
              />
            </div>

            <button
              onClick={handleExecuteBatch}
              disabled={executingBatch}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {executingBatch ? '⏳ Executando...' : '▶️ Executar Lote'}
            </button>
          </div>

          {/* Histórico de Execuções */}
          <div>
            <h3 className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3">Histórico de Execuções</h3>
            {executionsLoading ? (
              <p className="text-xs text-gray-400">Carregando histórico...</p>
            ) : executions.length === 0 ? (
              <p className="text-[11px] text-gray-400">Nenhuma execução em lote registrada até o momento.</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">Data</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">Canal</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">Req. / Elegível</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">Estatísticas</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {executions.map(exec => (
                        <tr key={exec.id}>
                          <td className="px-3 py-3 text-xs text-gray-600">{formatDate(exec.createdAt)}</td>
                          <td className="px-3 py-3 font-semibold text-gray-800 text-xs uppercase">{exec.channel}</td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              exec.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              exec.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                              exec.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {exec.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[11px] text-gray-600">
                            {exec.requestedCount} / {exec.eligibleCount} (Tamanho: {exec.batchSize})
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-emerald-600 font-bold" title="Enviados">{exec.sentCount} Env</span>
                              <span className="text-amber-600" title="Ignorados">{exec.skippedCount} Ign</span>
                              <span className="text-red-600" title="Falhas">{exec.failedCount} Fal</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <button 
                              onClick={() => loadExecutionDetail(exec.id)}
                              className="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                              Ver Detalhes {executionDetailLoading && selectedExecution?.id !== exec.id && '⏳'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Área de detalhes da execução selecionada */}
                {selectedExecution && selectedExecution.items && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mt-2 shadow-inner">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-bold text-gray-800">Detalhes da Execução</h4>
                      <button onClick={() => setSelectedExecution(null)} className="text-[10px] text-gray-500 hover:text-gray-800 font-bold px-2 py-1 bg-gray-200 rounded">FECHAR (X)</button>
                    </div>
                    {selectedExecution.items.length === 0 ? (
                      <p className="text-[11px] text-gray-500">Nenhum item processado nesta execução.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {selectedExecution.items.map(item => (
                          <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-start gap-2 text-[11px]">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-gray-800">{item.leadCandidate?.companyName}</p>
                                {item.outcomeSource === 'provider_webhook' && (
                                  <span 
                                    className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-md border border-blue-200 cursor-help" 
                                    title={`Último evento: ${item.lastProviderEventType} em ${item.lastProviderEventAt ? formatDate(item.lastProviderEventAt) : 'N/A'}`}
                                  >
                                    🤖 Atualizado por webhook
                                  </span>
                                )}
                              </div>
                              {item.deliveredTo && <p className="text-gray-500 mt-0.5">Destino: {item.deliveredTo}</p>}
                              {item.reason && <p className="text-red-500 mt-0.5">Interrompido/Falha: {item.reason}</p>}
                              
                              {item.status === 'sent' && (
                                <div className="mt-2 flex flex-col gap-1">
                                  <p className="text-gray-600 font-semibold mb-1">Resultado Comercial (Outcome):</p>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <select
                                      value={item.responseStatus || 'unknown'}
                                      onChange={e => handleUpdateOutcome(item.id, e.target.value)}
                                      disabled={outcomeLoadings[item.id]}
                                      className="border border-gray-200 rounded px-2 py-1 bg-gray-50 text-[10px] focus:outline-none"
                                    >
                                      <option value="unknown">Nenhum retorno</option>
                                      <option value="delivered">Entregue</option>
                                      <option value="opened">Aberto/Lido</option>
                                      <option value="replied">Respondido</option>
                                      <option value="qualified">Qualificado</option>
                                      <option value="converted">Convertido</option>
                                      <option value="lost">Perdido</option>
                                      <option value="unsubscribed">Opt-out (Descadastro)</option>
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Notas manuais..."
                                      defaultValue={item.outcomeNotes || ''}
                                      onBlur={e => {
                                        if (e.target.value !== (item.outcomeNotes || '')) {
                                          handleUpdateOutcome(item.id, item.responseStatus || 'unknown', e.target.value, item.conversionValue || undefined);
                                        }
                                      }}
                                      disabled={outcomeLoadings[item.id]}
                                      className="border border-gray-200 rounded px-2 py-1 bg-white text-[10px] w-32 focus:outline-none"
                                    />
                                    {item.responseStatus === 'converted' && (
                                      <input
                                        type="number"
                                        placeholder="Valor (R$)"
                                        defaultValue={item.conversionValue || ''}
                                        onBlur={e => {
                                          const val = e.target.value ? Number(e.target.value) : undefined;
                                          if (val !== item.conversionValue) {
                                            handleUpdateOutcome(item.id, item.responseStatus || 'converted', item.outcomeNotes || undefined, val);
                                          }
                                        }}
                                        disabled={outcomeLoadings[item.id]}
                                        className="border border-gray-200 rounded px-2 py-1 bg-white text-[10px] w-24 focus:outline-none"
                                      />
                                    )}
                                    {outcomeLoadings[item.id] && <span className="text-gray-400">⏳ Atualizando...</span>}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                                item.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                                item.status === 'skipped' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.status}
                              </span>
                              <span className="text-gray-400">Envio: {formatDate(item.processedAt)}</span>
                              {item.respondedAt && <span className="text-blue-500 font-semibold mt-1">Resposta: {formatDate(item.respondedAt)}</span>}
                              {item.convertedAt && <span className="text-emerald-600 font-bold">Conversão: {formatDate(item.convertedAt)}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Seção 6: Análise e Conversões ──────────────────────────── */}
      {/* ── WA Quick-Batch Modal ──────────────────────────────────────────────── */}
      {waBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">📱 Enviar WhatsApp em Lote</h2>
              <button
                onClick={() => { setWaBatchOpen(false); setWaBatchResult(null); }}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Apenas leads <strong>aprovados</strong>, com <strong>consentimento WhatsApp = concedido</strong> e readiness{' '}
              <strong>ready_whatsapp</strong> ou <strong>ready_multichannel</strong> serão enviados.
              {' '}<span className="font-semibold text-amber-700">{selectedIds.size} lead(s) selecionado(s).</span>
            </p>

            {!waBatchResult ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Olá! Gostaríamos de apresentar nossa solução..."
                    value={waBatchMessage}
                    onChange={e => setWaBatchMessage(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tamanho do lote (máx 20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={waBatchSize}
                    onChange={e => setWaBatchSize(Math.min(20, Math.max(1, Number(e.target.value))))}
                    className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setWaBatchOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleWaQuickBatch}
                    disabled={waBatchSending || !waBatchMessage.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    {waBatchSending ? '⏳ Enviando...' : '🚀 Enviar agora'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {waBatchResult.errorMessage ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    <strong>Erro:</strong> {waBatchResult.errorMessage}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-emerald-700">{waBatchResult.sent}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Enviados</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-red-700">{waBatchResult.failed}</p>
                      <p className="text-[10px] font-bold text-red-600 uppercase">Falhas</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-xl font-black text-amber-700">{waBatchResult.skipped}</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase">Ignorados</p>
                    </div>
                  </div>
                )}

                {!waBatchResult.errorMessage && Object.keys(waBatchResult.skippedReasons).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 space-y-1">
                    <p className="font-bold text-gray-600 text-[11px] uppercase mb-1">Motivos de exclusão:</p>
                    {Object.entries(waBatchResult.skippedReasons).map(([reason, count]) => (
                      <div key={reason} className="flex justify-between">
                        <span>{reason}</span>
                        <span className="font-bold">{count as number}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => { setWaBatchResult(null); setWaBatchMessage(''); }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Novo envio
                  </button>
                  <button
                    onClick={() => { setWaBatchOpen(false); setWaBatchResult(null); }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {analytics && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">📊 Resultados e Conversões (Analytics)</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-3xl">
              Esta seção registra o resultado comercial após o envio. Eventos de email (Resend) podem atualizar entrega, abertura, bounce e complains automaticamente. Opt-outs e bounces geram supressão automática no canal. 
              <span className="text-indigo-700 font-semibold block mt-1">O WhatsApp ainda não possui sync automático nesta etapa. Faça as atualizações de resposta ou conversão manualmente na lista de detalhes das execuções acima. O mesmo vale caso queira forçar uma conversão de email manulamente.</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { label: 'Enviados',  value: analytics.overall.totalSent, color: 'text-gray-900' },
              { label: 'Abertos/Lidos', value: analytics.overall.totalOpened, color: 'text-indigo-600' },
              { label: 'Respondidos', value: analytics.overall.totalReplied, color: 'text-blue-600' },
              { label: 'Qualificados', value: analytics.overall.totalQualified, color: 'text-emerald-500' },
              { label: 'Convertidos', value: analytics.overall.totalConverted, color: 'text-emerald-700' },
              { label: 'Opt-outs', value: analytics.overall.totalUnsubscribed, color: 'text-red-500' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-4 shrink-0 shadow-sm flex flex-col justify-center items-center text-center">
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Por Canal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['email', 'whatsapp'].map(ch => {
              const base = analytics.byChannel[ch];
              if (!base) return null;
              return (
                <div key={ch} className="bg-white rounded-2xl border border-gray-100 p-5 shrink-0 grow shadow-sm">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-3 border-b border-gray-50 pb-2">{ch}</h3>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500 font-semibold">Enviados</span>
                    <span className="font-bold">{base.totalSent}</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500 font-semibold">Respondidos (Reply Rate)</span>
                    <span className="font-bold">{base.totalReplied} ({(base.rates?.replyRate * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500 font-semibold">Convertidos (Conversion Rate)</span>
                    <span className="font-bold text-emerald-600">{base.totalConverted} ({(base.rates?.conversionRate * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-500 font-semibold">Valor Convertido</span>
                    <span className="font-bold text-emerald-700">R$ {base.totalConversionValue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500 font-semibold">Descadastrados (Opt-out)</span>
                    <span className="font-bold text-red-500">{base.totalUnsubscribed} ({(base.rates?.unsubscribeRate * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
