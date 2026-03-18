'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useEntitlements } from '@/hooks/useEntitlements';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstagramCommentRule {
  id: string;
  name: string;
  scope: string;
  postId?: string | null;
  triggerType: string;
  triggerValue: string;
  matchType: string;
  actions: unknown;
  active: boolean;
  createdAt: string;
}

interface InstagramModerationItem {
  id: string;
  commentId: string;
  postId: string;
  from: string;
  fromUsername?: string | null;
  text: string;
  status: string;
  ruleTriggeredId?: string | null;
  createdAt: string;
}

type Tab = 'rules' | 'moderation';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization:
    'Bearer ' +
    (localStorage.getItem('auth_token') ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? ''),
});

// ─── Default form state ───────────────────────────────────────────────────────

const defaultForm = {
  name: '',
  scope: 'global' as 'global' | 'post',
  postId: '',
  triggerType: 'keyword' as 'keyword' | 'contains' | 'ai_intent',
  triggerValue: '',
  matchType: 'contains' as 'exact' | 'contains',
  actionsRaw: '[\n  {"type": "reply_comment", "text": "Obrigado pelo comentário!"}\n]',
  active: true,
};

type FormState = typeof defaultForm;

// ─── Helper: action badge color ───────────────────────────────────────────────

function actionBadgeColor(type: string): string {
  switch (type) {
    case 'reply_comment':
      return 'bg-blue-100 text-blue-700';
    case 'send_dm':
      return 'bg-purple-100 text-purple-700';
    case 'hide_comment':
      return 'bg-red-100 text-red-700';
    case 'enroll_sequence':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// ─── Helper: status badge color ───────────────────────────────────────────────

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'replied':
      return 'bg-blue-100 text-blue-700';
    case 'hidden':
      return 'bg-red-100 text-red-600';
    case 'dismissed':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// ─── Helper: parse actions safely ────────────────────────────────────────────

function parseActions(actions: unknown): { type: string }[] {
  try {
    const arr = Array.isArray(actions) ? actions : JSON.parse(actions as string);
    if (Array.isArray(arr)) return arr as { type: string }[];
  } catch {
    // ignore
  }
  return [];
}

// ─── Helper: format date ─────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const base =
    'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all';
  const color =
    toast.type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white';

  return (
    <div className={`${base} ${color}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} className="ml-2 text-white/70 hover:text-white">
        ✕
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  editingRule: InstagramCommentRule | null;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

function RuleModal({ editingRule, onClose, onSaved, showToast }: ModalProps) {
  const [form, setForm] = useState<FormState>(() => {
    if (editingRule) {
      return {
        name: editingRule.name,
        scope: editingRule.scope as 'global' | 'post',
        postId: editingRule.postId ?? '',
        triggerType: editingRule.triggerType as FormState['triggerType'],
        triggerValue: editingRule.triggerValue,
        matchType: editingRule.matchType as 'exact' | 'contains',
        actionsRaw: JSON.stringify(editingRule.actions, null, 2),
        active: editingRule.active,
      };
    }
    return { ...defaultForm };
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return; }
    if (!form.triggerValue.trim()) { setFormError('Valor do gatilho é obrigatório.'); return; }

    let parsedActions: unknown;
    try {
      parsedActions = JSON.parse(form.actionsRaw);
      if (!Array.isArray(parsedActions)) throw new Error();
    } catch {
      setFormError('O campo "Actions" deve ser um JSON array válido.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      scope: form.scope,
      postId: form.scope === 'post' ? form.postId.trim() || undefined : undefined,
      triggerType: form.triggerType,
      triggerValue: form.triggerValue.trim(),
      matchType: form.triggerType !== 'ai_intent' ? form.matchType : undefined,
      actions: parsedActions,
      active: form.active,
    };

    setSaving(true);
    try {
      const url = editingRule
        ? `/api/instagram/comment-rules/${editingRule.id}`
        : '/api/instagram/comment-rules';
      const method = editingRule ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Erro ao salvar regra.');
      }
      showToast(
        editingRule ? 'Regra atualizada com sucesso!' : 'Regra criada com sucesso!',
        'success',
      );
      onSaved();
      onClose();
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const actionsExample = `[
  {"type": "reply_comment", "text": "Olá! Obrigado."},
  {"type": "send_dm", "text": "Enviamos mais detalhes no privado!"},
  {"type": "hide_comment"},
  {"type": "enroll_sequence", "sequenceId": "seq-id-aqui"}
]`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {editingRule ? 'Editar Regra' : 'Nova Regra'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Modal body */}
        <form
          id="rule-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ex: Responder dúvidas sobre preço"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Escopo
            </label>
            <select
              value={form.scope}
              onChange={(e) => set('scope', e.target.value as 'global' | 'post')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="global">Global (todos os posts)</option>
              <option value="post">Post específico</option>
            </select>
          </div>

          {/* Post ID (conditional) */}
          {form.scope === 'post' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID do Post
              </label>
              <input
                type="text"
                value={form.postId}
                onChange={(e) => set('postId', e.target.value)}
                placeholder="Ex: 17891234567890123"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          )}

          {/* Trigger type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de gatilho
            </label>
            <select
              value={form.triggerType}
              onChange={(e) => set('triggerType', e.target.value as FormState['triggerType'])}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="keyword">Palavra-chave</option>
              <option value="contains">Contém texto</option>
              <option value="ai_intent">Intenção por IA</option>
            </select>
          </div>

          {/* Trigger value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor do gatilho <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.triggerValue}
              onChange={(e) => set('triggerValue', e.target.value)}
              placeholder={
                form.triggerType === 'ai_intent'
                  ? 'Ex: interesse em comprar'
                  : 'Ex: preço, valor, quanto custa'
              }
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Match type (only for keyword/contains) */}
          {form.triggerType !== 'ai_intent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de correspondência
              </label>
              <select
                value={form.matchType}
                onChange={(e) => set('matchType', e.target.value as 'exact' | 'contains')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="contains">Contém (parcial)</option>
                <option value="exact">Exato (igual)</option>
              </select>
            </div>
          )}

          {/* Actions JSON */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actions <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.actionsRaw}
              onChange={(e) => set('actionsRaw', e.target.value)}
              rows={6}
              spellCheck={false}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
            />
            <details className="mt-1">
              <summary className="text-xs text-indigo-500 cursor-pointer hover:text-indigo-700 select-none">
                Exemplo de actions
              </summary>
              <pre className="mt-1 text-xs bg-gray-50 rounded-lg p-3 text-gray-500 overflow-x-auto whitespace-pre-wrap border border-gray-100">
                {actionsExample}
              </pre>
            </details>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Regra ativa</span>
            <button
              type="button"
              onClick={() => set('active', !form.active)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-indigo-600' : 'bg-gray-200'}`}
              aria-pressed={form.active}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Form-level error */}
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}
        </form>

        {/* Modal footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="rule-form"
            disabled={saving}
            className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {saving ? 'Salvando…' : editingRule ? 'Salvar alterações' : 'Criar regra'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InstagramCommentsPage() {
  const ent = useEntitlements();
  const [activeTab, setActiveTab] = useState<Tab>('rules');

  // Rules state
  const [rules, setRules] = useState<InstagramCommentRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');

  // Moderation state
  const [modItems, setModItems] = useState<InstagramModerationItem[]>([]);
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState('');
  const [modStatus, setModStatus] = useState('pending');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<InstagramCommentRule | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // ─── Fetch rules ────────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    setRulesLoading(true);
    setRulesError('');
    try {
      const res = await fetch('/api/instagram/comment-rules', {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao carregar regras.');
      const data = await res.json();
      setRules(data);
    } catch (err) {
      setRulesError((err as Error).message);
    } finally {
      setRulesLoading(false);
    }
  }, []);

  // ─── Fetch moderation items ─────────────────────────────────────────────────

  const fetchModItems = useCallback(async (status: string) => {
    setModLoading(true);
    setModError('');
    try {
      const res = await fetch(`/api/instagram/moderation-queue?status=${status}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao carregar fila de moderação.');
      const data = await res.json();
      setModItems(data);
    } catch (err) {
      setModError((err as Error).message);
    } finally {
      setModLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (activeTab === 'moderation') {
      fetchModItems(modStatus);
    }
  }, [activeTab, modStatus, fetchModItems]);

  // ─── Delete rule ────────────────────────────────────────────────────────────

  async function handleDeleteRule(rule: InstagramCommentRule) {
    if (!window.confirm(`Deseja excluir a regra "${rule.name}"?`)) return;
    try {
      const res = await fetch(`/api/instagram/comment-rules/${rule.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao excluir regra.');
      showToast('Regra excluída.', 'success');
      fetchRules();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  }

  // ─── Toggle rule active ─────────────────────────────────────────────────────

  async function handleToggleActive(rule: InstagramCommentRule) {
    try {
      const res = await fetch(`/api/instagram/comment-rules/${rule.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ active: !rule.active }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar regra.');
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r)),
      );
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  }

  // ─── Open modal ─────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingRule(null);
    setModalOpen(true);
  }

  function openEdit(rule: InstagramCommentRule) {
    setEditingRule(rule);
    setModalOpen(true);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string }[] = [
    { id: 'rules', label: 'Regras' },
    { id: 'moderation', label: 'Fila de Moderação' },
  ];

  const modStatusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'replied', label: 'Respondido' },
    { value: 'hidden', label: 'Oculto' },
    { value: 'dismissed', label: 'Ignorado' },
  ];

  // Standard+ gate
  if (!ent.loading && !ent.features.instagramComments) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center text-3xl mx-auto">💬</div>
        <h2 className="text-2xl font-bold text-gray-900">Comentários Instagram</h2>
        <p className="text-gray-500">
          Crie regras automáticas para responder comentários e enviar DMs. Disponível a partir do plano <strong>Standard</strong>.
        </p>
        <Link
          href="/dashboard/billing#plans"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
        >
          Fazer upgrade para Standard →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comentários Instagram</h1>
        {activeTab === 'rules' && (
          <button
            onClick={openCreate}
            className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm px-4 py-2 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span>
            Nova Regra
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200/60 shadow-sm rounded-2xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Regras tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          {/* Loading */}
          {rulesLoading && (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <svg
                className="animate-spin h-5 w-5 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Carregando regras…
            </div>
          )}

          {/* Error */}
          {!rulesLoading && rulesError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-red-500 text-sm">{rulesError}</p>
              <button
                onClick={fetchRules}
                className="text-sm text-indigo-600 hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Empty state */}
          {!rulesLoading && !rulesError && rules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-2xl">
                💬
              </div>
              <p className="text-gray-500 text-sm text-center max-w-xs">
                Nenhuma regra criada. Crie regras para responder comentários
                automaticamente.
              </p>
              <button
                onClick={openCreate}
                className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm px-4 py-2 hover:opacity-90 transition-opacity"
              >
                + Nova Regra
              </button>
            </div>
          )}

          {/* Table */}
          {!rulesLoading && !rulesError && rules.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Nome
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Gatilho
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Correspondência
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Ações
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Ativo
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20 text-right">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rules.map((rule) => {
                    const actions = parseActions(rule.actions);
                    return (
                      <tr
                        key={rule.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Name */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-800">{rule.name}</p>
                          {rule.scope === 'post' && rule.postId && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Post: {rule.postId}
                            </p>
                          )}
                          {rule.scope === 'global' && (
                            <span className="text-xs text-indigo-400">Global</span>
                          )}
                        </td>

                        {/* Trigger */}
                        <td className="px-5 py-4">
                          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-md mb-1">
                            {rule.triggerType === 'keyword' && 'Palavra-chave'}
                            {rule.triggerType === 'contains' && 'Contém'}
                            {rule.triggerType === 'ai_intent' && 'Intenção IA'}
                          </span>
                          <p className="text-gray-600 text-xs truncate max-w-[160px]">
                            {rule.triggerValue}
                          </p>
                        </td>

                        {/* Match type */}
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          {rule.triggerType === 'ai_intent'
                            ? '—'
                            : rule.matchType === 'exact'
                            ? 'Exato'
                            : 'Parcial'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {actions.length === 0 ? (
                              <span className="text-gray-400 text-xs">—</span>
                            ) : (
                              actions.map((a, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionBadgeColor(a.type)}`}
                                >
                                  {a.type === 'reply_comment' && 'Responder'}
                                  {a.type === 'send_dm' && 'Enviar DM'}
                                  {a.type === 'hide_comment' && 'Ocultar'}
                                  {a.type === 'enroll_sequence' && 'Sequência'}
                                  {!['reply_comment', 'send_dm', 'hide_comment', 'enroll_sequence'].includes(a.type) && a.type}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Active toggle */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggleActive(rule)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${rule.active ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            aria-pressed={rule.active}
                            title={rule.active ? 'Desativar' : 'Ativar'}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${rule.active ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                        </td>

                        {/* Actions column */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(rule)}
                              title="Editar"
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              {/* Pencil icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule)}
                              title="Excluir"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              {/* Trash icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Fila de Moderação tab ────────────────────────────────────────────── */}
      {activeTab === 'moderation' && (
        <div>
          {/* Status filter */}
          <div className="flex gap-2 mb-4">
            {modStatusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setModStatus(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  modStatus === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            {/* Loading */}
            {modLoading && (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Carregando itens…
              </div>
            )}

            {/* Error */}
            {!modLoading && modError && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-red-500 text-sm">{modError}</p>
                <button
                  onClick={() => fetchModItems(modStatus)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Empty state */}
            {!modLoading && !modError && modItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl">
                  📭
                </div>
                <p className="text-gray-500 text-sm">Nenhum item na fila.</p>
              </div>
            )}

            {/* Table */}
            {!modLoading && !modError && modItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Comentário
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Usuário
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Post ID
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {modItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/* Comment text */}
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-gray-800 line-clamp-2">{item.text}</p>
                        </td>

                        {/* User */}
                        <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {item.fromUsername ? (
                            <span>@{item.fromUsername}</span>
                          ) : (
                            <span className="text-gray-400">{item.from}</span>
                          )}
                        </td>

                        {/* Post ID */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                            {item.postId}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadgeColor(item.status)}`}
                          >
                            {item.status === 'pending' && 'Pendente'}
                            {item.status === 'replied' && 'Respondido'}
                            {item.status === 'hidden' && 'Oculto'}
                            {item.status === 'dismissed' && 'Ignorado'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          {fmtDate(item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <RuleModal
          editingRule={editingRule}
          onClose={() => setModalOpen(false)}
          onSaved={fetchRules}
          showToast={showToast}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast toast={toast} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
