'use client';

import { useState, useEffect } from 'react';
import { getFiscalCatalog, saveFiscalCatalogItem, updateFiscalCatalogItem, deleteFiscalCatalogItem } from '@/lib/fiscal/service';
import type { FiscalCatalogItem } from '@/lib/fiscal/types';
import { Modal } from '@/components/ui/Modal';
import FiscalEmptyState from '@/components/fiscal/FiscalEmptyState';

const EMPTY_FORM = {
  nome: '',
  tipo: 'servico' as FiscalCatalogItem['tipo'],
  sku: '',
  preco: '',
  unidade: 'UN',
  ncm: '',
  cnae: '',
  ativo: true,
};

function currency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CatalogoFiscalPage() {
  const [items, setItems] = useState<FiscalCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'produto' | 'servico'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FiscalCatalogItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getFiscalCatalog().then((data) => {
      setItems(data);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(item: FiscalCatalogItem) {
    setEditing(item);
    setForm({
      nome: item.nome,
      tipo: item.tipo,
      sku: item.sku ?? '',
      preco: item.preco.toString(),
      unidade: item.unidade,
      ncm: item.ncm ?? '',
      cnae: item.cnae ?? '',
      ativo: item.ativo,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      nome: form.nome,
      tipo: form.tipo,
      sku: form.sku || undefined,
      preco: Number(form.preco),
      unidade: form.unidade,
      ncm: form.tipo === 'produto' && form.ncm ? form.ncm : undefined,
      cnae: form.tipo === 'servico' && form.cnae ? form.cnae : undefined,
      ativo: form.ativo,
    };
    if (editing) {
      await updateFiscalCatalogItem(editing.id, payload);
    } else {
      await saveFiscalCatalogItem(payload);
    }
    setShowModal(false);
    setLoading(true);
    await load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este item do catálogo?')) return;
    await deleteFiscalCatalogItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function toggleAtivo(item: FiscalCatalogItem) {
    await updateFiscalCatalogItem(item.id, { ativo: !item.ativo });
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i)));
  }

  const filtered = items.filter((i) => {
    if (filterTipo !== 'all' && i.tipo !== filterTipo) return false;
    if (search && !i.nome.toLowerCase().includes(search.toLowerCase()) && !(i.sku ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos e Serviços</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo para uso na emissão fiscal.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          ＋ Novo item
        </button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['all', 'produto', 'servico'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTipo(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterTipo === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'all' ? 'Todos' : t === 'produto' ? '📦 Produtos' : '⚙️ Serviços'}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <FiscalEmptyState
          icon="📦"
          title="Catálogo vazio"
          description="Adicione produtos e serviços para usar na emissão de documentos fiscais."
          cta={{ label: '+ Novo item', onClick: openNew }}
        />
      ) : (
        <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Un.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${!item.ativo ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.tipo === 'servico' ? '⚙️' : '📦'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{item.nome}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${item.tipo === 'servico' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                          {item.tipo === 'servico' ? 'Serviço' : 'Produto'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.sku ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{currency(item.preco)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.unidade}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAtivo(item)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${item.ativo ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                    >
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xs">✏️</button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar item' : 'Novo item'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tipo</label>
            <div className="flex gap-2">
              {(['produto', 'servico'] as const).map((t) => (
                <button key={t} onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.tipo === t ? 'border-[#4f46e5] bg-indigo-50 text-[#4f46e5]' : 'border-gray-200 text-gray-500'}`}>
                  {t === 'produto' ? '📦 Produto' : '⚙️ Serviço'}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: 'Nome', key: 'nome' as const },
            { label: 'SKU / Código interno (opcional)', key: 'sku' as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
              <input value={form[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Preço (R$)</label>
              <input type="number" min={0} step={0.01} value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unidade</label>
              <select value={form.unidade} onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20">
                {['UN', 'HR', 'KG', 'MT', 'LT', 'CX', 'PC'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {form.tipo === 'produto' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">NCM (opcional)</label>
              <input value={form.ncm} onChange={(e) => setForm((f) => ({ ...f, ncm: e.target.value }))}
                placeholder="ex: 8471.30.12"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]" />
            </div>
          )}
          {form.tipo === 'servico' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">CNAE (opcional)</label>
              <input value={form.cnae} onChange={(e) => setForm((f) => ({ ...f, cnae: e.target.value }))}
                placeholder="ex: 6209-1/00"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]" />
            </div>
          )}

          {/* Ativo toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={form.ativo}
            onClick={() => setForm((f) => ({ ...f, ativo: !f.ativo }))}
            className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 pt-1"
          >
            <div className={`w-10 h-5 rounded-full transition-all relative ${form.ativo ? 'bg-[#4f46e5]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.ativo ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Item ativo no catálogo</span>
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={!form.nome || !form.preco || saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50">
            {saving ? <span>Salvando...</span> : <span>Salvar</span>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
