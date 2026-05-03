"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string };
type Product = { id: string; categoryId: string; name: string; description: string | null; price: number; imageUrl: string | null; isActive: boolean; isAvailable: boolean; sortOrder: number; category: { id: string; name: string } };
type Form = { categoryId: string; name: string; description: string; price: string; imageUrl: string; isAvailable: boolean; sortOrder: string };

const EMPTY: Form = { categoryId: "", name: "", description: "", price: "", imageUrl: "", isAvailable: true, sortOrder: "0" };

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; }
async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) } });
}

export function RestaurantProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [pRes, cRes] = await Promise.all([apiFetch("/restaurant/products"), apiFetch("/restaurant/categories")]);
    const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
    setProducts(pData);
    setCategories(cData);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSave = async () => {
    if (!form.name) { setMsg({ type: "err", text: "Nome é obrigatório." }); return; }
    if (form.price === "" || Number(form.price) < 0) { setMsg({ type: "err", text: "Preço inválido." }); return; }
    setSaving(true); setMsg(null);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        sortOrder: Number(form.sortOrder),
        imageUrl: form.imageUrl || undefined,
        categoryId: form.categoryId || undefined,
      };
      const res = await apiFetch(editing ? `/restaurant/products/${editing}` : "/restaurant/products", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setMsg({ type: "err", text: d.error ?? "Erro." }); return; }
      setForm(EMPTY); setEditing(null); setMsg({ type: "ok", text: "Salvo!" }); load();
    } catch { setMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Product) => {
    setEditing(p.id);
    setForm({ categoryId: p.categoryId, name: p.name, description: p.description ?? "", price: p.price.toString(), imageUrl: p.imageUrl ?? "", isAvailable: p.isAvailable, sortOrder: p.sortOrder.toString() });
    setMsg(null);
  };

  const handleToggle = async (p: Product) => {
    await apiFetch(`/restaurant/products/${p.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !p.isActive }) });
    load();
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">{editing ? "Editar produto" : "Novo produto"}</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">Sem categoria</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ex: Pizza Margherita" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
            <input name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="isAvailable" checked={form.isAvailable} onChange={handleChange} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              Disponível
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL da imagem</label>
          <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="https://..." />
          <p className="text-xs text-gray-400 mt-1">Cole uma URL de imagem. Upload de arquivos não está disponível nesta fase.</p>
        </div>
        {msg && <div className={`rounded-xl p-3 text-sm font-medium ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">{saving ? "Salvando..." : editing ? "Atualizar" : "Adicionar"}</button>
          {editing && <button onClick={() => { setEditing(null); setForm(EMPTY); setMsg(null); }} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancelar</button>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum produto cadastrado ainda.</div>
        ) : products.map(p => (
          <div key={p.id} className={`flex items-center gap-4 p-4 ${!p.isActive ? "opacity-50" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                {!p.isAvailable && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Indisponível</span>}
              </div>
              {p.description && <p className="text-xs text-gray-500 truncate">{p.description}</p>}
              <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                <span>{fmt(p.price)}</span>
                {p.category && <span>📂 {p.category.name}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(p)} className="text-xs text-orange-600 hover:underline">Editar</button>
              <button onClick={() => handleToggle(p)} className="text-xs text-gray-500 hover:underline">{p.isActive ? "Desativar" : "Ativar"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
