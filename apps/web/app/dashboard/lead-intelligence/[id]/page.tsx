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
  category: string | null;
  rating: number | null;
  reviewsCount: number | null;
  status: string;
  source: string;
  createdAt: string;
  score: LeadScore | null;
}

interface EnrichmentAttempt {
  id: string;
  provider: string;
  status: string;
  attemptedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
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
    case 'completed':      return { label: 'Concluída',       color: 'bg-green-100 text-green-700' };
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

  useEffect(() => { loadRun(); }, [loadRun]);

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

      {/* ── Seção 2: Candidatos ─────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-gray-900">🏢 Candidatos</h2>
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
                        disabled={isScoring || isUpdatingStatus}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200"
                      >
                        {isScoring ? '⏳ Calculando...' : '🧮 Calcular score'}
                      </button>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Seção 3: Tentativas de enriquecimento ────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-900">🔄 Tentativas de enriquecimento</h2>

        {run.enrichmentAttempts.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-10 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-gray-400">Nenhuma tentativa de enriquecimento</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              O histórico de enriquecimento aparecerá aqui quando o processamento for iniciado.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Provedor</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Status</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Iniciada em</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Concluída em</th>
                  <th className="text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide px-5 py-3">Erro</th>
                </tr>
              </thead>
              <tbody>
                {run.enrichmentAttempts.map((a, i) => {
                  const as_ = statusBadge(a.status);
                  return (
                    <tr key={a.id} className={`${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                      <td className="px-5 py-3 font-medium text-gray-800">{a.provider}</td>
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
                      <td className="px-5 py-3 text-xs text-red-600 max-w-[200px] truncate">
                        {a.errorMessage ?? '—'}
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
  );
}
