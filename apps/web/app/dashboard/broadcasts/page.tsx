'use client';

import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { FEATURE_UPGRADE_MESSAGES } from '@/lib/config/plans';
import UpgradeGate from '@/components/UpgradeGate';

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
}

type ViewMode = 'list' | 'create' | 'detail';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  scheduled: { label: 'Agendado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  processing: { label: 'Processando', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  completed: { label: 'Concluído', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  partially_failed: { label: 'Parcial', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  failed: { label: 'Falhou', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const RCPT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'text-gray-400' },
  sent: { label: 'Enviado', color: 'text-emerald-400' },
  failed: { label: 'Falhou', color: 'text-red-400' },
  skipped: { label: 'Ignorado', color: 'text-gray-500' },
};

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

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

  // Create form
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [recipientInput, setRecipientInput] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  useEffect(() => {
    if (token) loadBroadcasts();
  }, [token, loadBroadcasts]);

  // ── Parsing de destinatários ────────────────────────────────────────────────

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

  // ── Criar Broadcast ─────────────────────────────────────────────────────────

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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar envio');
      }

      setSubmitSuccess(true);
      setRecipientInput('');
      setSelectedTemplate(null);
      setScheduleDate('');
      setScheduleTime('');
      setTimeout(() => {
        setView('list');
        setSubmitSuccess(false);
        loadBroadcasts();
      }, 1500);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cancelar ────────────────────────────────────────────────────────────────

  const handleCancel = async (id: string) => {
    try {
      await fetch(`/api/broadcasts/${id}`, { method: 'DELETE', headers: authHeaders(token) });
      loadBroadcasts();
    } catch {}
  };

  // ── Ver Detalhes ────────────────────────────────────────────────────────────

  const handleViewDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/broadcasts/${id}`, { headers: authHeaders(token) });
      if (res.ok) {
        setDetail(await res.json());
        setView('detail');
      }
    } catch {}
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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
        {view === 'list' && (
          <button
            onClick={() => { setView('create'); loadTemplates(); }}
            className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/20 transition-all"
          >
            + Novo Envio
          </button>
        )}
        {view !== 'list' && (
          <button onClick={() => setView('list')} className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Voltar
          </button>
        )}
      </div>

      {/* ═══ LIST VIEW ═══ */}
      {view === 'list' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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

      {/* ═══ CREATE VIEW ═══ */}
      {view === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {/* Template Selection */}
          <div className="space-y-6">
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">📝 Template</h3>
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
                      <span className="font-medium">{t.name}</span>
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
            {/* Agendamento */}
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

            {/* Preview */}
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

            {/* Botão de Criar */}
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
          {/* Header */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{detail.templateName}</h2>
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${(STATUS_MAP[detail.status] || STATUS_MAP.draft).color}`}>
                {(STATUS_MAP[detail.status] || { label: detail.status }).label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: detail.totalRecipients, color: 'text-blue-400' },
                { label: 'Enviados', value: detail.sentCount, color: 'text-emerald-400' },
                { label: 'Falhas', value: detail.failedCount, color: 'text-red-400' },
                { label: 'Pendentes', value: detail.totalRecipients - detail.sentCount - detail.failedCount, color: 'text-gray-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#1a1a1a] rounded-xl p-3">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recipients Table */}
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
