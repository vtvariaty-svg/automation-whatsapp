'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchRun {
  id: string;
  niche: string;
  city: string | null;
  state: string | null;
  radiusKm: number | null;
  maxResults: number;
  status: string;
  totalCandidates: number;
  createdAt: string;
  _count: { candidates: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken(): string {
  return localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
}

function statusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'queued':    return { label: 'Na fila',    color: 'bg-blue-100 text-blue-700' };
    case 'completed': return { label: 'Concluída',  color: 'bg-green-100 text-green-700' };
    case 'failed':    return { label: 'Falhou',     color: 'bg-red-100 text-red-600' };
    default:          return { label: 'Rascunho',   color: 'bg-gray-100 text-gray-600' };
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Initial form state ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  niche: '',
  city: '',
  state: '',
  radiusKm: '',
  maxResults: '50',
  minTicket: '',
  minRating: '',
  minReviews: '',
  requiresWebsite: 'nao',
  requiresCommercialPhone: 'nao',
  localB2BOnly: 'nao',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadIntelligencePage() {
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // ── Fetch list ───────────────────────────────────────────────────────────

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    setLoadError(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/lead-intelligence/search-runs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao carregar buscas.');
      const data = await res.json();
      setRuns(data.runs ?? []);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => { loadRuns(); }, [loadRuns]);

  // ── Form helpers ─────────────────────────────────────────────────────────

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!form.niche.trim()) {
      setSubmitError('O campo "Nicho / segmento" é obrigatório.');
      return;
    }

    const body: Record<string, unknown> = {
      niche: form.niche.trim(),
      city:  form.city.trim()  || undefined,
      state: form.state.trim() || undefined,
      radiusKm:   form.radiusKm  ? Number(form.radiusKm)  : undefined,
      maxResults: form.maxResults ? Number(form.maxResults) : 50,
      minTicket:  form.minTicket  ? Number(form.minTicket)  : undefined,
      minRating:  form.minRating  ? Number(form.minRating)  : undefined,
      minReviews: form.minReviews ? Number(form.minReviews) : undefined,
      requiresWebsite:         form.requiresWebsite         === 'sim',
      requiresCommercialPhone: form.requiresCommercialPhone === 'sim',
      localB2BOnly:            form.localB2BOnly            === 'sim',
    };

    setSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/lead-intelligence/search-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Erro ao criar busca.');
        return;
      }
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await loadRuns();
    } catch {
      setSubmitError('Erro de conexão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-bold text-gray-900">Prospecção IA</h1>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">
              Business
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Descubra e priorize empresas por nicho, região e potencial comercial.
          </p>
        </div>
        <button
          onClick={() => setFormOpen(o => !o)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20"
        >
          {formOpen ? '✕ Cancelar' : '+ Nova busca'}
        </button>
      </div>

      {/* ── Form (collapsible) ─────────────────────────────────────────────── */}
      {formOpen && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nova busca de prospecção</h2>
            <p className="text-xs text-gray-500 mt-0.5">Preencha os critérios e salve como rascunho para processar em seguida.</p>
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Coluna 1 — Descoberta */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">🔍 Descoberta</h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nicho / segmento <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.niche}
                  onChange={e => setField('niche', e.target.value)}
                  placeholder="Ex: clínicas de estética, restaurantes japoneses..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setField('city', e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={e => setField('state', e.target.value)}
                    placeholder="Ex: SP"
                    maxLength={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Raio (km)</label>
                  <input
                    type="number"
                    value={form.radiusKm}
                    onChange={e => setField('radiusKm', e.target.value)}
                    placeholder="Ex: 20"
                    min={1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Qtd. máxima</label>
                  <input
                    type="number"
                    value={form.maxResults}
                    onChange={e => setField('maxResults', e.target.value)}
                    placeholder="50"
                    min={1}
                    max={500}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </div>

            {/* Coluna 2 — Parâmetros */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">⚙️ Parâmetros de análise</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ticket mínimo (R$)</label>
                  <input
                    type="number"
                    value={form.minTicket}
                    onChange={e => setField('minTicket', e.target.value)}
                    placeholder="Ex: 500"
                    min={0}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Rating mínimo (0–5)</label>
                  <input
                    type="number"
                    value={form.minRating}
                    onChange={e => setField('minRating', e.target.value)}
                    placeholder="Ex: 3.5"
                    min={0}
                    max={5}
                    step={0.1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mínimo de reviews</label>
                <input
                  type="number"
                  value={form.minReviews}
                  onChange={e => setField('minReviews', e.target.value)}
                  placeholder="Ex: 10"
                  min={0}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="space-y-2">
                {(
                  [
                    ['requiresWebsite',         'Precisa ter site?'],
                    ['requiresCommercialPhone',  'Precisa ter telefone comercial?'],
                    ['localB2BOnly',             'Foco em B2B local?'],
                  ] as [keyof typeof EMPTY_FORM, string][]
                ).map(([key, lbl]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">{lbl}</label>
                    <select
                      value={form[key]}
                      onChange={e => setField(key, e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="nao">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all"
            >
              {submitting ? '⏳ Salvando...' : '💾 Salvar rascunho'}
            </button>
          </div>
        </form>
      )}

      {/* ── Run list ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Buscas anteriores</h2>
          {!loadingRuns && (
            <span className="text-xs text-gray-500">{runs.length} busca{runs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loadingRuns && (
          <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
        )}

        {!loadingRuns && loadError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
            {loadError}
            <button onClick={loadRuns} className="ml-3 underline text-red-600 hover:text-red-800 text-xs">
              Tentar novamente
            </button>
          </div>
        )}

        {!loadingRuns && !loadError && runs.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl py-16 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-3">🎯</span>
            <p className="text-sm font-semibold text-gray-400">Nenhuma busca criada ainda</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Clique em <strong>+ Nova busca</strong> para configurar sua primeira prospecção.
            </p>
          </div>
        )}

        {!loadingRuns && !loadError && runs.length > 0 && (
          <div className="space-y-3">
            {runs.map(run => {
              const { label, color } = statusLabel(run.status);
              const location = [run.city, run.state].filter(Boolean).join(', ');
              return (
                <Link
                  key={run.id}
                  href={`/dashboard/lead-intelligence/${run.id}`}
                  className="block bg-white rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm p-5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">🎯</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{run.niche}</p>
                        {location && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            📍 {location}{run.radiusKm ? ` · ${run.radiusKm} km` : ''}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {formatDate(run.createdAt)} · máx. {run.maxResults} resultados
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{run._count.candidates}</p>
                        <p className="text-[10px] text-gray-400">candidatos</p>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${color}`}>
                        {label}
                      </span>
                      <span className="text-gray-400 text-xs">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
