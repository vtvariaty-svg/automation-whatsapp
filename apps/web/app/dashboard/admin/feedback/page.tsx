'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeedbackItem {
  id: string;
  tenantId: string;
  category: string;
  body: string;
  route: string | null;
  channel: string | null;
  plan: string | null;
  score: number | null;
  status: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'new' | 'reviewing' | 'planned' | 'resolved';
type CategoryFilter = 'all' | 'bug' | 'sugestão' | 'onboarding' | 'integração' | 'cobrança';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  };
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-red-100 text-red-700',
  reviewing: 'bg-yellow-100 text-yellow-700',
  planned: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  reviewing: 'Em análise',
  planned: 'Planejado',
  resolved: 'Resolvido',
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug',
  'sugestão': 'Sugestão',
  onboarding: 'Onboarding',
  'integração': 'Integração',
  'cobrança': 'Cobrança',
};

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-50 text-red-600',
  'sugestão': 'bg-purple-50 text-purple-600',
  onboarding: 'bg-orange-50 text-orange-600',
  'integração': 'bg-teal-50 text-teal-600',
  'cobrança': 'bg-yellow-50 text-yellow-600',
};

const SCORE_EMOJIS: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const res = await fetch(`/api/feedback?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item)),
        );
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  const total = items.length;
  const categoryBreakdown = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback de Produto</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie e priorize o feedback dos usuários</p>
        </div>
        <button
          onClick={fetchItems}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        {Object.entries(categoryBreakdown).map(([cat, count]) => (
          <div key={cat} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500 mt-1">{CATEGORY_LABELS[cat] ?? cat}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos</option>
            <option value="new">Novo</option>
            <option value="reviewing">Em análise</option>
            <option value="planned">Planejado</option>
            <option value="resolved">Resolvido</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas</option>
            <option value="bug">Bug</option>
            <option value="sugestão">Sugestão</option>
            <option value="onboarding">Onboarding</option>
            <option value="integração">Integração</option>
            <option value="cobrança">Cobrança</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">Nenhum feedback encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Mensagem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Category */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          CATEGORY_COLORS[item.category] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    </td>

                    {/* Body preview */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-gray-900 line-clamp-2 text-sm">{item.body}</p>
                      {item.route && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{item.route}</p>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      <span className="text-gray-600 capitalize">{item.plan ?? '—'}</span>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3 text-center">
                      {item.score != null ? (
                        <span className="text-lg" title={`${item.score}/5`}>
                          {SCORE_EMOJIS[item.score] ?? item.score}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {format(new Date(item.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                    </td>

                    {/* Status dropdown */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[item.status] ?? item.status}
                        </span>
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(e) => updateStatus(item.id, e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="new">Novo</option>
                          <option value="reviewing">Em análise</option>
                          <option value="planned">Planejado</option>
                          <option value="resolved">Resolvido</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
