'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
  tags: string[];
};

type ContactDetail = Contact & {
  notes: string | null;
  customFields: Record<string, string> | null;
  conversations: { id: string; channel: string; status: string; lastMessageAt: string; createdAt: string }[];
  orders: { id: string; status: string; price: number; currency: string; product: string | null; createdAt: string }[];
  appointments: { id: string; service: string | null; date: string | null; time: string | null; status: string; createdAt: string }[];
  memory: { preferences: string | null; notes: string | null; updatedAt: string } | null;
};

type ContactEvent = {
  id: string;
  type: string;
  title: string;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
};

type DuplicateContact = {
  id: string;
  name: string | null;
  phone: string | null;
  normalizedPhone: string | null;
  email: string | null;
  status: string;
  source: string | null;
  lastInteractionAt: string | null;
  createdAt: string;
};

type Analytics = {
  total: number;
  newThisWeek: number;
  withOrders: number;
  withAppointments: number;
  mergeCount: number;
  bySource: { source: string; count: number }[];
  byStatus: { status: string; count: number }[];
};

type ListResult = {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type DrawerTab = 'profile' | 'timeline' | 'orders' | 'appointments' | 'payments';

type ContactPayment = {
  id: string;
  status: string;
  sourceType: string;
  amount: number;
  currency: string;
  billingType: string;
  description: string | null;
  invoiceUrl: string | null;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  orderId: string | null;
  appointmentId: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook',
  manual: 'Manual', import: 'Importação', order: 'Pedido', appointment: 'Agendamento',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  new_lead: 'bg-blue-50 text-blue-700 border-blue-200',
  engaged: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  customer: 'bg-purple-50 text-purple-700 border-purple-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  archived: 'bg-gray-100 text-gray-400 border-gray-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo', new_lead: 'Novo lead', engaged: 'Engajado',
  customer: 'Cliente', inactive: 'Inativo', archived: 'Arquivado', blocked: 'Bloqueado',
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬', instagram: '📸', facebook: '👤', manual: '✏️',
};

const EVENT_ICONS: Record<string, string> = {
  conversation_started: '💬',
  order_created: '🛍️', order_paid: '✅', order_cancelled: '❌',
  order_completed: '🏁', order_refunded: '↩️',
  appointment_created: '📅', appointment_confirmed: '✅',
  appointment_cancelled: '❌', appointment_completed: '🏁', appointment_no_show: '⚠️',
  contact_created: '👤', contact_merged: '🔀',
  tag_added: '🏷️', note_updated: '📝',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
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

const APPT_STATUS: Record<string, string> = {
  agendado: 'Agendado', confirmado: 'Confirmado', cancelado: 'Cancelado',
  concluido: 'Concluído', no_show: 'Não compareceu',
};

function initials(c: Contact | ContactDetail) {
  return (c.name ?? c.phone ?? '?')[0].toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-100">
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-indigo-900 leading-none">×</button>
      )}
    </span>
  );
}

