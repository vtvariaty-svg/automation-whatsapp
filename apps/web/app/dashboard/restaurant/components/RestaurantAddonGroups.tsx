"use client";

import { useEffect, useState } from "react";

type Product = { id: string; name: string };
type AddonGroup = { id: string; productId: string | null; name: string; minSelect: number; maxSelect: number; isRequired: boolean; isActive: boolean; sortOrder: number };
type AddonOption = { id: string; addonGroupId: string; name: string; priceDelta: number; isActive: boolean; sortOrder: number };

type GroupForm = { productId: string; name: string; minSelect: string; maxSelect: string; isRequired: boolean; sortOrder: string };
type OptionForm = { name: string; priceDelta: string; sortOrder: string };

const EMPTY_GROUP: GroupForm = { productId: "", name: "", minSelect: "0", maxSelect: "1", isRequired: false, sortOrder: "0" };
const EMPTY_OPT: OptionForm = { name: "", priceDelta: "0", sortOrder: "0" };

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("auth_token") : null; }
async function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`/api${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) } });
}

export function RestaurantAddonGroups() {
  const [groups, setGroups] = useState<AddonGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupForm, setGroupForm] = useState<GroupForm>(EMPTY_GROUP);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupMsg, setGroupMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [savingGroup, setSavingGroup] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [options, setOptions] = useState<AddonOption[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [optForm, setOptForm] = useState<OptionForm>(EMPTY_OPT);
  const [editingOpt, setEditingOpt] = useState<string | null>(null);
  const [optMsg, setOptMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [savingOpt, setSavingOpt] = useState(false);

  const loadGroups = async () => {
    const [gRes, pRes] = await Promise.all([apiFetch("/restaurant/addon-groups"), apiFetch("/restaurant/products")]);
    const [gData, pData] = await Promise.all([gRes.json(), pRes.json()]);
    setGroups(gData);
    setProducts(pData);
    setLoading(false);
  };
  useEffect(() => { loadGroups(); }, []);

  const loadOptions = async (groupId: string) => {
    setLoadingOpts(true);
    const res = await apiFetch(`/restaurant/addon-options?addonGroupId=${groupId}`);
    const data = await res.json();
    setOptions(data);
    setLoadingOpts(false);
  };

  const handleSelectGroup = (g: AddonGroup) => {
    setSelectedGroupId(g.id);
    setEditingOpt(null);
    setOptForm(EMPTY_OPT);
    setOptMsg(null);
    loadOptions(g.id);
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setGroupForm(f => ({ ...f, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name) { setGroupMsg({ type: "err", text: "Nome é obrigatório." }); return; }
    const min = Number(groupForm.minSelect);
    const max = Number(groupForm.maxSelect);
    if (min < 0 || max < min) { setGroupMsg({ type: "err", text: "minSelect >= 0 e maxSelect >= minSelect." }); return; }
    setSavingGroup(true); setGroupMsg(null);
    try {
      const payload = { ...groupForm, productId: groupForm.productId || undefined, minSelect: min, maxSelect: max, sortOrder: Number(groupForm.sortOrder) };
      const res = await apiFetch(editingGroup ? `/restaurant/addon-groups/${editingGroup}` : "/restaurant/addon-groups", { method: editingGroup ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setGroupMsg({ type: "err", text: d.error ?? "Erro." }); return; }
      setGroupForm(EMPTY_GROUP); setEditingGroup(null); setGroupMsg({ type: "ok", text: "Salvo!" }); loadGroups();
    } catch { setGroupMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSavingGroup(false); }
  };

  const handleEditGroup = (g: AddonGroup) => {
    setEditingGroup(g.id);
    setGroupForm({ productId: g.productId ?? "", name: g.name, minSelect: g.minSelect.toString(), maxSelect: g.maxSelect.toString(), isRequired: g.isRequired, sortOrder: g.sortOrder.toString() });
    setGroupMsg(null);
  };

  const handleToggleGroup = async (g: AddonGroup) => {
    await apiFetch(`/restaurant/addon-groups/${g.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !g.isActive }) });
    loadGroups();
  };

  const handleOptChange = (e: React.ChangeEvent<HTMLInputElement>) => setOptForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSaveOpt = async () => {
    if (!selectedGroupId) return;
    if (!optForm.name) { setOptMsg({ type: "err", text: "Nome é obrigatório." }); return; }
    if (Number(optForm.priceDelta) < 0) { setOptMsg({ type: "err", text: "priceDelta deve ser >= 0." }); return; }
    setSavingOpt(true); setOptMsg(null);
    try {
      const payload = { addonGroupId: selectedGroupId, name: optForm.name, priceDelta: Number(optForm.priceDelta), sortOrder: Number(optForm.sortOrder) };
      const res = await apiFetch(editingOpt ? `/restaurant/addon-options/${editingOpt}` : "/restaurant/addon-options", { method: editingOpt ? "PATCH" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setOptMsg({ type: "err", text: d.error ?? "Erro." }); return; }
      setOptForm(EMPTY_OPT); setEditingOpt(null); setOptMsg({ type: "ok", text: "Salvo!" }); loadOptions(selectedGroupId);
    } catch { setOptMsg({ type: "err", text: "Erro de rede." }); }
    finally { setSavingOpt(false); }
  };

  const handleEditOpt = (o: AddonOption) => {
    setEditingOpt(o.id);
    setOptForm({ name: o.name, priceDelta: o.priceDelta.toString(), sortOrder: o.sortOrder.toString() });
    setOptMsg(null);
  };

  const handleToggleOpt = async (o: AddonOption) => {
    if (!selectedGroupId) return;
    await apiFetch(`/restaurant/addon-options/${o.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !o.isActive }) });
    loadOptions(selectedGroupId);
  };

  const fmt = (v: number) => v > 0 ? `+${v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Grátis";
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Groups section */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-gray-900">{editingGroup ? "Editar grupo de adicionais" : "Novo grupo de adicionais"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input name="name" value={groupForm.name} onChange={handleGroupChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ex: Tamanho, Bordas, Adicionais" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto (opcional)</label>
              <select name="productId" value={groupForm.productId} onChange={handleGroupChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Global (todos os produtos)</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mín. seleções</label>
              <input name="minSelect" type="number" min="0" value={groupForm.minSelect} onChange={handleGroupChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máx. seleções</label>
              <input name="maxSelect" type="number" min="0" value={groupForm.maxSelect} onChange={handleGroupChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input name="sortOrder" type="number" value={groupForm.sortOrder} onChange={handleGroupChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="isRequired" checked={groupForm.isRequired} onChange={handleGroupChange} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
            Obrigatório
          </label>
          {groupMsg && <div className={`rounded-xl p-3 text-sm font-medium ${groupMsg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{groupMsg.text}</div>}
          <div className="flex gap-3">
            <button onClick={handleSaveGroup} disabled={savingGroup} className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">{savingGroup ? "Salvando..." : editingGroup ? "Atualizar" : "Adicionar"}</button>
            {editingGroup && <button onClick={() => { setEditingGroup(null); setGroupForm(EMPTY_GROUP); setGroupMsg(null); }} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancelar</button>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {groups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhum grupo cadastrado ainda.</div>
          ) : groups.map(g => (
            <div key={g.id} className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-orange-50/40 transition-colors ${!g.isActive ? "opacity-50" : ""} ${selectedGroupId === g.id ? "bg-orange-50 border-l-2 border-orange-500" : ""}`} onClick={() => handleSelectGroup(g)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 text-sm">{g.name}</p>
                  {g.isRequired && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Obrigatório</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Selecionar {g.minSelect}–{g.maxSelect} opções</p>
              </div>
              <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleEditGroup(g)} className="text-xs text-orange-600 hover:underline">Editar</button>
                <button onClick={() => handleToggleGroup(g)} className="text-xs text-gray-500 hover:underline">{g.isActive ? "Desativar" : "Ativar"}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Options section */}
      {selectedGroup && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800">Opções: <span className="text-orange-600">{selectedGroup.name}</span></h3>
            <button onClick={() => setSelectedGroupId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ Fechar</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h4 className="font-semibold text-gray-700 text-sm">{editingOpt ? "Editar opção" : "Nova opção"}</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input name="name" value={optForm.name} onChange={handleOptChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ex: Grande, Extra queijo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acréscimo (R$)</label>
                <input name="priceDelta" type="number" min="0" step="0.01" value={optForm.priceDelta} onChange={handleOptChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
              <input name="sortOrder" type="number" value={optForm.sortOrder} onChange={handleOptChange} className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            {optMsg && <div className={`rounded-xl p-3 text-sm font-medium ${optMsg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{optMsg.text}</div>}
            <div className="flex gap-3">
              <button onClick={handleSaveOpt} disabled={savingOpt} className="px-5 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">{savingOpt ? "Salvando..." : editingOpt ? "Atualizar" : "Adicionar"}</button>
              {editingOpt && <button onClick={() => { setEditingOpt(null); setOptForm(EMPTY_OPT); setOptMsg(null); }} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Cancelar</button>}
            </div>
          </div>

          {loadingOpts ? (
            <div className="animate-pulse h-24 bg-gray-100 rounded-xl" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {options.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">Nenhuma opção cadastrada para este grupo.</div>
              ) : options.map(o => (
                <div key={o.id} className={`flex items-center gap-4 p-4 ${!o.isActive ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{o.name}</p>
                    <p className="text-xs text-gray-400">{fmt(o.priceDelta)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleEditOpt(o)} className="text-xs text-orange-600 hover:underline">Editar</button>
                    <button onClick={() => handleToggleOpt(o)} className="text-xs text-gray-500 hover:underline">{o.isActive ? "Desativar" : "Ativar"}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedGroupId && groups.length > 0 && (
        <p className="text-sm text-gray-400 text-center">Clique em um grupo acima para gerenciar suas opções.</p>
      )}
    </div>
  );
}
