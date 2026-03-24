'use client';

import { useState, useEffect } from 'react';
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
    case 'queued':    return { label: 'Na fila',         color: 'bg-blue-100 text-blue-700' };
    case 'completed': return { label: 'Concluída',       color: 'bg-green-100 text-green-700' };
    case 'failed':    return { label: 'Falhou',          color: 'bg-red-100 text-red-600' };
    case 'approved':  return { label: 'Aprovado',        color: 'bg-green-100 text-green-700' };
    case 'rejected':  return { label: 'Rejeitado',       color: 'bg-red-100 text-red-600' };
    case 'archived':  return { label: 'Arquivado',       color: 'bg-gray-100 text-gray-500' };
    case 'success':   return { label: 'Sucesso',         color: 'bg-green-100 text-green-700' };
    case 'pending':   return { label: 'Pendente',        color: 'bg-yellow-100 text-yellow-700' };
    default:          return { label: status,            color: 'bg-gray-100 text-gray-600' };
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchRunDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [run, setRun] = useState<SearchRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const token = getAuthToken();
    setLoading(true);
    setError(null);
    setNotFound(false);

    fetch(`/api/lead-intelligence/search-runs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Erro ao carregar a busca.');
        const data = await res.json();
        setRun(data.run);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erro inesperado.'))
      .finally(() => setLoading(false));
  }, [id]);

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">🏢 Candidatos</h2>
          <span className="text-xs text-gray-500">{run.candidates.length} encontrado{run.candidates.length !== 1 ? 's' : ''}</span>
        </div>

        {run.candidates.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🏢</span>
            <p className="text-sm font-semibold text-gray-400">Nenhum candidato ainda</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Os candidatos serão adicionados quando a busca for processada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {run.candidates.map(c => {
              const cs = statusBadge(c.status);
              const candidateLocation = [c.city, c.state].filter(Boolean).join(', ');
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-5">
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
                        {c.category  && <span>🏷️ {c.category}</span>}
                        {c.rating != null && <span>⭐ {c.rating.toFixed(1)}{c.reviewsCount != null ? ` (${c.reviewsCount} reviews)` : ''}</span>}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[200px]">
                            🌐 {c.website}
                          </a>
                        )}
                        {c.email    && <span>✉️ {c.email}</span>}
                        {c.phone    && <span>📞 {c.phone}</span>}
                        {c.mobilePhone && <span>📱 {c.mobilePhone}</span>}
                      </div>
                    </div>

                    {/* Score */}
                    {c.score && (
                      <div className="flex flex-col items-center shrink-0 bg-gray-50 rounded-xl px-4 py-3 min-w-[90px]">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Score</p>
                        <p className="text-2xl font-black text-indigo-600 mt-0.5">{c.score.overallScore}</p>
                        <p className="text-[10px] text-gray-400">/ 100</p>
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
