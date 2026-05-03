"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["NEW", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COMPLETED", "CANCELED"];
const STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  CONFIRMED: "Confirmado",
  PREPARING: "Preparando",
  READY_FOR_PICKUP: "Pronto p/ Retirada",
  OUT_FOR_DELIVERY: "Em Entrega",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  PREPARING: "bg-yellow-100 text-yellow-700",
  READY_FOR_PICKUP: "bg-orange-100 text-orange-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELED: "bg-red-100 text-red-700",
};

type OrderItem = { id: string; quantity: number; unitPrice: number; subtotal: number; notes: string | null; product: { name: string } | null; addonOptions?: { name: string; priceDelta: number }[] };
type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: string;
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  status: string;
  source: string;
  createdAt: string;
  items?: OrderItem[];
};

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; }
async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) } });
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RestaurantOrders() {
  const [list, setList] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await apiFetch(`/restaurant/orders?${params}`);
    const data = await res.json();
    setList(data.data ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const openDetail = async (o: Order) => {
    setMsg(null);
    setNewStatus(o.status);
    const res = await apiFetch(`/restaurant/orders/${o.id}`);
    const data = await res.json();
    setSelected(data);
  };

  const handleUpdateStatus = async () => {
    if (!selected) return;
    setSaving(true); setMsg(null);
    const res = await apiFetch(`/restaurant/orders/${selected.id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erro." }); return; }
    setMsg({ type: "ok", text: "Status atualizado!" });
    setSelected(null);
    load();
  };

  const fulfillmentLabel = (t: string) => t === "DELIVERY" ? "Delivery" : t === "PICKUP" ? "Retirada" : t;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="text-sm text-gray-500">{total} pedido(s)</span>
      </div>

      {loading ? (
        <div className="animate-pulse h-48 bg-gray-100 rounded-xl" />
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          <p className="text-3xl mb-2">📬</p>
          Nenhum pedido encontrado.<br />
          <span className="text-xs">Os pedidos aparecerão aqui quando a página pública estiver ativa.</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {list.map(o => (
            <div key={o.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{o.customerName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>{STATUS_LABELS[o.status] ?? o.status}</span>
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                  {o.customerPhone && <span>📱 {o.customerPhone}</span>}
                  <span>🛵 {fulfillmentLabel(o.fulfillmentType)}</span>
                  <span>{fmt(o.total)}</span>
                  <span>{new Date(o.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <button onClick={() => openDetail(o)} className="text-xs text-orange-600 hover:underline shrink-0">Detalhes</button>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors">← Anterior</button>
          <span className="text-sm text-gray-500">Página {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors">Próxima →</button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-gray-900">Pedido de {selected.customerName}</h3>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[selected.status] ?? "bg-gray-100 text-gray-600"}`}>{STATUS_LABELS[selected.status] ?? selected.status}</span>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              {selected.customerPhone && <p>📱 {selected.customerPhone}</p>}
              <p>🛵 {fulfillmentLabel(selected.fulfillmentType)}</p>
              <p>📅 {new Date(selected.createdAt).toLocaleString("pt-BR")}</p>
            </div>

            {selected.items && selected.items.length > 0 && (
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {selected.items.map(item => (
                  <div key={item.id} className="p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">{item.quantity}× {item.product?.name ?? "Produto"}</span>
                      <span className="text-gray-600">{fmt(item.subtotal)}</span>
                    </div>
                    {item.addonOptions && item.addonOptions.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.addonOptions.map(a => a.name).join(", ")}</p>
                    )}
                    {item.notes && <p className="text-xs text-gray-400 mt-0.5 italic">Obs: {item.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
              {selected.deliveryFee !== null && selected.deliveryFee !== undefined && (
                <div className="flex justify-between text-gray-600"><span>Taxa de entrega</span><span>{fmt(selected.deliveryFee)}</span></div>
              )}
              <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{fmt(selected.total)}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Atualizar status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            {msg && <div className={`rounded-xl p-3 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}

            <div className="flex gap-3">
              <button onClick={handleUpdateStatus} disabled={saving} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">{saving ? "Salvando..." : "Atualizar status"}</button>
              <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
