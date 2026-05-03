"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "SCHEDULED", "CANCELED", "ARCHIVED"];
const STATUS_LABELS: Record<string, string> = { NEW: "Novo", CONTACTED: "Contactado", SCHEDULED: "Agendado", CANCELED: "Cancelado", ARCHIVED: "Arquivado" };
const STATUS_COLORS: Record<string, string> = { NEW: "bg-blue-100 text-blue-700", CONTACTED: "bg-yellow-100 text-yellow-700", SCHEDULED: "bg-emerald-100 text-emerald-700", CANCELED: "bg-red-100 text-red-700", ARCHIVED: "bg-gray-100 text-gray-600" };

type Request = { id: string; customerName: string; customerPhone: string | null; customerEmail: string | null; preferredDate: string | null; preferredTime: string | null; status: string; notes: string | null; createdAt: string; service?: { name: string } | null; professional?: { name: string } | null };

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; }
async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) } });
}

export default function ClinicAppointments() {
  const [list, setList] = useState<Request[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Request | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await apiFetch(`/clinic/appointment-requests?${params}`);
    const data = await res.json();
    setList(data.data ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, page]);

  const openDetail = (r: Request) => { setSelected(r); setNewStatus(r.status); setNotes(r.notes ?? ""); setMsg(null); };

  const handleUpdateStatus = async () => {
    if (!selected) return;
    setSaving(true); setMsg(null);
    const res = await apiFetch(`/clinic/appointment-requests/${selected.id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus, notes }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erro." }); return; }
    setMsg({ type: "ok", text: "Atualizado!" });
    setSelected(null);
    load();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="text-sm text-gray-500">{total} solicitação(ões)</span>
      </div>

      {loading ? (
        <div className="animate-pulse h-48 bg-gray-100 rounded-xl" />
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          <p className="text-3xl mb-2">📬</p>
          Nenhuma solicitação de agendamento ainda.<br />
          <span className="text-xs">As solicitações aparecerão aqui quando a página pública estiver ativa.</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {list.map(r => (
            <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{r.customerName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>{STATUS_LABELS[r.status] ?? r.status}</span>
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                  {r.customerPhone && <span>📱 {r.customerPhone}</span>}
                  {r.preferredDate && <span>📅 {r.preferredDate}{r.preferredTime ? ` às ${r.preferredTime}` : ""}</span>}
                  {r.service && <span>🩺 {r.service.name}</span>}
                </div>
              </div>
              <button onClick={() => openDetail(r)} className="text-xs text-indigo-600 hover:underline shrink-0">Detalhes</button>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900">Solicitação de {selected.customerName}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              {selected.customerPhone && <p>📱 {selected.customerPhone}</p>}
              {selected.customerEmail && <p>✉️ {selected.customerEmail}</p>}
              {selected.preferredDate && <p>📅 {selected.preferredDate}{selected.preferredTime ? ` às ${selected.preferredTime}` : ""}</p>}
              {selected.service && <p>🩺 {selected.service.name}</p>}
              {selected.professional && <p>👤 {selected.professional.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas administrativas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Ex: Confirmado por telefone. Não inclua dados clínicos." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              <p className="text-xs text-amber-600 mt-1">⚠️ Este campo é apenas para notas de atendimento. Não registre diagnósticos ou dados de saúde.</p>
            </div>
            {msg && <div className={`rounded-xl p-3 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
            <div className="flex gap-3">
              <button onClick={handleUpdateStatus} disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? "Salvando..." : "Atualizar"}</button>
              <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
