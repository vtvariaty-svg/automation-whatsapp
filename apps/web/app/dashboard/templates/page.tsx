'use client';

import { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useEntitlements } from '@/hooks/useEntitlements';
import { FEATURE_UPGRADE_MESSAGES } from '@/lib/config/plans';
import UpgradeGate from '@/components/UpgradeGate';

interface Template {
  name: string;
  category: string;
  language: string;
  status: string;
  body: string;
  header?: string;
  footer?: string;
  buttons?: string[];
  placeholders: string[];
  placeholderLabels?: string[];
}

type SendStatus = 'idle' | 'loading' | 'success' | 'error';

// ── Helpers de Tradução ────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Aprovado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PENDING: { label: 'Em Análise', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  PAUSED: { label: 'Pausado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  DISABLED: { label: 'Desativado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  IN_APPEAL: { label: 'Em Recurso', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  UTILITY: { label: 'Utilitário', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  MARKETING: { label: 'Marketing', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  AUTHENTICATION: { label: 'Autenticação', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
}

function getCategoryInfo(cat: string) {
  return CATEGORY_MAP[cat] || { label: cat, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
}

export default function TemplatesPage() {
  const authContext = useContext(AuthContext);
  const token = authContext?.token;
  const ent = useEntitlements();

  if (!ent.loading && !ent.features.whatsapp) {
    return <UpgradeGate icon="📋" title="Templates WhatsApp" message={FEATURE_UPGRADE_MESSAGES.whatsapp} ctaPlan="Standard" />;
  }

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Envio
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [recipient, setRecipient] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [sendResult, setSendResult] = useState<{ messageId?: string; error?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchTemplates();
  }, [token]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/whatsapp/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao carregar templates');
      }
      const data: Template[] = await res.json();
      setTemplates(data);
    } catch (e: any) {
      setFetchError(e.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // ── Filtros computados ──────────────────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.body.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [templates, filterStatus, filterCategory, searchQuery]);

  const uniqueStatuses = useMemo(() => [...new Set(templates.map(t => t.status))], [templates]);
  const uniqueCategories = useMemo(() => [...new Set(templates.map(t => t.category))], [templates]);

  // ── Seleção e envio ─────────────────────────────────────────────────────────

  const handleSelectTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl);
    setVariables(tpl.placeholders.map(() => ''));
    setSendStatus('idle');
    setSendResult(null);
  };

  const getPreviewText = () => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.body;
    selectedTemplate.placeholders.forEach((ph, i) => {
      text = text.replace(ph, variables[i] || `[${selectedTemplate.placeholderLabels?.[i] || `Variável ${i + 1}`}]`);
    });
    return text;
  };

  const allVariablesFilled = selectedTemplate
    ? selectedTemplate.placeholders.length === 0 || variables.every(v => v.trim().length > 0)
    : false;

  const canSend = selectedTemplate && recipient.trim().length >= 10 && allVariablesFilled && selectedTemplate.status === 'APPROVED';

  const handleSend = async () => {
    if (!canSend) return;

    setSendStatus('loading');
    setSendResult(null);

    try {
      const res = await fetch('/api/whatsapp/templates/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          to: recipient.replace(/\D/g, ''),
          templateName: selectedTemplate!.name,
          language: selectedTemplate!.language,
          variables: variables.filter(v => v.length > 0),
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar template');
      }

      setSendStatus('success');
      setSendResult({ messageId: data.messageId });
    } catch (e: any) {
      setSendStatus('error');
      setSendResult({ error: e.message });
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
          Templates WhatsApp
        </h1>
        <p className="text-gray-400 mt-2">
          Gerencie, visualize e envie seus templates de mensagem do WhatsApp Business.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou conteúdo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="all">Todos os Status</option>
          {uniqueStatuses.map(s => (
            <option key={s} value={s}>{getStatusInfo(s).label}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="all">Todas as Categorias</option>
          {uniqueCategories.map(c => (
            <option key={c} value={c}>{getCategoryInfo(c).label}</option>
          ))}
        </select>
      </div>

      {/* Contador */}
      {!loadingTemplates && !fetchError && (
        <p className="text-xs text-gray-500 mb-4">
          {filteredTemplates.length} de {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUNA ESQUERDA — Seleção de Template */}
        <div className="space-y-6">
          {/* Destinatário */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              📱 Número do Destinatário
            </label>
            <input
              type="text"
              placeholder="Ex: 5511999999999"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
            <p className="text-xs text-gray-500 mt-1.5">Formato internacional sem o sinal de +</p>
          </div>

          {/* Lista de Templates */}
          <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              📝 Selecionar Template
            </label>

            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <span className="ml-3 text-sm text-gray-400">Carregando templates...</span>
              </div>
            ) : fetchError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm font-medium mb-1">❌ Erro ao carregar templates</p>
                <p className="text-red-400/70 text-xs">{fetchError}</p>
                <button onClick={fetchTemplates} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                  🔄 Tentar novamente
                </button>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-400 text-sm font-medium">Nenhum template encontrado</p>
                <p className="text-gray-500 text-xs mt-1">
                  {templates.length > 0
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Crie templates no Meta Business Manager e eles aparecerão aqui.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredTemplates.map((tpl) => {
                  const statusInfo = getStatusInfo(tpl.status);
                  const catInfo = getCategoryInfo(tpl.category);
                  const isSelected = selectedTemplate?.name === tpl.name && selectedTemplate?.language === tpl.language;

                  return (
                    <button
                      key={`${tpl.name}-${tpl.language}`}
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                          : 'bg-[#1a1a1a] border-white/5 hover:border-white/10 hover:bg-[#1e1e1e]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-sm">{tpl.name}</span>
                        <div className="flex gap-1.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                            {catInfo.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{tpl.body || 'Sem corpo de texto'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-gray-600">🌐 {tpl.language}</p>
                        {tpl.placeholders.length > 0 && (
                          <p className="text-[10px] text-gray-600">🔤 {tpl.placeholders.length} variáve{tpl.placeholders.length > 1 ? 'is' : 'l'}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA — Preview & Envio */}
        <div className="space-y-6">
          {selectedTemplate ? (
            <>
              {/* Info do Template */}
              <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">{selectedTemplate.name}</h2>
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${getStatusInfo(selectedTemplate.status).color}`}>
                      {getStatusInfo(selectedTemplate.status).label}
                    </span>
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${getCategoryInfo(selectedTemplate.category).color}`}>
                      {getCategoryInfo(selectedTemplate.category).label}
                    </span>
                  </div>
                </div>

                {/* Preview estilo balão WhatsApp */}
                <div className="bg-[#0b141a] rounded-xl p-4 mb-4 border border-white/5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">📱 Pré-visualização</p>
                  <div className="flex justify-end">
                    <div className="bg-[#005c4b] rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%] shadow-lg">
                      {selectedTemplate.header && (
                        <p className="text-sm font-bold text-white mb-1">{selectedTemplate.header}</p>
                      )}
                      <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">
                        {getPreviewText()}
                      </p>
                      {selectedTemplate.footer && (
                        <p className="text-xs text-gray-400 mt-2">{selectedTemplate.footer}</p>
                      )}
                      <p className="text-[10px] text-gray-400/60 text-right mt-1">
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </p>
                    </div>
                  </div>
                  {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                    <div className="flex justify-end mt-2">
                      <div className="flex flex-col gap-1 max-w-[85%] w-full">
                        {selectedTemplate.buttons.map((btn, i) => (
                          <div key={i} className="bg-[#1a2d3a] text-center text-sky-400 text-sm py-2 rounded-lg border border-white/5">
                            {btn}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-gray-500">
                  <span>🌐 Idioma: <span className="text-gray-400">{selectedTemplate.language}</span></span>
                  <span>🔤 Variáveis: <span className="text-gray-400">{selectedTemplate.placeholders.length}</span></span>
                </div>

                {selectedTemplate.status !== 'APPROVED' && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-xs text-amber-400">
                      ⚠️ Este template não está aprovado. Apenas templates com status &quot;Aprovado&quot; podem ser enviados.
                    </p>
                  </div>
                )}
              </div>

              {/* Variáveis */}
              {selectedTemplate.placeholders.length > 0 && (
                <div className="bg-[#121212] rounded-2xl border border-white/5 p-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4">🔤 Variáveis do Template</h3>
                  <div className="space-y-3">
                    {selectedTemplate.placeholders.map((ph, index) => {
                      const isFilled = variables[index]?.trim().length > 0;
                      return (
                        <div key={ph}>
                          <label className="block text-xs text-gray-500 mb-1">
                            {selectedTemplate.placeholderLabels?.[index] || `Variável ${index + 1}`}{' '}
                            <span className="text-gray-600">({ph})</span>
                            {!isFilled && <span className="text-red-400 ml-1">*</span>}
                          </label>
                          <input
                            type="text"
                            placeholder={`Preencha ${selectedTemplate.placeholderLabels?.[index] || `a variável ${index + 1}`}`}
                            value={variables[index] || ''}
                            onChange={(e) => {
                              const newVars = [...variables];
                              newVars[index] = e.target.value;
                              setVariables(newVars);
                            }}
                            className={`w-full bg-[#1a1a1a] border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              isFilled
                                ? 'border-emerald-500/30 focus:ring-emerald-500/50'
                                : 'border-white/10 focus:ring-amber-500/50'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {!allVariablesFilled && (
                    <p className="text-xs text-amber-400 mt-3">⚠️ Preencha todas as variáveis antes de enviar.</p>
                  )}
                </div>
              )}

              {/* Botão de Envio */}
              <button
                onClick={handleSend}
                disabled={!canSend || sendStatus === 'loading'}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                  sendStatus === 'loading'
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : !canSend
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                }`}
              >
                {sendStatus === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </span>
                ) : (
                  '📨 Enviar Template'
                )}
              </button>

              {/* Feedback de Sucesso */}
              {sendStatus === 'success' && sendResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-400 text-lg">✅</span>
                    <span className="font-bold text-emerald-400">Template enviado com sucesso!</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Status: <span className="text-emerald-300 font-medium">Aceito pela Meta</span>
                  </p>
                  {sendResult.messageId && (
                    <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                      ID da Mensagem: {sendResult.messageId}
                    </p>
                  )}
                </div>
              )}

              {/* Feedback de Erro */}
              {sendStatus === 'error' && sendResult && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-400 text-lg">❌</span>
                    <span className="font-bold text-red-400">Falha no envio</span>
                  </div>
                  <p className="text-sm text-red-300">{sendResult.error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#121212] rounded-2xl border border-white/5 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Nenhum Template Selecionado</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Selecione um template da lista ao lado para visualizar o conteúdo e enviar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
