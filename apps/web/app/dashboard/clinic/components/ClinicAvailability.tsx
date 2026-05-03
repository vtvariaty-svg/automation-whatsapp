"use client";

import { useEffect, useState } from "react";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type Prof = { id: string; name: string };
type Slot = { id: string; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean; professional?: { id: string; name: string } | null };
type Form = { dayOfWeek: string; startTime: string; endTime: string; professionalId: string };
const EMPTY: Form = { dayOfWeek: "1", startTime: "08:00", endTime: "18:00", professionalId: "" };

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; }
async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) } });
}

export default function ClinicAvailability() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [profs, setProfs] = useState<Prof[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, p] = await Promise.all([apiFetch("/clinic/availability").then(r => r.json()), apiFetch("/clinic/professionals").then(r => r.json())]);
    setSlots(Array.isArray(s) ? s : []);
    setProfs(Array.isArray(p) ? p.filter((x: Prof & { isActive?: boolean }) => x.isActive !== false) : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      const payload = { dayOfWeek: Number(form.dayOfWeek), startTime: form.startTime, endTime: form.endTime, professionalId: form.professionalId || undefined };
      const res = await apiFetch(editing ? `/clinic/availability/${editing}` : "/clinic/availability", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setMsg({ type: "err", text: d.error ?? "Erro." }); return; }
      setForm(EMPTY); setEditing(null); setMsg({ type: "ok", text: "Salvo!" }); load();
    } catch { setMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSaving(false); }
  };

  const handleEdit = (s: Slot) => { setEditing(s.id); setForm({ dayOfWeek: s.dayOfWeek.toString(), startTime: s.startTime, endTime: s.endTime, professionalId: s.professional?.id ?? "" }); setMsg(null); };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este slot?")) return;
    await apiFetch(`/clinic/availability/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">{editing ? "Editar horário" : "Novo horário de atendimento"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia da semana</label>
            <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profissional (opcional)</label>
            <select name="professionalId" value={form.professionalId} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos</option>
              {profs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início (HH:MM)</label>
            <input name="startTime" type="time" value={form.startTime} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fim (HH:MM)</label>
            <input name="endTime" type="time" value={form.endTime} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {msg && <div className={`rounded-xl p-3 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">{saving ? "Salvando..." : editing ? "Atualizar" : "Adicionar"}</button>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY); setMsg(null); }} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancelar</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {slots.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum horário cadastrado ainda.</div>
        ) : slots.map(s => (
          <div key={s.id} className={`flex items-center gap-4 p-4 ${!s.isActive ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{DAYS[s.dayOfWeek]} — {s.startTime} às {s.endTime}</p>
              {s.professional && <p className="text-xs text-gray-500">{s.professional.name}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(s)} className="text-xs text-indigo-600 hover:underline">Editar</button>
              <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
