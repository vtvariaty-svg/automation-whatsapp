'use client';

import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { FEATURE_UPGRADE_MESSAGES } from '@/lib/config/plans';
import UpgradeGate from '@/components/UpgradeGate';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Broadcast {
  id: string;
  templateName: string;
  templateLang: string;
  status: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  source: string | null;
  createdAt: string;
  _count?: { recipients: number };
}

interface BroadcastDetail extends Broadcast {
  recipients: {
    id: string;
    phone: string;
    customerName: string | null;
    status: string;
    errorMessage: string | null;
    sentAt: string | null;
  }[];
}

interface Template {
  name: string;
  category: string;
  language: string;
  status: string;
  body: string;
  placeholders: string[];
  placeholderLabels?: string[];
  isCustom?: boolean;
}

interface CustomTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  body: string;
  header: string | null;
  footer: string | null;
  exampleVars: string[];
  status: string; // DRAFT | PENDING | APPROVED | REJECTED
  rejectedReason: string | null;
  createdAt: string;
}

type ViewMode = 'list' | 'create' | 'detail' | 'templates';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:            { label: 'Rascunho',    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  scheduled:        { label: 'Agendado',    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  processing:       { label: 'Processando', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  completed:        { label: 'Concluído',   color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  partially_failed: { label: 'Parcial',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  failed:           { label: 'Falhou',      color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled:        { label: 'Cancelado',   color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const TMPL_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT:    { label: 'Rascunho',            color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  PENDING:  { label: 'Aguardando Meta',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  APPROVED: { label: 'Aprovado',            color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  REJECTED: { label: 'Rejeitado pela Meta', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const RCPT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'text-gray-400' },
  sent:    { label: 'Enviado',  color: 'text-emerald-400' },
  failed:  { label: 'Falhou',  color: 'text-red-400' },
  skipped: { label: 'Ignorado', color: 'text-gray-500' },
};

const CATEGORIES = [
  { value: 'UTILITY',        label: 'Utilidade',       desc: 'Confirmações, lembretes, notificações — aprovação rápida' },
  { value: 'MARKETING',      label: 'Marketing',       desc: 'Promoções e ofertas — pode exigir revisão humana' },
  { value: 'AUTHENTICATION', label: 'Autenticação',    desc: 'Códigos OTP — aprovação quase imediata' },
];

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BroadcastsPage() {
  const authContext = useContext(AuthContext);
  const token = authContext?.token || '';
  const ent = useEntitlements();

  if (!ent.loading && !ent.features.whatsapp) {
    return <UpgradeGate icon="📨" title="Envios em Lote" message={FEATURE_UPGRADE_MESSAGES.whatsapp} ctaPlan="Standard" />;
  }

  const [view, setView] = useState<ViewMode>('list');
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<BroadcastDetail | null>(null);

  // Create broadcast form
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [recipientInput, setRecipientInput] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Custom templates management
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tmplForm, setTmplForm] = useState({
    name: '', category: 'UTILITY', language: 'pt_BR',
    bodyText: '', header: '', footer: '',
  });
  const [tmplExamples, setTmplExamples] = useState<string[]>([]);
  const [tmplSaving, setTmplSaving] = useState(false);
  const [tmplError, setTmplError] = useState('');
  const [tmplSuccess, setTmplSuccess] = useState('');

  // Auto-refresh pending templates every 30s
  useEffect(() => {
    if (view !== 'templates') return;
    const hasPending = customTemplates.some(t => t.status === 'PENDING');
    if (!hasPending) return;
    const interval = setInterval(() => loadCustomTemplates(), 30000);
    return () => clearInterval(interval);
  }, [view, customTemplates]);

  const loadBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/broadcasts', { headers: authHeaders(token) });
      if (res.ok) setBroadcasts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/templates', { headers: authHeaders(token) });
      if (res.ok) {
        const data: Template[] = await res.json();
        setTemplates(data.filter(t => t.status === 'APPROVED'));
      }
    } catch {}
  }, [token]);

  const loadCustomTemplates = useCallback(async () => {
    setCustomLoading(true);
    try {
      const res = await fetch('/api/whatsapp/templates/custom', { headers: authHeaders(token) });
      if (res.ok) setCustomTemplates(await res.json());
    } finally {
      setCustomLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) loadBroadcasts(); }, [token, loadBroadcasts]);

  // ── Infer example var slots from body ────────────────────────────────────────

  const bodyPlaceholders = useMemo(() => {
    const matches = [...new Set((tmplForm.bodyText.match(/\{\{\d+\}\}/g) || []))];
    return matches.sort();
  }, [tmplForm.bodyText]);

  useEffect(() => {
    setTmplExamples(prev => {
      const next = [...prev];
      while (next.length < bodyPlaceholders.length) next.push('');
      return next.slice(0, bodyPlaceholders.length);
    });
  }, [bodyPlaceholders.length]);

  // ── Parsing de destinatários ─────────────────────────────────────────────────

  const parsedRecipients = useMemo(() => {
    if (!recipientInput.trim()) return [];
    return recipientInput
      .split(/[\n,;]+/)
      .map(line => {
        const parts = line.trim().split(/\s*[-|:]\s*/);
        const phone = parts[0]?.replace(/\D/g, '') || '';
        const name = parts[1]?.trim() || undefined;
        return { phone, customerName: name };
      })
      .filter(r => r.phone.length >= 10);
  }, [recipientInput]);

  // ── Criar Broadcast ──────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!selectedTemplate || parsedRecipients.length === 0) return;
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);
    try {
      let scheduledAt: string | null = null;
      if (scheduleDate && scheduleTime) {
        scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
      }
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          templateName: selectedTemplate.name,
          templateLang: selectedTemplate.language,
          recipients: parsedRecipients,
          scheduledAt,
          source: 'manual',
          idempotencyKey: `manual_${Date.now()}_${selectedTemplate.name}`,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro ao criar envio'); }
      setSubmitSuccess(true);
      setRecipientInput('');
      setSelectedTemplate(null);
      setScheduleDate('');
      setScheduleTime('');
      setTimeout(() => { setView('list'); setSubmitSuccess(false); loadBroadcasts(); }, 1500);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancelar Broadcast ───────────────────────────────────────────────────────

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/broadcasts/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      loadBroadcasts();
    } catch {}
  };

  // ── Ver Detalhes ─────────────────────────────────────────────────────────────

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/broadcasts/${id}`, { headers: authHeaders(token) });
      if (res.ok) { setDetail(await res.json()); setView('detail'); }
    } catch {}
  };

  // ── Criar Custom Template ────────────────────────────────────────────────────

  const handleSaveTemplate = async () => {
    setTmplError('');
    setTmplSuccess('');
    if (!tmplForm.name || !tmplForm.bodyText) {
      setTmplError('Nome e corpo são obrigatórios');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(tmplForm.name)) {
      setTmplError('Nome deve conter apenas letras minúsculas, números e underscore');
      return;
    }
    if (bodyPlaceholders.length > 0 && tmplExamples.some(e => !e.trim())) {
      setTmplError('Preencha todos os exemplos de variáveis');
      return;
    }
    setTmplSaving(true);
    try {
      const res = await fetch('/api/whatsapp/templates/custom', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          name: tmplForm.name,
          category: tmplForm.category,
          language: tmplForm.language,
          bodyText: tmplForm.bodyText,
          header: tmplForm.header || undefined,
          footer: tmplForm.footer || undefined,
          exampleVars: tmplExamples,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar template');

      const msg = data.submissionWarning
        ? `Template salvo! Aviso: ${data.submissionWarning}`
        : data.status === 'PENDING'
          ? 'Template enviado para aprovação da Meta. Aguarde alguns minutos.'
          : 'Template salvo.';

      setTmplSuccess(msg);
      setTmplForm({ name: '', category: 'UTILITY', language: 'pt_BR', bodyText: '', header: '', footer: '' });
      setTmplExamples([]);
      setShowCreateForm(false);
      loadCustomTemplates();
    } catch (e: any) {
      setTmplError(e.message);
    } finally {
      setTmplSaving(false);
    }
  };

  // ── Re-submit template ───────────────────────────────────────────────────────

  const handleResubmit = async (id: string) => {
    try {
      const res = await fetch(`/api/whatsapp/templates/custom/${id}/submit`, {
        method: 'POST', headers: authHeaders(token),
      });
      const data = await res.json();
      if (!res.ok) { setTmplError(data.error || 'Erro ao reenviar'); return; }
      setTmplSuccess('Template reenviado para aprovação da Meta.');
      loadCustomTemplates();
    } catch (e: any) {
      setTmplError(e.message);
    }
  };

  // ── Delete custom template ───────────────────────────────────────────────────

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Excluir template "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await fetch(`/api/whatsapp/templates/custom/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      loadCustomTemplates();
    } catch {}
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Envios em Lote
          </h1>
          <p className="text-gray-400 mt-2">Agende e envie templates WhatsApp para múltiplos contatos.</p>
        </div>
        <div className="flex items-center gap-3">
          {view === 'list' && (
            <>
              <button
                onClick={() => { setView('templates'); loadCustomTemplates(); }}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
              >
                📝 Meus Templates
              </button>
              <button
                onClick={() => { setView('create'); loadTemplates(); }}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20 transition-all"
              >
                + Novo Envio
              </button>
            </>
          )}
          {view !== 'list' && (
            <button onClick={() => { setView('list'); setShowCreateForm(false); setTmplError(''); setTmplSuccess(''); }} className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Voltar
            </button>
          )}
        </div>
      </div>

      {/* ═══ LIST VIEW ═══ */}
      {view === 'list' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-3 text-gray-400">Carregando...</span>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📨</div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Nenhum envio em lote ainda</h3>
              <p className="text-sm text-gray-500 mb-6">Crie seu primeiro envio usando um template aprovado.</p>
              <button
                onClick={() => { setView('create'); loadTemplates(); }}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              >
                + Criar Envio
              </button>
            </div>
          ) : (
            broadcasts.map(b => {
              const s = STATUS_MAP[b.status] || { label: b.status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
              return (
                <div key={b.id} className="bg-[#121212] rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{b.templateName}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleViewDetail(b.id)} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Detalhes</button>
                      {['draft', 'scheduled'].includes(b.status) && (
                        <button onClick={() => handleCancel(b.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Cancelar</button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-gray-500">
                    <span>👥 {b.totalRecipients} destinatário{b.totalRecipients !== 1 ? 's' : ''}</span>
                    <span>✅ {b.sentCount} enviado{b.sentCount !== 1 ? 's' : ''}</span>
                    {b.failedCount > 0 && <span className="text-red-400">❌ {b.failedCount} falha{b.failedCount !== 1 ? 's' : ''}</span>}
                    {b.scheduledAt && <span>🕐 {new Date(b.scheduledAt).toLocaleString('pt-BR')}</span>}
                    <span>📅 {new Date(b.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ TEMPLATES VIEW ═══ */}
      {view === 'templates' && (
        <div className="max-w-3xl space-y-5">
          {/* Info box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300 space-y-1">
            <p className="font-semibold">Como funciona</p>
            <p className="text-xs text-blue-400">Templates são enviados automaticamente para aprovação da Meta ao serem criados. Templates <span className="text-emerald-400 font-medium">UTILITY</span> são aprovados em segundos. Após aprovação, ficam disponíveis automaticamente para novos envios.</p>
          </div>

          {(tmplSuccess || tmplError) && (
            <div className={`rounded-xl p-3 text-sm ${tmplSuccess ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {tmplSuccess || tmplError}
            </div>
          )}

          {/* Create form toggle */}
          {!showCreateForm ? (
            <button
              onClick={() => { setShowCreateForm(true); setTmplError(''); setTmplSuccess(''); }}
              className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:border-blue-500/40 hover:text-blue-400 transition-all text-sm font-medium"
            >
              + Criar Novo Template
            </button>
          ) : (
            <div className="bg-[#121212] rounded-2xl border border-white/10 p-6 space-y-4">
              <h3 className="font-semibold text-white">Novo Template</h3>

              {/* Category selector */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">Categoria</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setTmplForm(f => ({ ...f, category: cat.value }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tmplForm.category === cat.value
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/5 bg-[#1a1a1a] hover:border-white/10'
                      }`}
                    >
                      <p className="text-xs font-bold text-white">{cat.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + language */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nome do template *</label>
                  <input
                    value={tmplForm.name}
                    onChange={e => setTmplForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                    placeholder="meu_template"
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">Apenas minúsculas, números e _</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Idioma</label>
                  <select
                    value={tmplForm.language}
                    onChange={e => setTmplForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="pt_BR">Português (BR)</option>
                    <option value="en_US">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>

              {/* Header (optional) */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cabeçalho <span className="text-gray-600">(opcional)</span></label>
                <input
                  value={tmplForm.header}
                  onChange={e => setTmplForm(f => ({ ...f, header: e.target.value }))}
                  placeholder="Ex: Confirmação de Pedido"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Corpo da mensagem *
                  <span className="text-gray-600 ml-2">Use {`{{1}}`}, {`{{2}}`}... para variáveis</span>
                </label>
                <textarea
                  rows={4}
                  value={tmplForm.bodyText}
                  onChange={e => setTmplForm(f => ({ ...f, bodyText: e.target.value }))}
                  placeholder={`Olá {{1}}, seu pedido {{2}} foi confirmado!`}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>

              {/* Example vars — shown dynamically */}
              {bodyPlaceholders.length > 0 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Exemplos das variáveis <span className="text-yellow-400">*</span>
                    <span className="text-gray-600 ml-1">(obrigatório pela Meta para aprovação)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {bodyPlaceholders.map((ph, i) => (
                      <div key={ph}>
                        <label className="block text-[10px] text-gray-500 mb-1">{ph}</label>
                        <input
                          value={tmplExamples[i] ?? ''}
                          onChange={e => setTmplExamples(prev => { const next = [...prev]; next[i] = e.target.value; return next; })}
                          placeholder={`Exemplo para ${ph}`}
                          className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer (optional) */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rodapé <span className="text-gray-600">(opcional)</span></label>
                <input
                  value={tmplForm.footer}
                  onChange={e => setTmplForm(f => ({ ...f, footer: e.target.value }))}
                  placeholder="Ex: Responda AJUDA para suporte"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {tmplError && (
                <p className="text-sm text-red-400">{tmplError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setTmplError(''); }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={tmplSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition-all"
                >
                  {tmplSaving ? 'Salvando e enviando para Meta...' : '🚀 Salvar e Enviar para Aprovação'}
                </button>
              </div>
            </div>
          )}

          {/* Templates list */}
          {customLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : customTemplates.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">Nenhum template criado ainda.</p>
          ) : (
            <div className="space-y-3">
              {customTemplates.map(t => {
                const ts = TMPL_STATUS[t.status] || TMPL_STATUS.DRAFT;
                return (
                  <div key={t.id} className="bg-[#121212] rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white font-mono text-sm">{t.name}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${ts.color}`}>
                            {ts.label}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase">{t.category} · {t.language}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{t.body}</p>
                        {t.status === 'REJECTED' && t.rejectedReason && (
                          <p className="text-xs text-red-400 mt-1.5 bg-red-500/10 rounded-lg px-2 py-1">
                            Motivo: {t.rejectedReason}
                          </p>
                        )}
                        {t.status === 'PENDING' && (
                          <p className="text-[10px] text-yellow-400/70 mt-1.5">
                            Aguardando revisão da Meta. Atualizando automaticamente...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {(t.status === 'DRAFT' || t.status === 'REJECTED') && (
                          <button
                            onClick={() => handleResubmit(t.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
                          >
                            Reenviar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTemplate(t.id, t.name)}
                          className="text-xs text-red-400/70 hover:text-red-400 font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ CREATE VIEW ═══ */}
      {view === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {/* Template Selection */}
          <div className="space-y-6">
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">📝 Template</h3>
                <button
                  onClick={() => { setView('templates'); loadCustomTemplates(); }}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  + Criar template
                </button>
              </div>
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500">Carregando templates aprovados...</p>
              ) : (
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {templates.map(t => (
                    <button
                      key={`${t.name}-${t.language}`}
                      onClick={() => setSelectedTemplate(t)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                        selectedTemplate?.name === t.name
                          ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20'
                          : 'bg-[#1a1a1a] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.isCustom && <span className="text-[9px] text-blue-400 border border-blue-500/30 px-1 rounded">meu template</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{t.body}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destinatários */}
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">👥 Destinatários</h3>
              <p className="text-xs text-gray-500 mb-3">Um por linha. Formato: <code className="text-gray-400">5511999999999</code> ou <code className="text-gray-400">5511999999999 - Nome</code></p>
              <textarea
                rows={6}
                value={recipientInput}
                onChange={e => setRecipientInput(e.target.value)}
                placeholder={'5511999999999 - João\n5521988888888 - Maria\n5531977777777'}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {parsedRecipients.length > 0
                  ? <span className="text-emerald-400">✓ {parsedRecipients.length} contato{parsedRecipients.length !== 1 ? 's' : ''} válido{parsedRecipients.length !== 1 ? 's' : ''}</span>
                  : 'Nenhum contato válido ainda'}
              </p>
            </div>
          </div>

          {/* Agendamento + Preview */}
          <div className="space-y-6">
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">🕐 Agendamento</h3>
              <p className="text-xs text-gray-500 mb-3">Deixe em branco para agendar imediatamente.</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {selectedTemplate && (
              <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">📱 Resumo do Envio</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Template:</span><span className="text-white font-medium">{selectedTemplate.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Idioma:</span><span className="text-gray-300">{selectedTemplate.language}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Variáveis:</span><span className="text-gray-300">{selectedTemplate.placeholders.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Destinatários:</span><span className="text-emerald-400 font-bold">{parsedRecipients.length}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quando:</span>
                    <span className="text-gray-300">{scheduleDate && scheduleTime ? `${scheduleDate} às ${scheduleTime}` : 'Imediatamente'}</span>
                  </div>
                </div>
                <div className="mt-4 bg-[#0b141a] rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-gray-400 mb-1">Preview:</p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{selectedTemplate.body}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={!selectedTemplate || parsedRecipients.length === 0 || submitting}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                submitting ? 'bg-gray-700 text-gray-400 cursor-wait'
                  : !selectedTemplate || parsedRecipients.length === 0
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20'
              }`}
            >
              {submitting ? 'Criando...' : scheduleDate ? '🕐 Agendar Envio' : '📨 Enviar Agora'}
            </button>

            {submitSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-400 font-medium">✅ Envio criado com sucesso!</p>
              </div>
            )}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 font-medium">❌ {submitError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DETAIL VIEW ═══ */}
      {view === 'detail' && detail && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{detail.templateName}</h2>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${(STATUS_MAP[detail.status] || STATUS_MAP.draft).color}`}>
                {(STATUS_MAP[detail.status] || { label: detail.status }).label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total',    value: detail.totalRecipients,                                          color: 'text-blue-400' },
                { label: 'Enviados', value: detail.sentCount,                                                color: 'text-emerald-400' },
                { label: 'Falhas',   value: detail.failedCount,                                              color: 'text-red-400' },
                { label: 'Pendentes',value: detail.totalRecipients - detail.sentCount - detail.failedCount,  color: 'text-gray-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#1a1a1a] rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121212] rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1a1a1a] border-b border-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold uppercase">Telefone</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold uppercase">Enviado em</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold uppercase">Erro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {detail.recipients.map(r => {
                    const rs = RCPT_STATUS[r.status] || { label: r.status, color: 'text-gray-400' };
                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-gray-300">{r.phone}</td>
                        <td className="px-4 py-3 text-gray-400">{r.customerName || '—'}</td>
                        <td className={`px-4 py-3 font-medium ${rs.color}`}>{rs.label}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.sentAt ? new Date(r.sentAt).toLocaleString('pt-BR') : '—'}</td>
                        <td className="px-4 py-3 text-red-400/70 text-xs max-w-[200px] truncate">{r.errorMessage || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
