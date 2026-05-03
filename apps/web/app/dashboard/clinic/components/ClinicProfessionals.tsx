"use client";

import { useEffect, useState } from "react";

type Prof = { id: string; name: string; role: string | null; bio: string | null; isActive: boolean; sortOrder: number };
type Form = { name: string; role: string; bio: string; sortOrder: string };
const EMPTY: Form = { name: "", role: "", bio: "", sortOrder: "0" };

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; }
async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) } });
}

export default function ClinicProfessionals() {
  const [list, setList] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => apiFetch("/clinic/professionals").then(r => r.json()).then(setList).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name) { setMsg({ type: "err", text: "Nome é obrigatório." }); return; }
    setSaving(true); setMsg(null);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) };
      const res = await apiFetch(editing ? `/clinic/professionals/${editing}` : "/clinic/professionals", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setMsg({ type: "err", text: d.error ?? "Erro." }); return; }
      setForm(EMPTY); setEditing(null); setMsg({ type: "ok", text: "Salvo!" }); load();
    } catch { setMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Prof) => { setEditing(p.id); setForm({ name: p.name, role: p.role ?? "", bio: p.bio ?? "", sortOrder: p.sortOrder.toString() }); setMsg(null); };
  const handleToggle = async (p: Prof) => { await apiFetch(`/clinic/professionals/${p.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !p.isActive }) }); load(); };

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">{editing ? "Editar profissional" : "Novo profissional"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade / Cargo</label>
            <input name="role" value={form.role} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Cardiologista" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
          <input name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {msg && <div className={`rounded-xl p-3 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? "Salvando..." : editing ? "Atualizar" : "Adicionar"}</button>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY); setMsg(null); }} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancelar</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {list.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum profissional cadastrado ainda.</div>
        ) : list.map(p => (
          <div key={p.id} className={`flex items-center gap-4 p-4 ${!p.isActive ? "opacity-50" : ""}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg shrink-0">👤</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{p.name}</p>
              {p.role && <p className="text-xs text-gray-500">{p.role}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(p)} className="text-xs text-indigo-600 hover:underline">Editar</button>
              <button onClick={() => handleToggle(p)} className="text-xs text-gray-500 hover:underline">{p.isActive ? "Desativar" : "Ativar"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
