"use client";

import { useState, useEffect } from "react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { planAtLeast } from "@/lib/config/plans";
import UpgradeGate from "@/components/UpgradeGate";

interface Service { id: string; name: string; }
interface Professional {
  id: string;
  name: string;
  active: boolean;
  openingHours: string | null;
  closedWeekdays: string;
  services: Array<{ service: Service }>;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ProfessionalsPage() {
  const ent = useEntitlements();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', openingHours: '', closedWeekdays: [] as number[] });
  const [serviceAssigning, setServiceAssigning] = useState<Professional | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);

  const token = () => localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";

  const load = async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      fetch('/api/professionals', { headers: { Authorization: `Bearer ${token()}` } }),
      fetch('/api/services', { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    if (pRes.ok) setProfessionals(await pRes.json());
    if (sRes.ok) setServices(await sRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (!ent.loading && !planAtLeast(ent.plan, 'standard')) {
    return <UpgradeGate icon="👤" title="Gestão de Profissionais" message="Profissionais disponíveis a partir do plano Standard." ctaPlan="Standard" />;
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', openingHours: '', closedWeekdays: [] });
    setIsModalOpen(true);
  };

  const openEdit = (p: Professional) => {
    setEditing(p);
    setForm({
      name: p.name,
      openingHours: p.openingHours ?? '',
      closedWeekdays: p.closedWeekdays ? p.closedWeekdays.split(',').map(Number).filter(n => !isNaN(n)) : [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name,
      openingHours: form.openingHours || null,
      closedWeekdays: form.closedWeekdays.join(','),
    };
    const url = editing ? `/api/professionals/${editing.id}` : '/api/professionals';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { setIsModalOpen(false); load(); }
  };

  const toggleActive = async (p: Professional) => {
    await fetch(`/api/professionals/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir profissional?')) return;
    await fetch(`/api/professionals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  };

  const openAssign = (p: Professional) => {
    setServiceAssigning(p);
    setAssignedIds(p.services.map(ps => ps.service.id));
  };

  const saveAssign = async () => {
    if (!serviceAssigning) return;
    await fetch(`/api/professionals/${serviceAssigning.id}/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ serviceIds: assignedIds }),
    });
    setServiceAssigning(null);
    load();
  };

  const toggleWeekday = (day: number) => {
    setForm(f => ({
      ...f,
      closedWeekdays: f.closedWeekdays.includes(day)
        ? f.closedWeekdays.filter(d => d !== day)
        : [...f.closedWeekdays, day],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie a equipe e vincule serviços a cada profissional</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Profissional
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
        </div>
      ) : professionals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-sm font-medium text-gray-500">Nenhum profissional cadastrado</p>
          <p className="text-xs text-gray-400 mt-1">Adicione profissionais para vincular a serviços e filtrar a agenda</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left">Nome</th>
                <th className="px-6 py-4 text-left">Horário</th>
                <th className="px-6 py-4 text-left">Serviços</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {professionals.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{p.openingHours ?? 'Padrão do negócio'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {p.services.length === 0 ? (
                        <span className="text-xs text-gray-400">Nenhum</span>
                      ) : p.services.map(ps => (
                        <span key={ps.service.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                          {ps.service.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${p.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                    >
                      {p.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openAssign(p)} className="text-xs text-indigo-600 hover:underline">Serviços</button>
                      <button onClick={() => openEdit(p)} className="text-xs text-gray-500 hover:text-gray-800">Editar</button>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editing ? 'Editar Profissional' : 'Novo Profissional'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text" required
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] outline-none text-sm"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Ana Paula"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário de atendimento <span className="text-gray-400 font-normal">(opcional — usa o padrão do negócio se vazio)</span></label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#4f46e5] outline-none text-sm"
                  value={form.openingHours}
                  onChange={e => setForm({ ...form, openingHours: e.target.value })}
                  placeholder="Ex: 09:00 - 17:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dias de folga</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day, i) => (
                    <button
                      key={i} type="button"
                      onClick={() => toggleWeekday(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.closedWeekdays.includes(i)
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service assignment modal */}
      {serviceAssigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Serviços de {serviceAssigning.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Selecione os serviços que este profissional realiza</p>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {services.map(s => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded"
                    checked={assignedIds.includes(s.id)}
                    onChange={e => setAssignedIds(ids => e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id))}
                  />
                  <span className="text-sm text-gray-700">{s.name}</span>
                </label>
              ))}
              {services.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum serviço cadastrado</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setServiceAssigning(null)} className="flex-1 h-10 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={saveAssign} className="flex-1 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca]">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
