'use client';

import { useState, useEffect } from 'react';
import { getFiscalCustomers, saveFiscalCustomer, updateFiscalCustomer, deleteFiscalCustomer } from '@/lib/fiscal/service';
import type { FiscalCustomer } from '@/lib/fiscal/types';
import { Modal } from '@/components/ui/Modal';
import FiscalEmptyState from '@/components/fiscal/FiscalEmptyState';

const EMPTY_FORM = {
  nome: '',
  documento: '',
  tipo: 'pf' as FiscalCustomer['tipo'],
  email: '',
  telefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
};

export default function ClientesFiscalPage() {
  const [customers, setCustomers] = useState<FiscalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FiscalCustomer | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () =>
    getFiscalCustomers().then((data) => {
      setCustomers(data);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(c: FiscalCustomer) {
    setEditing(c);
    setForm({
      nome: c.nome,
      documento: c.documento,
      tipo: c.tipo,
      email: c.email ?? '',
      telefone: c.telefone ?? '',
      logradouro: c.endereco?.logradouro ?? '',
      numero: c.endereco?.numero ?? '',
      complemento: c.endereco?.complemento ?? '',
      bairro: c.endereco?.bairro ?? '',
      cidade: c.endereco?.cidade ?? '',
      uf: c.endereco?.uf ?? '',
      cep: c.endereco?.cep ?? '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      nome: form.nome,
      documento: form.documento,
      tipo: form.tipo,
      email: form.email || undefined,
      telefone: form.telefone || undefined,
      endereco: form.logradouro
        ? {
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento || undefined,
            bairro: form.bairro,
            cidade: form.cidade,
            uf: form.uf,
            cep: form.cep,
          }
        : undefined,
    };
    if (editing) {
      await updateFiscalCustomer(editing.id, payload);
    } else {
      await saveFiscalCustomer(payload);
    }
    setShowModal(false);
    setLoading(true);
    await load();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este cliente?')) return;
    await deleteFiscalCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = customers.filter(
    (c) =>
      search === '' ||
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.documento.includes(search)
  );

  const field = (label: string, key: keyof typeof form, type = 'text', half = false) => (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Base de clientes para emissão fiscal.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          ＋ Novo cliente
        </button>
      </div>

      {/* Search */}
      {customers.length > 0 && (
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <FiscalEmptyState
          icon="👥"
          title="Nenhum cliente cadastrado"
          description="Adicione clientes para agilizar o processo de emissão fiscal."
          cta={{ label: '+ Novo cliente', onClick: openNew }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200/60 rounded-2xl p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-[#4f46e5]">{c.nome[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{c.nome}</p>
                  <p className="text-xs text-gray-400">{c.documento}</p>
                  {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">✏️</button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">🗑️</button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.tipo === 'pj' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  {c.tipo === 'pj' ? 'PJ' : 'PF'}
                </span>
                <span className="text-[11px] text-gray-400">{c.totalDocumentos} doc{c.totalDocumentos !== 1 ? 's' : ''}</span>
                {c.endereco && <span className="text-[11px] text-gray-400 truncate">{c.endereco.cidade}/{c.endereco.uf}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar cliente' : 'Novo cliente'}>
        <div className="grid grid-cols-2 gap-4">
          {/* Tipo */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tipo de pessoa</label>
            <div className="flex gap-2">
              {(['pf', 'pj'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.tipo === t ? 'border-[#4f46e5] bg-indigo-50 text-[#4f46e5]' : 'border-gray-200 text-gray-500'}`}
                >
                  {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </button>
              ))}
            </div>
          </div>
          {field('Nome / Razão Social', 'nome')}
          {field('CPF / CNPJ', 'documento')}
          {field('E-mail', 'email', 'email')}
          {field('Telefone', 'telefone', 'tel')}
          <div className="col-span-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-400 mb-3">Endereço (opcional)</p>
          </div>
          {field('Logradouro', 'logradouro')}
          {field('Número', 'numero', 'text', true)}
          {field('Complemento', 'complemento', 'text', true)}
          {field('Bairro', 'bairro')}
          {field('Cidade', 'cidade', 'text', true)}
          {field('UF', 'uf', 'text', true)}
          {field('CEP', 'cep', 'text', true)}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={!form.nome || !form.documento || saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <span>Salvando...</span> : <span>Salvar</span>}
          </button>
        </div>
      </Modal>
    </div>
  );
}