function AnalyticsCards({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) return null;
  const cards = [
    { label: 'Total de contatos', value: analytics.total, icon: '👥' },
    { label: 'Novos esta semana', value: analytics.newThisWeek, icon: '✨' },
    { label: 'Com pedidos', value: analytics.withOrders, icon: '🛍️' },
    { label: 'Com agendamentos', value: analytics.withAppointments, icon: '📅' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-gray-200/60 rounded-2xl p-4">
          <div className="text-2xl mb-1">{c.icon}</div>
          <div className="text-2xl font-bold text-gray-900">{c.value.toLocaleString('pt-BR')}</div>
          <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── Auth helper ──────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? (localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '')
      : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function ContactsPage() {
  const router = useRouter();

  // List state
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
  const [filterTag, setFilterTag] = useState('');

  // Analytics
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  // Drawer state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('profile');

  // Timeline
  const [timeline, setTimeline] = useState<ContactEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Payments
  const [contactPayments, setContactPayments] = useState<ContactPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Duplicates
  const [duplicates, setDuplicates] = useState<DuplicateContact[]>([]);
  const [merging, setMerging] = useState<string | null>(null);
  const [mergeConfirm, setMergeConfirm] = useState<DuplicateContact | null>(null);

  // Edit
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ContactDetail & { notes: string }>>({});
  const [saving, setSaving] = useState(false);

  // Tag editor
  const [tagInput, setTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);

  // Add contact modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', status: 'new_lead', channel: 'whatsapp' });
  const [addingContact, setAddingContact] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Start conversation
  const [startingConvId, setStartingConvId] = useState<string | null>(null);

  // ── Fetch contacts ──────────────────────────────────────────────────────────

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterSource) params.set('source', filterSource);
      if (filterStatus) params.set('status', filterStatus);
      if (filterChannel) params.set('channel', filterChannel);
      if (filterTag) params.set('tag', filterTag);
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
  }, [search, filterSource, filterStatus, filterChannel, filterTag, page]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);
  useEffect(() => { setPage(1); }, [search, filterSource, filterStatus, filterChannel, filterTag]);

  // Fetch analytics once
  useEffect(() => {
    fetch('/api/contacts/analytics')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setAnalytics(data))
      .catch(() => {});
  }, []);

  // ── Drawer ──────────────────────────────────────────────────────────────────

  async function openDetail(id: string) {
    setSelectedId(id);
    setEditing(false);
    setDetail(null);
    setTimeline([]);
    setContactPayments([]);
    setDuplicates([]);
    setMergeConfirm(null);
    setDrawerTab('profile');
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/contacts/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetail(data);

      // Load duplicates silently
      fetch(`/api/contacts/${id}/duplicates`)
        .then((r) => r.ok ? r.json() : [])
        .then((d) => setDuplicates(d))
        .catch(() => {});
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadTimeline(id: string) {
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/contacts/${id}/timeline`);
      if (!res.ok) return;
      setTimeline(await res.json());
    } catch {
      // silent
    } finally {
      setTimelineLoading(false);
    }
  }

  async function loadContactPayments(contactId: string) {
    setPaymentsLoading(true);
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '')
        : '';
      const res = await fetch(`/api/contacts/${contactId}/payments?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContactPayments(data.payments ?? []);
      }
    } catch {
      setContactPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }

  function handleTabChange(tab: DrawerTab) {
    setDrawerTab(tab);
    if (tab === 'timeline' && selectedId && timeline.length === 0) {
      loadTimeline(selectedId);
    }
    if (tab === 'payments' && selectedId) {
      loadContactPayments(selectedId);
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────

  function startEdit() {
    if (!detail) return;
    setEditForm({
      name: detail.name ?? '',
      email: detail.email ?? '',
      phone: detail.phone ?? '',
      status: detail.status,
      notes: detail.notes ?? '',
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
      if (!res.ok) throw new Error();
      await openDetail(selectedId);
      setEditing(false);
      fetchContacts();
    } finally {
      setSaving(false);
    }
  }

  // ── Tags ────────────────────────────────────────────────────────────────────

  async function addTag() {
    if (!detail || !tagInput.trim()) return;
    const newTags = [...new Set([...detail.tags, tagInput.trim().toLowerCase()])];
    setSavingTags(true);
    try {
      const res = await fetch(`/api/contacts/${detail.id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) throw new Error();
      setDetail((d) => d ? { ...d, tags: newTags } : d);
      setContacts((cs) => cs.map((c) => c.id === detail.id ? { ...c, tags: newTags } : c));
      setTagInput('');
    } finally {
      setSavingTags(false);
    }
  }

  async function removeTag(tag: string) {
    if (!detail) return;
    const newTags = detail.tags.filter((t) => t !== tag);
    setSavingTags(true);
    try {
      const res = await fetch(`/api/contacts/${detail.id}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });
      if (!res.ok) throw new Error();
      setDetail((d) => d ? { ...d, tags: newTags } : d);
      setContacts((cs) => cs.map((c) => c.id === detail.id ? { ...c, tags: newTags } : c));
    } finally {
      setSavingTags(false);
    }
  }

  // ── Merge ────────────────────────────────────────────────────────────────────

  async function confirmMerge() {
    if (!selectedId || !mergeConfirm) return;
    setMerging(mergeConfirm.id);
    try {
      const res = await fetch(`/api/contacts/${selectedId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergedId: mergeConfirm.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Falha ao mesclar');
      }
      setMergeConfirm(null);
      setDuplicates([]);
      await openDetail(selectedId);
      fetchContacts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMerging(null);
    }
  }

  // ── Add contact ─────────────────────────────────────────────────────────────

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.phone.trim()) return;
    setAddingContact(true);
    setAddError(null);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...addForm, source: 'manual' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Falha ao criar contato');
      }
      const contact = await res.json();
      setShowAddModal(false);
      setAddForm({ name: '', phone: '', email: '', status: 'new_lead', channel: 'whatsapp' });
      await fetchContacts();
      openDetail(contact.id);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Erro ao criar contato');
    } finally {
      setAddingContact(false);
    }
  }

  // ── Start conversation ───────────────────────────────────────────────────────

  async function handleStartConversation(contactId: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setStartingConvId(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}/start-conversation`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? 'Erro ao iniciar conversa');
        return;
      }
      const data = await res.json();
      router.push(`/dashboard/conversations?phone=${encodeURIComponent(data.phone)}`);
    } catch {
      alert('Erro ao iniciar conversa');
    } finally {
      setStartingConvId(null);
    }
  }

  const hasFilters = search || filterSource || filterStatus || filterChannel || filterTag;

  // ── Render ──────────────────────────────────────────────────────────────────

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
          <button
            onClick={() => { setAddError(null); setShowAddModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar contato
          </button>
        </div>

        {/* Analytics */}
        <AnalyticsCards analytics={analytics} />

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
          <input
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            placeholder="Filtrar por tag..."
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 w-36"
          />
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-600">
            <option value="">Todas as origens</option>
            {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-600">
            <option value="">Todos os canais</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-600">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {/* Content */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">
            Erro ao carregar contatos: {error}
          </div>
        ) : loading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {hasFilters ? 'Nenhum contato encontrado' : 'Ainda sem contatos'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {hasFilters ? 'Tente ajustar os filtros ou a busca.' : 'Contatos são criados automaticamente a partir de conversas, pedidos e agendamentos.'}
            </p>
            {hasFilters && (
              <button onClick={() => { setSearch(''); setFilterSource(''); setFilterStatus(''); setFilterChannel(''); setFilterTag(''); }}
                className="mt-4 text-sm text-[#4f46e5] hover:underline">
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tags</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Última interação</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr key={c.id} onClick={() => openDetail(c.id)}
                    className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedId === c.id ? 'bg-indigo-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {initials(c)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{c.name ?? <span className="text-gray-400 italic text-xs">Sem nome</span>}</p>
                          <p className="text-xs text-gray-400">{c.phone ?? c.normalizedPhone ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => <TagBadge key={t} tag={t} />)}
                        {c.tags.length > 3 && <span className="text-[10px] text-gray-400">+{c.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">{timeAgo(c.lastInteractionAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={(e) => handleStartConversation(c.id, e)}
                          disabled={startingConvId === c.id}
                          title="Abrir conversa"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-indigo-50 text-[#4f46e5] border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {startingConvId === c.id ? (
                            <span className="w-3 h-3 border border-[#4f46e5]/40 border-t-[#4f46e5] rounded-full animate-spin inline-block" />
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                          Conversar
                        </button>
                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Detail drawer ────────────────────────────────────────────────────── */}
      {selectedId && (
        <div className="w-full lg:w-[440px] flex-shrink-0 bg-white border-l border-gray-200 flex flex-col h-screen overflow-y-auto sticky top-0">

          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Detalhes do contato</h2>
            <button onClick={() => { setSelectedId(null); setDetail(null); setEditing(false); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
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
            <div className="flex items-center justify-center flex-1 py-16 text-sm text-gray-400">Falha ao carregar detalhes.</div>
          ) : (
            <>
              {/* Identity bar */}
              <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {initials(detail)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-900 truncate">
                    {detail.name ?? <span className="text-gray-400 italic font-normal text-sm">Sem nome</span>}
                  </p>
                  <p className="text-xs text-gray-500">{detail.phone ?? detail.normalizedPhone ?? '—'}</p>
                  <span className={`mt-1 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[detail.status] ?? ''}`}>
                    {STATUS_LABELS[detail.status] ?? detail.status}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 px-5">
                {(['profile', 'timeline', 'orders', 'appointments', 'payments'] as DrawerTab[]).map((tab) => {
                  const labels: Record<DrawerTab, string> = { profile: 'Perfil', timeline: 'Timeline', orders: 'Pedidos', appointments: 'Agenda', payments: 'Cobranças' };
                  return (
                    <button key={tab} onClick={() => handleTabChange(tab)}
                      className={`px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${drawerTab === tab ? 'border-[#4f46e5] text-[#4f46e5]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              <div className="p-5 flex-1 space-y-5 overflow-y-auto">

                {/* ── Profile tab ──────────────────────────────────────────── */}
                {drawerTab === 'profile' && (
                  <>
                    {editing ? (
                      <div className="space-y-3">
                        {[
                          { label: 'Nome', key: 'name' as const },
                          { label: 'E-mail', key: 'email' as const },
                          { label: 'Telefone', key: 'phone' as const },
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                            <input value={(editForm as any)[key] ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20" />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                          <select value={editForm.status ?? 'active'} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20">
                            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Notas internas</label>
                          <textarea rows={3} value={(editForm as any).notes ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value } as any))}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 resize-none" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={saving}
                            className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                            {saving ? <span>Salvando...</span> : <span>Salvar</span>}
                          </button>
                          <button onClick={() => setEditing(false)}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Info grid */}
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

                        {/* Notes */}
                        {detail.memory?.notes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <p className="text-xs font-semibold text-amber-700 mb-1">Memória do cliente</p>
                            <p className="text-sm text-amber-900 whitespace-pre-line">{detail.memory.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartConversation(detail.id)}
                            disabled={startingConvId === detail.id}
                            className="flex-1 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {startingConvId === detail.id ? (
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            )}
                            Conversar
                          </button>
                          <button onClick={startEdit}
                            className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                            ✏️ Editar
                          </button>
                        </div>
                      </>
                    )}

                    {/* Tags */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {detail.tags.length === 0 && <span className="text-xs text-gray-400 italic">Sem tags.</span>}
                        {detail.tags.map((t) => <TagBadge key={t} tag={t} onRemove={() => removeTag(t)} />)}
                      </div>
                      <div className="flex gap-2">
                        <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                          placeholder="Adicionar tag..."
                          className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20" />
                        <button onClick={addTag} disabled={!tagInput.trim() || savingTags}
                          className="px-3 py-1.5 bg-indigo-50 text-[#4f46e5] border border-indigo-100 rounded-xl text-xs font-semibold hover:bg-indigo-100 disabled:opacity-50">
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Duplicates */}
                    {duplicates.length > 0 && (
                      <div className="border border-amber-200 bg-amber-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-2">⚠️ Possíveis duplicados ({duplicates.length})</p>
                        <div className="space-y-2">
                          {duplicates.map((d) => (
                            <div key={d.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{d.name ?? <span className="italic text-gray-400">Sem nome</span>}</p>
                                <p className="text-xs text-gray-500">{d.phone ?? d.normalizedPhone ?? '—'}</p>
                              </div>
                              <button onClick={() => setMergeConfirm(d)}
                                className="text-xs px-2.5 py-1 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 font-semibold">
                                Mesclar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Merge confirm modal */}
                    {mergeConfirm && (
                      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
                          <h3 className="font-bold text-gray-900">Confirmar mesclagem</h3>
                          <p className="text-sm text-gray-600">
                            O contato <strong>{mergeConfirm.name ?? mergeConfirm.phone}</strong> será arquivado e todos os seus vínculos (conversas, pedidos, agendamentos) serão transferidos para o contato atual.
                          </p>
                          <p className="text-xs text-gray-400">Esta ação não pode ser desfeita automaticamente.</p>
                          <div className="flex gap-3">
                            <button onClick={confirmMerge} disabled={!!merging}
                              className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm disabled:opacity-50">
                              {merging ? 'Mesclando...' : 'Confirmar mesclagem'}
                            </button>
                            <button onClick={() => setMergeConfirm(null)}
                              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Timeline tab ─────────────────────────────────────────── */}
                {drawerTab === 'timeline' && (
                  <div>
                    {timelineLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
                      </div>
                    ) : timeline.length === 0 ? (
                      <p className="text-sm text-gray-400 italic text-center py-8">Nenhum evento registrado ainda.</p>
                    ) : (
                      <div className="space-y-0">
                        {timeline.map((ev, idx) => (
                          <div key={ev.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                                {EVENT_ICONS[ev.type] ?? '📌'}
                              </div>
                              {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-1 min-h-[12px]" />}
                            </div>
                            <div className="pb-4 flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 leading-tight">{ev.title}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(ev.occurredAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Orders tab ───────────────────────────────────────────── */}
                {drawerTab === 'orders' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedidos</p>
                      <a href="/dashboard/orders" className="text-xs text-[#4f46e5] hover:underline">Ver todos →</a>
                    </div>
                    {detail.orders.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Nenhum pedido vinculado.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.orders.map((o) => (
                          <div key={o.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 text-sm">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate">{o.product ?? 'Pedido'}</p>
                              <p className="text-xs text-gray-400">{formatDate(o.createdAt)}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-gray-900">{currency(o.price, o.currency)}</p>
                              <p className="text-xs text-gray-400">{o.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Appointments tab ─────────────────────────────────────── */}
                {drawerTab === 'appointments' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agendamentos</p>
                      <a href="/dashboard/agenda" className="text-xs text-[#4f46e5] hover:underline">Ver todos →</a>
                    </div>
                    {detail.appointments.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Nenhum agendamento vinculado.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.appointments.map((a) => (
                          <div key={a.id} className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-800 truncate">{a.service ?? 'Serviço'}</p>
                              <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                                {APPT_STATUS[a.status] ?? a.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {a.date ? `${a.date} ${a.time ?? ''}`.trim() : '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Payments tab ──────────────────────────────────────────── */}
                {drawerTab === 'payments' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cobranças</p>
                      <a href="/dashboard/payments" className="text-xs text-[#4f46e5] hover:underline">Ver todas →</a>
                    </div>
                    {paymentsLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
                      </div>
                    ) : contactPayments.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Nenhuma cobrança vinculada.</p>
                    ) : (
                      <div className="space-y-2">
                        {contactPayments.map((p) => {
                          const statusLabel: Record<string, string> = {
                            pending: 'Pendente', confirmed: 'Pago', overdue: 'Vencido',
                            failed: 'Falhou', canceled: 'Cancelado', refunded: 'Estornado',
                          };
                          const statusColor: Record<string, string> = {
                            pending: 'text-amber-600', confirmed: 'text-emerald-600',
                            overdue: 'text-orange-600', failed: 'text-red-600',
                            canceled: 'text-gray-400', refunded: 'text-gray-500',
                          };
                          return (
                            <div key={p.id} className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 truncate">
                                  {p.description ?? (p.sourceType === 'order' ? 'Pedido' : p.sourceType === 'appointment' ? 'Agendamento' : 'Cobrança avulsa')}
                                </p>
                                <p className="text-xs text-gray-400">Venc. {p.dueDate}</p>
                              </div>
                              <div className="text-right flex-shrink-0 space-y-0.5">
                                <p className="font-semibold text-gray-900">{currency(p.amount, p.currency)}</p>
                                <p className={`text-xs font-medium ${statusColor[p.status] ?? 'text-gray-500'}`}>
                                  {statusLabel[p.status] ?? p.status}
                                </p>
                                {p.invoiceUrl && p.status !== 'confirmed' && (
                                  <a
                                    href={p.invoiceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-[#4f46e5] hover:underline block"
                                  >
                                    Abrir link →
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      )}

      {/* ── Add contact modal ─────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Adicionar contato</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Telefone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Ex: 5511999990000"
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nome</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nome do contato"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">E-mail</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Canal</label>
                  <select
                    value={addForm.channel}
                    onChange={(e) => setAddForm((f) => ({ ...f, channel: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>
              </div>
              {addError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {addError}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={addingContact || !addForm.phone.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addingContact ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : null}
                  {addingContact ? 'Salvando...' : 'Adicionar contato'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
