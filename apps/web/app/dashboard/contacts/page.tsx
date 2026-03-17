'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Contact = {
  id: string;
  name: string | null;
  phone: string | null;
  normalizedPhone: string | null;
  email: string | null;
  status: string;
  source: string | null;
  lastChannelUsed: string | null;
  lastInteractionAt: string | null;
  createdAt: string;
  waId: string | null;
  instagramScopedId: string | null;
  facebookScopedId: string | null;
};

type ContactDetail = Contact & {
  conversations: { id: string; channel: string; status: string; lastMessageAt: string; createdAt: string }[];
  orders: { id: string; status: string; price: number; currency: string; product: string | null; createdAt: string }[];
  appointments: { id: string; service: string | null; date: string | null; time: string | null; status: string; createdAt: string }[];
  memory: { preferences: string | null; notes: string | null; updatedAt: string } | null;
};

type ListResult = {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  manual: 'Manual',
  import: 'Importação',
  order: 'Pedido',
  appointment: 'Agendamento',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  instagram: '📸',
  facebook: '👤',
  manual: '✏️',
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function currency(v: number, c = 'BRL') {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: c });
}

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
  no_show: 'Não compareceu',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  // Detail drawer
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterSource) params.set('source', filterSource);
      if (filterStatus) params.set('status', filterStatus);
      if (filterChannel) params.set('channel', filterChannel);
      params.set('page', String(page));

      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error('Falha ao carregar contatos');
      const data: ListResult = await res.json();
      setContacts(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterSource, filterStatus, filterChannel, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterSource, filterStatus, filterChannel]);

  async function openDetail(id: string) {
    setSelectedId(id);
    setEditing(false);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error('Falha ao carregar contato');
      setDetail(await res.json());
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function startEdit() {
    if (!detail) return;
    setEditForm({
      name: detail.name ?? '',
      email: detail.email ?? '',
      phone: detail.phone ?? '',
      notes: detail.notes ?? '',
      status: detail.status,
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      await openDetail(selectedId);
      setEditing(false);
      fetchContacts();
    } catch {
      // leave editing open so user can retry
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = search || filterSource || filterStatus || filterChannel;

  return (
    <div className="flex gap-0 h-full min-h-screen" style={{ margin: '-1.5rem' }}>
      {/* ── Left panel ──────────────────────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-w-0 p-6 ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} contato${total !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-600"
          >
            <option value="">Todas as origens</option>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-600"
          >
            <option value="">Todos os canais</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-600"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="archived">Arquivado</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </div>

        {/* Content */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
            Erro ao carregar contatos: {error}
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {hasFilters ? 'Nenhum contato encontrado' : 'Ainda sem contatos'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {hasFilters
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Os contatos serão criados automaticamente quando chegarem novas conversas, pedidos ou agendamentos.'}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setSearch(''); setFilterSource(''); setFilterStatus(''); setFilterChannel(''); }}
                className="mt-4 text-sm text-[#4f46e5] hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Origem</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Última interação</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openDetail(c.id)}
                    className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedId === c.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {(c.name ?? c.phone ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{c.name ?? <span className="text-gray-400 italic">Sem nome</span>}</p>
                          <p className="text-xs text-gray-400">{c.phone ?? c.normalizedPhone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500">
                        {c.lastChannelUsed ? (CHANNEL_ICONS[c.lastChannelUsed] ?? '') : ''}{' '}
                        {SOURCE_LABELS[c.source ?? ''] ?? c.source ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {c.status === 'active' ? 'Ativo' : c.status === 'archived' ? 'Arquivado' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      {timeAgo(c.lastInteractionAt)}
                    </td>
                    <td className="px-4 py-3">
                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Detail drawer ────────────────────────────────────────────────────── */}
      {selectedId && (
        <div className="w-full lg:w-[420px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-screen overflow-y-auto sticky top-0">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Detalhes do contato</h2>
            <button
              onClick={() => { setSelectedId(null); setDetail(null); setEditing(false); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center flex-1 py-16 text-sm text-gray-400">
              Falha ao carregar detalhes.
            </div>
          ) : (
            <div className="p-5 space-y-5 flex-1">
              {/* Identity */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {(detail.name ?? detail.phone ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <input
                      value={editForm.name ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full text-lg font-bold text-gray-900 border-b border-[#4f46e5] focus:outline-none bg-transparent"
                    />
                  ) : (
                    <p className="text-lg font-bold text-gray-900 truncate">
                      {detail.name ?? <span className="text-gray-400 italic font-normal">Sem nome</span>}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-0.5">{detail.phone ?? detail.normalizedPhone ?? '—'}</p>
                  <span className={`mt-1 inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[detail.status] ?? ''}`}>
                    {detail.status === 'active' ? 'Ativo' : detail.status === 'archived' ? 'Arquivado' : 'Bloqueado'}
                  </span>
                </div>
              </div>

              {/* Edit fields */}
              {editing && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">E-mail</label>
                    <input
                      value={editForm.email ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                    <select
                      value={editForm.status ?? 'active'}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                    >
                      <option value="active">Ativo</option>
                      <option value="archived">Arquivado</option>
                      <option value="blocked">Bloqueado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notas internas</label>
                    <textarea
                      rows={3}
                      value={(editForm as any).notes ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value } as any))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Info grid */}
              {!editing && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">E-mail</p>
                      <p className="font-medium text-gray-700 truncate">{detail.email ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Origem</p>
                      <p className="font-medium text-gray-700">{SOURCE_LABELS[detail.source ?? ''] ?? detail.source ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Canal</p>
                      <p className="font-medium text-gray-700">
                        {detail.lastChannelUsed ? `${CHANNEL_ICONS[detail.lastChannelUsed] ?? ''} ${detail.lastChannelUsed}` : '—'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-0.5">Criado em</p>
                      <p className="font-medium text-gray-700">{formatDate(detail.createdAt)}</p>
                    </div>
                  </div>

                  {/* Channel IDs */}
                  {(detail.waId || detail.instagramScopedId || detail.facebookScopedId) && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identificadores de canal</p>
                      {detail.waId && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>💬 WhatsApp ID:</span>
                          <span className="font-mono text-gray-700">{detail.waId}</span>
                        </div>
                      )}
                      {detail.instagramScopedId && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>📸 Instagram ID:</span>
                          <span className="font-mono text-gray-700">{detail.instagramScopedId}</span>
                        </div>
                      )}
                      {detail.facebookScopedId && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>👤 Facebook ID:</span>
                          <span className="font-mono text-gray-700">{detail.facebookScopedId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes from memory */}
                  {detail.memory?.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Memória do cliente</p>
                      <p className="text-sm text-amber-900 whitespace-pre-line">{detail.memory.notes}</p>
                    </div>
                  )}

                  <button
                    onClick={startEdit}
                    className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    ✏️ Editar contato
                  </button>
                </>
              )}

              {/* Conversations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversas recentes</p>
                  <a href="/dashboard/conversations" className="text-xs text-[#4f46e5] hover:underline">Ver todas →</a>
                </div>
                {detail.conversations.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhuma conversa vinculada.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail.conversations.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-xs">
                        <span>{CHANNEL_ICONS[c.channel] ?? '💬'} {c.channel}</span>
                        <span className={`font-semibold ${c.status === 'open' ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {c.status === 'open' ? 'Aberta' : 'Fechada'}
                        </span>
                        <span className="text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Orders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Últimos pedidos</p>
                  <a href="/dashboard/orders" className="text-xs text-[#4f46e5] hover:underline">Ver todos →</a>
                </div>
                {detail.orders.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhum pedido vinculado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail.orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-xs">
                        <span className="truncate max-w-[120px] text-gray-700">{o.product ?? 'Pedido'}</span>
                        <span className="font-semibold text-gray-900">{currency(o.price, o.currency)}</span>
                        <span className="text-gray-400">{formatDate(o.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agendamentos</p>
                  <a href="/dashboard/agenda" className="text-xs text-[#4f46e5] hover:underline">Ver todos →</a>
                </div>
                {detail.appointments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nenhum agendamento vinculado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detail.appointments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-xs">
                        <span className="truncate max-w-[120px] text-gray-700">{a.service ?? 'Serviço'}</span>
                        <span className="text-gray-500">{a.date ? `${a.date} ${a.time ?? ''}`.trim() : '—'}</span>
                        <span className="font-semibold text-gray-600">
                          {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
