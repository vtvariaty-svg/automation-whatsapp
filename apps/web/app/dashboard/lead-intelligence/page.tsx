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

interface ProspectingTemplate {
  id: string;
  name: string;
  niche: string;
  city: string | null;
  state: string | null;
  preferredChannel: string | null;
  active: boolean;
  createdAt: string;
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

  const [templates, setTemplates] = useState<ProspectingTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/lead-intelligence/templates?active=true', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => { loadRuns(); loadTemplates(); }, [loadRuns, loadTemplates]);

  // ── Template Actions ─────────────────────────────────────────────────────

  const [usingTemplateId, setUsingTemplateId] = useState<string | null>(null);
  
  async function handleUseTemplate(id: string) {
    setUsingTemplateId(id);
    try {
      const res = await fetch(`/api/lead-intelligence/templates/${id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        const t = data.template;
        setForm({
          niche: t.niche || '',
          city: t.city || '',
          state: t.state || '',
          radiusKm: t.radiusKm ? String(t.radiusKm) : '',
          maxResults: t.maxResults ? String(t.maxResults) : '50',
          minTicket: t.minTicket ? String(t.minTicket) : '',
          minRating: t.minRating ? String(t.minRating) : '',
          minReviews: t.minReviews ? String(t.minReviews) : '',
          requiresWebsite: t.requiresWebsite ? 'sim' : 'nao',
          requiresCommercialPhone: t.requiresCommercialPhone ? 'sim' : 'nao',
          localB2BOnly: t.localB2BOnly ? 'sim' : 'nao',
        });
        setFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setUsingTemplateId(null);
    }
  }

  const [cloningId, setCloningId] = useState<string | null>(null);

  async function handleCloneRun(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCloningId(id);
    try {
      const res = await fetch(`/api/lead-intelligence/search-runs/${id}/clone`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        await loadRuns();
      }
    } finally {
      setCloningId(null);
    }
  }

  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  function buildPayload(f: typeof EMPTY_FORM) {
    return {
      niche: f.niche.trim(),
      city:  f.city.trim()  || undefined,
      state: f.state.trim() || undefined,
      radiusKm:   f.radiusKm  ? Number(f.radiusKm)  : undefined,
      maxResults: f.maxResults ? Number(f.maxResults) : 50,
      minTicket:  f.minTicket  ? Number(f.minTicket)  : undefined,
      minRating:  f.minRating  ? Number(f.minRating)  : undefined,
      minReviews: f.minReviews ? Number(f.minReviews) : undefined,
      requiresWebsite:         f.requiresWebsite         === 'sim',
      requiresCommercialPhone: f.requiresCommercialPhone === 'sim',
      localB2BOnly:            f.localB2BOnly            === 'sim',
    };
  }

  async function handleSaveTemplate() {
    setTemplateMessage(null);
    if (!templateName.trim() || !form.niche.trim()) {
      setTemplateMessage({ type: 'error', text: 'Nome do template e Nicho são obrigatórios' });
      return;
    }
    setSavingTemplate(true);
    try {
      const body = { ...buildPayload(form), name: templateName.trim() };
      const res = await fetch('/api/lead-intelligence/templates', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
         body: JSON.stringify(body)
      });
      if (res.ok) {
        setTemplateMessage({ type: 'success', text: 'Template salvo!' });
        setTemplateName('');
        await loadTemplates();
      } else {
        const data = await res.json();
        setTemplateMessage({ type: 'error', text: data.error || 'Erro ao salvar' });
      }
    } finally {
      setSavingTemplate(false);
    }
  }

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

    const body: Record<string, unknown> = buildPayload(form);

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

      {/* ── Operations entry card ──────────────────────────────────────────── */}
      <Link
        href="/dashboard/lead-intelligence/operations"
        className="block bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:border-indigo-400 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📋</span>
              <p className="text-sm font-bold text-indigo-900">Abrir operação de leads</p>
            </div>
            <p className="text-xs text-indigo-700 max-w-lg">
              Cockpit de follow-up diário. Visualize e priorize leads de todas as buscas em uma única fila — filtre por vencidos, hoje, sem responsável e registre contatos sem mudar de página.
            </p>
          </div>
          <span className="text-indigo-400 text-lg shrink-0">→</span>
        </div>
      </Link>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex items-start gap-3">
        <span className="text-xl">ℹ️</span>
        <div className="flex-1">
          <p className="font-bold mb-1">Como funcionam os Templates e Clones?</p>
          <p>
            • <strong>Templates</strong> servem para guardar critérios de busca e parâmetros de filtro frequentes (ex: 'Estética SP Alto Padrão'), facilitando a repetição do fluxo sem preencher o formulário do zero.<br/>
            • A ação de <strong>Clonar busca</strong> gera um novo rascunho aproveitando apenas a configuração base. Nenhum candidato, campanha ou histórico operacional da busca anterior é copiado.
          </p>
        </div>
      </div>

      {/* ── Seção de Templates ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Templates de Prospecção</h2>
        {loadingTemplates ? (
          <p className="text-xs text-gray-400">Carregando templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-gray-400">Você ainda não tem templates salvos. Crie uma nova busca e salve-a como template para reaproveitá-la futuramente.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-gray-900 truncate" title={t.name}>{t.name}</h3>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md">Ativo</span>
                </div>
                <p className="text-xs text-gray-500 mb-1"><strong>Nicho:</strong> {t.niche}</p>
                <p className="text-xs text-gray-500 mb-3"><strong>Local:</strong> {[t.city, t.state].filter(Boolean).join('-') || 'Geral'}</p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-[10px] text-gray-400">Criado em {formatDate(t.createdAt).substring(0, 10)}</span>
                  <button
                    onClick={() => handleUseTemplate(t.id)}
                    disabled={usingTemplateId === t.id}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {usingTemplateId === t.id ? '⏳' : 'Usar template'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800 flex items-start gap-3">
        <span className="text-xl">ℹ️</span>
        <div className="flex-1">
          <p className="font-bold mb-1">Como funcionam os Templates e Clones?</p>
          <p>
            • <strong>Templates</strong> servem para guardar critérios de busca e parâmetros de filtro frequentes (ex: 'Estética SP Alto Padrão'), facilitando a repetição do fluxo sem preencher o formulário do zero.<br/>
            • A ação de <strong>Clonar busca</strong> gera um novo rascunho aproveitando apenas a configuração base. Nenhum candidato, campanha ou histórico operacional da busca anterior é copiado.
          </p>
        </div>
      </div>

      {/* ── Seção de Templates ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Templates de Prospecção</h2>
        {loadingTemplates ? (
          <p className="text-xs text-gray-400">Carregando templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-gray-400">Você ainda não tem templates salvos. Crie uma nova busca e salve-a como template para reaproveitá-la futuramente.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 transition-transform flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-gray-900 truncate" title={t.name}>{t.name}</h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-md">Ativo</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1"><strong>Nicho:</strong> {t.niche}</p>
                  <p className="text-xs text-gray-500 mb-3"><strong>Local:</strong> {[t.city, t.state].filter(Boolean).join('-') || 'Geral'}</p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto">
                  <span className="text-[10px] text-gray-400">Criado em {formatDate(t.createdAt).substring(0, 10)}</span>
                  <button
                    onClick={() => handleUseTemplate(t.id)}
                    disabled={usingTemplateId === t.id}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {usingTemplateId === t.id ? '⏳' : 'Usar template'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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

          {/* Submit & Save Template */}
          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <input 
                type="text" 
                placeholder="Nome do template"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="bg-green-100 hover:bg-green-200 text-green-800 font-bold px-4 py-2 rounded-lg text-xs transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {savingTemplate ? '⏳' : 'Salvar como template'}
              </button>
              {templateMessage && (
                <span className={`text-xs font-semibold ${templateMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                  {templateMessage.text}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all"
            >
              {submitting ? '⏳ Salvando rascunho...' : '🚀 Criar nova busca'}
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
                      <button
                        onClick={(e) => handleCloneRun(run.id, e)}
                        disabled={cloningId === run.id}
                        className="ml-2 text-[10px] border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 bg-white font-bold px-2.5 py-1.5 rounded-lg transition-all"
                        title="Clonar configuração desta busca"
                      >
                        {cloningId === run.id ? '⏳' : 'Clonar busca'}
                      </button>
                      <span className="text-gray-400 text-xs ml-1">→</span>
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
