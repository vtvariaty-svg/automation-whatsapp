"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { planAtLeast } from "@/lib/config/plans";
import UpgradeGate from "@/components/UpgradeGate";
import { OrderFormDialog } from "@/components/orders/OrderFormDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId?: string;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedBy?: string;
  reason?: string;
  createdAt: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  product: string;
  price: number;
  status: string;
  origin: string;
  createdAt: string;
  updatedAt: string;
  contactId?: string;
  conversationId?: string;
  currency: string;
  subtotal: number;
  discount: number;
  cancelReason?: string;
  notes?: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  externalPaymentRef?: string;
  items: OrderItem[];
  statusHistory?: StatusHistoryEntry[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Rascunho", color: "text-gray-600", bg: "bg-gray-100 border-gray-200" },
  pending_payment: { label: "Aguard. Pagamento", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  paid: { label: "Pago", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  processing: { label: "Em Andamento", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  completed: { label: "Concluído", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
  cancelled: { label: "Cancelado", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  refunded: { label: "Reembolsado", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  failed: { label: "Falhou", color: "text-red-700", bg: "bg-red-100 border-red-300" },
  // Legacy
  novo: { label: "Novo", color: "text-blue-600", bg: "bg-blue-100 border-blue-200" },
  confirmado: { label: "Confirmado", color: "text-indigo-600", bg: "bg-indigo-100 border-indigo-200" },
  preparando: { label: "Preparando", color: "text-yellow-600", bg: "bg-yellow-100 border-yellow-200" },
  enviado: { label: "Enviado", color: "text-purple-600", bg: "bg-purple-100 border-purple-200" },
  finalizado: { label: "Finalizado", color: "text-gray-600", bg: "bg-gray-100 border-gray-200" },
};

const ORIGIN_LABELS: Record<string, string> = {
  manual: "Manual",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  checkout: "Checkout",
  agenda: "Agenda",
};

const STATUS_ACTIONS: Record<string, { label: string; target: string; color: string }[]> = {
  draft: [
    { label: "Enviar p/ Pagamento", target: "pending_payment", color: "bg-amber-500 hover:bg-amber-600" },
    { label: "Marcar como Pago", target: "paid", color: "bg-emerald-500 hover:bg-emerald-600" },
  ],
  pending_payment: [
    { label: "Marcar como Pago", target: "paid", color: "bg-emerald-500 hover:bg-emerald-600" },
  ],
  paid: [
    { label: "Iniciar Processamento", target: "processing", color: "bg-blue-500 hover:bg-blue-600" },
  ],
  processing: [
    { label: "Concluir", target: "completed", color: "bg-indigo-500 hover:bg-indigo-600" },
  ],
};

// ── Helper ────────────────────────────────────────────────────────────────────
function getStatusInfo(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100 border-gray-200" };
}

function formatCurrency(value: number) {
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [noteText, setNoteText] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchOrders = useCallback(async () => {
    if (!user?.tenantId) return;
    try {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterOrigin) params.set("origin", filterOrigin);
      if (filterSearch) params.set("search", filterSearch);
      const res = await fetch(`/api/orders?${params}`, { headers });
      if (res.ok) {
        setOrders(await res.json());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, filterStatus, filterOrigin, filterSearch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Gate
  if (!ent.loading && !planAtLeast(ent.plan, "standard")) {
    return <UpgradeGate icon="🛍️" title="Gestão de Pedidos" message="Pedidos disponíveis a partir do plano Standard." ctaPlan="Standard" />;
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  const updateStatus = async (orderId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${cancelModal}/cancel`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === cancelModal ? updated : o)));
        if (selectedOrder?.id === cancelModal) setSelectedOrder(updated);
        setCancelModal(null);
        setCancelReason("");
      }
    } catch (err) {
      console.error("Failed to cancel", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (orderId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, { method: "POST", headers });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        if (selectedOrder?.id === orderId) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error("Failed to refund", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (orderId: string) => {
    if (!noteText.trim()) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: noteText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, notes: updated.notes });
        setNoteText("");
      }
    } catch (err) {
      console.error("Failed to add note", err);
    }
  };

  const openDetail = async (order: Order) => {
    // Fetch full details with statusHistory
    try {
      const res = await fetch(`/api/orders/${order.id}`, { headers });
      if (res.ok) {
        setSelectedOrder(await res.json());
      } else {
        setSelectedOrder(order);
      }
    } catch {
      setSelectedOrder(order);
    }
  };

  // ── Counts ──────────────────────────────────────────────────────────────────
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            {filterStatus || filterOrigin || filterSearch ? " (filtrado)" : ""}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Pedido
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(counts).map(([status, count]) => {
          const info = getStatusInfo(status);
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? "" : status)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${info.bg} ${info.color} ${filterStatus === status ? "ring-2 ring-offset-1 ring-indigo-400" : ""}`}
            >
              {info.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por cliente, telefone ou produto..."
          className="flex-1 h-10 px-4 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
        />
        <select
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).slice(0, 8).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
          value={filterOrigin}
          onChange={(e) => setFilterOrigin(e.target.value)}
        >
          <option value="">Todas as origens</option>
          {Object.entries(ORIGIN_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {(filterStatus || filterOrigin || filterSearch) && (
          <button
            onClick={() => { setFilterStatus(""); setFilterOrigin(""); setFilterSearch(""); }}
            className="h-10 px-4 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-5 py-3.5">Data</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Produto / Itens</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Origem</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Carregando pedidos...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">⚠️</span></div>
                    <p className="text-sm font-medium text-gray-500">Erro ao carregar pedidos</p>
                    <button onClick={fetchOrders} className="mt-3 px-4 py-2 text-xs font-semibold bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors">
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-2xl">🛍️</span></div>
                    <p className="text-sm font-medium text-gray-500">Nenhum pedido encontrado</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {filterStatus || filterOrigin || filterSearch ? "Tente ajustar os filtros" : "Crie o primeiro pedido ou receba via checkout"}
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openDetail(order)}>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900 text-sm">{order.customerName || "Cliente"}</div>
                        <div className="text-xs text-gray-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        {order.items && order.items.length > 0 ? (
                          <div>
                            <div className="text-sm text-gray-700">{order.items[0].name}</div>
                            {order.items.length > 1 && (
                              <div className="text-xs text-gray-400">+{order.items.length - 1} item(ns)</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-700">{order.product || "—"}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {formatCurrency(order.price)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500">{ORIGIN_LABELS[order.origin] ?? order.origin ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          {(STATUS_ACTIONS[order.status] ?? []).slice(0, 1).map((action) => (
                            <button
                              key={action.target}
                              onClick={() => updateStatus(order.id, action.target)}
                              disabled={actionLoading}
                              className={`px-2.5 py-1 text-xs font-medium text-white rounded-lg ${action.color} disabled:opacity-50 transition-all`}
                              title={action.label}
                            >
                              {action.label}
                            </button>
                          ))}
                          {!["cancelled", "refunded", "completed", "failed"].includes(order.status) && (
                            <button
                              onClick={() => setCancelModal(order.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Cancelar"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Detail Drawer ──────────────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div
            className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">Detalhes do Pedido</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status badge + actions */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusInfo(selectedOrder.status).bg} ${getStatusInfo(selectedOrder.status).color}`}>
                  {getStatusInfo(selectedOrder.status).label}
                </span>
                <span className="text-xs text-gray-400">#{selectedOrder.id.slice(0, 8)}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {(STATUS_ACTIONS[selectedOrder.status] ?? []).map((action) => (
                  <button
                    key={action.target}
                    onClick={() => updateStatus(selectedOrder.id, action.target)}
                    disabled={actionLoading}
                    className={`px-4 py-2 text-sm font-semibold text-white rounded-xl ${action.color} disabled:opacity-50 transition-all`}
                  >
                    {action.label}
                  </button>
                ))}
                {!["cancelled", "refunded"].includes(selectedOrder.status) && ["paid", "completed"].includes(selectedOrder.status) && (
                  <button
                    onClick={() => handleRefund(selectedOrder.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-semibold text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 disabled:opacity-50 transition-all"
                  >
                    Reembolsar
                  </button>
                )}
                {!["cancelled", "refunded", "completed", "failed"].includes(selectedOrder.status) && (
                  <button
                    onClick={() => setCancelModal(selectedOrder.id)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {/* Customer info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</h3>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{selectedOrder.customerName || "Sem nome"}</div>
                  <div className="text-gray-500">{selectedOrder.customerPhone}</div>
                </div>
                {selectedOrder.origin && (
                  <div className="text-xs text-gray-400">Origem: {ORIGIN_LABELS[selectedOrder.origin] ?? selectedOrder.origin}</div>
                )}
                {selectedOrder.conversationId && (
                  <a href={`/dashboard/conversations?id=${selectedOrder.conversationId}`} className="text-xs text-indigo-600 hover:underline">
                    Ver conversa
                  </a>
                )}
              </div>

              {/* Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Itens</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.quantity}x {formatCurrency(item.unitPrice)}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                    {selectedOrder.discount > 0 && (
                      <div className="text-xs text-gray-500">Desconto: -{formatCurrency(selectedOrder.discount)}</div>
                    )}
                    <div className="text-sm font-bold text-gray-900 ml-auto">Total: {formatCurrency(selectedOrder.price)}</div>
                  </div>
                </div>
              )}

              {/* Payment ref */}
              {selectedOrder.externalPaymentRef && (
                <div className="text-xs text-gray-400">
                  Ref. pagamento: <span className="font-mono">{selectedOrder.externalPaymentRef.slice(0, 20)}...</span>
                </div>
              )}

              {/* Cancel reason */}
              {selectedOrder.cancelReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="text-xs font-semibold text-red-600">Motivo do cancelamento</div>
                  <div className="text-sm text-red-700 mt-1">{selectedOrder.cancelReason}</div>
                </div>
              )}

              {/* Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Timeline</h3>
                  <div className="relative pl-4 space-y-3">
                    <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200" />
                    {selectedOrder.statusHistory.map((entry, i) => (
                      <div key={entry.id} className="relative flex items-start gap-3">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 mt-0.5 shrink-0 -ml-[7.5px] ${i === selectedOrder.statusHistory!.length - 1 ? "bg-indigo-500 border-indigo-500" : "bg-white border-gray-300"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700">
                            {entry.fromStatus ? (
                              <>{getStatusInfo(entry.fromStatus).label} → <span className="font-semibold">{getStatusInfo(entry.toStatus).label}</span></>
                            ) : (
                              <span className="font-semibold">Pedido criado ({getStatusInfo(entry.toStatus).label})</span>
                            )}
                          </div>
                          {entry.reason && <div className="text-xs text-gray-500 mt-0.5">{entry.reason}</div>}
                          <div className="text-xs text-gray-400 mt-0.5">{formatDate(entry.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notas Internas</h3>
                {selectedOrder.notes && (
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap mb-3 max-h-40 overflow-y-auto">
                    {selectedOrder.notes}
                  </pre>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nota..."
                    className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddNote(selectedOrder.id)}
                  />
                  <button
                    onClick={() => handleAddNote(selectedOrder.id)}
                    disabled={!noteText.trim()}
                    className="px-3 h-9 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 disabled:opacity-50 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
                <div>Criado: {formatDate(selectedOrder.createdAt)}</div>
                {selectedOrder.paidAt && <div>Pago: {formatDate(selectedOrder.paidAt)}</div>}
                {selectedOrder.completedAt && <div>Concluído: {formatDate(selectedOrder.completedAt)}</div>}
                {selectedOrder.cancelledAt && <div>Cancelado: {formatDate(selectedOrder.cancelledAt)}</div>}
                {selectedOrder.refundedAt && <div>Reembolsado: {formatDate(selectedOrder.refundedAt)}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ───────────────────────────────────────────────────── */}
      {cancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setCancelModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar Pedido</h3>
            <p className="text-sm text-gray-500 mb-4">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
              <input
                type="text"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-200 outline-none"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Cliente desistiu"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setCancelModal(null); setCancelReason(""); }}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? "Cancelando..." : "Confirmar Cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Form Dialog ──────────────────────────────────────────────── */}
      <OrderFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchOrders}
        tenantId={user?.tenantId || ""}
      />
    </div>
  );
}
