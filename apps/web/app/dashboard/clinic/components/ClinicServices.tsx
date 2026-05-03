"use client";

import { useEffect, useState } from "react";

type Service = { id: string; name: string; description: string | null; durationMinutes: number | null; priceDescription: string | null; isActive: boolean; sortOrder: number };
type Form = { name: string; description: string; durationMinutes: string; priceDescription: string; sortOrder: string };

const EMPTY: Form = { name: "", description: "", durationMinutes: "", priceDescription: "", sortOrder: "0" };

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; }
async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) } });
}

export default function ClinicServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => apiFetch("/clinic/services").then(r => r.json()).then(setServices).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name) { setMsg({ type: "err", text: "Nome é obrigatório." }); return; }
    setSaving(true); setMsg(null);
    try {
      const payload = { ...form, durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined, sortOrder: Number(form.sortOrder) };
      const res = await apiFetch(editing ? `/clinic/services/${editing}` : "/clinic/services", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setMsg({ type: "err", text: d.error ?? "Erro." }); return; }
      setForm(EMPTY); setEditing(null); setMsg({ type: "ok", text: "Salvo!" }); load();
    } catch { setMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSaving(false); }
  };

  const handleEdit = (s: Service) => {
    setEditing(s.id);
    setForm({ name: s.name, description: s.description ?? "", durationMinutes: s.durationMinutes?.toString() ?? "", priceDescription: s.priceDescription ?? "", sortOrder: s.sortOrder.toString() });
    setMsg(null);
  };

  const handleToggle = async (s: Service) => {
    await apiFetch(`/clinic/services/${s.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !s.isActive }) });
    load();
  };

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">{editing ? "Editar serviço" : "Novo serviço/procedimento"}</h2>
        <p className="text-xs text-gray-400">Descreva o serviço em sentido comercial/administrativo. Não inclua detalhes clínicos sensíveis.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Consulta inicial" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duração (min)</label>
            <input name="durationMinutes" type="number" value={form.durationMinutes} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="30" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (descrição)</label>
            <input name="priceDescription" value={form.priceDescription} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="A partir de R$ 150" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
            <input name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {msg && <div className={`rounded-xl p-3 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? "Salvando..." : editing ? "Atualizar" : "Adicionar"}</button>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY); setMsg(null); }} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancelar</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {services.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum serviço cadastrado ainda.</div>
        ) : services.map(s => (
          <div key={s.id} className={`flex items-center gap-4 p-4 ${!s.isActive ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{s.name}</p>
              {s.description && <p className="text-xs text-gray-500 truncate">{s.description}</p>}
              <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                {s.durationMinutes && <span>⏱ {s.durationMinutes} min</span>}
                {s.priceDescription && <span>💰 {s.priceDescription}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(s)} className="text-xs text-indigo-600 hover:underline">Editar</button>
              <button onClick={() => handleToggle(s)} className="text-xs text-gray-500 hover:underline">{s.isActive ? "Desativar" : "Ativar"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
