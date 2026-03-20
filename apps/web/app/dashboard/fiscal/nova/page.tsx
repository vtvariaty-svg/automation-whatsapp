'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFiscalCustomers, getFiscalCatalog } from '@/lib/fiscal/service';
import type { FiscalCustomer, FiscalCatalogItem, FiscalDocumentItem } from '@/lib/fiscal/types';
import { ContactSearchInput } from '@/components/contacts/ContactSearchInput';

type Step = 1 | 2 | 3;

const DOC_TYPES = [
  { value: 'nfe', label: 'NF-e', desc: 'Nota Fiscal Eletrônica (produto)' },
  { value: 'nfse', label: 'NFS-e', desc: 'Nota Fiscal de Serviço Eletrônica' },
  { value: 'nfce', label: 'NFC-e', desc: 'Nota Fiscal ao Consumidor' },
  { value: 'cte', label: 'CT-e', desc: 'Conhecimento de Transporte Eletrônico' },
];

function currency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface EmissionResult {
  mode: 'mock' | 'real';
  request_id: string;
  invoice_id: string;
  external_reference_id: string;
  status: string;
  local_status?: string;
  protocol?: string | null;
}

export default function NovaEmissaoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [docType, setDocType] = useState('nfse');
  const [customers, setCustomers] = useState<FiscalCustomer[]>([]);
  const [catalog, setCatalog] = useState<FiscalCatalogItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<FiscalCustomer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState<FiscalDocumentItem[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [customerTab, setCustomerTab] = useState<'fiscal' | 'contacts'>('fiscal');
  const [contactDocumento, setContactDocumento] = useState('');
  const [emissionResult, setEmissionResult] = useState<EmissionResult | null>(null);
  const [emissionError, setEmissionError] = useState<string | null>(null);
  // Stable per business transaction — generated once on mount, reused on retry.
  // A fresh ID is only generated when the user starts a NEW emission (resetForm).
  const [externalRefId, setExternalRefId] = useState<string>(
    () => `${crypto.randomUUID().slice(0, 8)}-nfe-${Date.now()}`
  );

  useEffect(() => {
    Promise.all([getFiscalCustomers(), getFiscalCatalog()]).then(([c, cat]) => {
      setCustomers(c);
      setCatalog(cat.filter((i) => i.ativo));
      setLoadingData(false);
    });
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      customerSearch === '' ||
      c.nome.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.documento.includes(customerSearch)
  );

  function addCatalogItem(item: FiscalCatalogItem) {
    setItems((prev) => {
      const exists = prev.find((i) => i.catalogItemId === item.id);
      if (exists) {
        return prev.map((i) =>
          i.catalogItemId === item.id
            ? { ...i, quantidade: i.quantidade + 1, total: (i.quantidade + 1) * i.precoUnitario }
            : i
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}`,
          catalogItemId: item.id,
          nome: item.nome,
          quantidade: 1,
          precoUnitario: item.preco,
          total: item.preco,
        },
      ];
    });
  }

  function updateItemQty(id: string, qty: number) {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantidade: qty, total: qty * i.precoUnitario } : i))
      );
    }
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, subtotal - desconto);

  async function handleSubmit() {
    if (!selectedCustomer) return;
    setSubmitting(true);
    setEmissionError(null);

    try {
      // Build catalog map for sku/ncm lookup
      const catalogMap = new Map(catalog.map((c) => [c.id, c]));

      const nfeItems = items.map((item) => {
        const cat = item.catalogItemId ? catalogMap.get(item.catalogItemId) : undefined;
        return {
          codigo_produto: cat?.sku ?? item.catalogItemId ?? item.id,
          descricao: item.nome,
          quantidade: item.quantidade,
          valor_unitario: item.precoUnitario,
          ncm: cat?.ncm,
          unidade: cat?.unidade ?? 'UN',
        };
      });

      const nfeAddress = {
        street: selectedCustomer.endereco?.logradouro ?? '',
        number: selectedCustomer.endereco?.numero ?? '',
        district: selectedCustomer.endereco?.bairro ?? '',
        city: selectedCustomer.endereco?.cidade ?? '',
        state: selectedCustomer.endereco?.uf ?? '',
        zipCode: (selectedCustomer.endereco?.cep ?? '').replace(/\D/g, ''),
      };

      const response = await fetch('/api/fiscal/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: docType,
          external_reference_id: externalRefId, // stable across retries for this business transaction
          natureza_operacao: 'Venda de Mercadoria',
          customer: {
            document: selectedCustomer.documento,
            name: selectedCustomer.nome,
            email: selectedCustomer.email,
            address: nfeAddress,
          },
          items: nfeItems,
          total,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setEmissionError(result.error ?? 'Erro na emissão fiscal.');
      } else {
        setEmissionResult(result as EmissionResult);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep(1);
    setDocType('nfse');
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerTab('fiscal');
    setContactDocumento('');
    setItems([]);
    setDesconto(0);
    setObservacoes('');
    setEmissionResult(null);
    setEmissionError(null);
    // New business transaction — generate fresh stable reference ID
    setExternalRefId(`${crypto.randomUUID().slice(0, 8)}-nfe-${Date.now()}`);
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (emissionResult) {
    const isReal = emissionResult.mode === 'real';
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className={`rounded-2xl border p-8 text-center space-y-5 ${isReal ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto ${isReal ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            {isReal ? '✅' : '🧾'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isReal ? 'Documento emitido!' : 'Emissão simulada concluída'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isReal
                ? 'O documento foi enviado ao serviço fiscal com sucesso.'
                : 'O módulo está em modo simulação (NFE_EXTERNAL_ENABLED=false).'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 text-left space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-semibold ${isReal ? 'text-emerald-700' : 'text-gray-600'}`}>
                {emissionResult.local_status ?? emissionResult.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice ID</span>
              <span className="font-mono text-xs text-gray-700 break-all text-right max-w-[60%]">
                {emissionResult.invoice_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Request ID</span>
              <span className="font-mono text-xs text-gray-700 break-all text-right max-w-[60%]">
                {emissionResult.request_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Referência</span>
              <span className="font-mono text-xs text-gray-700 break-all text-right max-w-[60%]">
                {emissionResult.external_reference_id}
              </span>
            </div>
            {emissionResult.protocol && (
              <div className="flex justify-between">
                <span className="text-gray-500">Protocolo</span>
                <span className="font-mono text-xs text-gray-700">{emissionResult.protocol}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              + Nova emissão
            </button>
            <button
              onClick={() => router.push('/dashboard/fiscal/historico')}
              className="px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
            >
              Ver histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova emissão</h1>
        <p className="text-sm text-gray-500 mt-1">Emissão de documento fiscal via painel</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {(['1', '2', '3'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                Number(s) === step
                  ? 'bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-indigo-200/50'
                  : Number(s) < step
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {Number(s) < step ? '✓' : s}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${Number(s) === step ? 'text-gray-900' : 'text-gray-400'}`}>
              {i === 0 ? 'Tipo & Cliente' : i === 1 ? 'Itens' : 'Revisão'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1 */}
          {step === 1 && (
            <div className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Tipo de documento</h2>
              <div className="grid grid-cols-2 gap-3">
                {DOC_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    onClick={() => setDocType(dt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      docType === dt.value
                        ? 'border-[#4f46e5] bg-indigo-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-bold text-gray-900 text-sm">{dt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dt.desc}</p>
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900">Cliente</h2>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => { setCustomerTab('fiscal'); setSelectedCustomer(null); setContactDocumento(''); }}
                      className={`px-3 py-1.5 transition-colors ${customerTab === 'fiscal' ? 'bg-[#4f46e5] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      Clientes Fiscais
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCustomerTab('contacts'); setSelectedCustomer(null); setContactDocumento(''); }}
                      className={`px-3 py-1.5 transition-colors ${customerTab === 'contacts' ? 'bg-[#4f46e5] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      Contatos
                    </button>
                  </div>
                </div>

                {customerTab === 'fiscal' ? (
                  <>
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] mb-3"
                    />
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCustomer(c)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            selectedCustomer?.id === c.id
                              ? 'border-[#4f46e5] bg-indigo-50/50'
                              : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                            {c.nome[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{c.nome}</p>
                            <p className="text-xs text-gray-400">{c.documento}</p>
                          </div>
                          {selectedCustomer?.id === c.id && <span className="text-[#4f46e5]">✓</span>}
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <p className="text-sm text-gray-400 py-4 text-center">Nenhum cliente encontrado.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <ContactSearchInput
                      placeholder="Digite nome ou telefone do contato..."
                      theme="light"
                      onSelect={(c) => {
                        setContactDocumento('');
                        setSelectedCustomer({
                          id: c.id,
                          nome: c.name ?? c.phone ?? '',
                          documento: '',
                          tipo: 'pf',
                          email: c.email ?? undefined,
                        } as FiscalCustomer);
                      }}
                    />

                    {selectedCustomer && (
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {selectedCustomer.nome[0]}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{selectedCustomer.nome}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            CPF / CNPJ <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-1">(obrigatório para emissão fiscal)</span>
                          </label>
                          <input
                            type="text"
                            value={contactDocumento}
                            onChange={(e) => {
                              const val = e.target.value;
                              setContactDocumento(val);
                              setSelectedCustomer((prev) => prev ? { ...prev, documento: val } : prev);
                            }}
                            placeholder="000.000.000-00 ou 00.000.000/0001-00"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedCustomer || !selectedCustomer.documento}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Itens</h2>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Adicionar do catálogo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catalog.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addCatalogItem(item)}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-left transition-all bg-gray-50"
                    >
                      <span className="text-base">{item.tipo === 'servico' ? '⚙️' : '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.nome}</p>
                        <p className="text-[10px] text-gray-400">{item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {item.unidade}</p>
                      </div>
                      <span className="text-[#4f46e5] text-sm font-bold">+</span>
                    </button>
                  ))}
                </div>
              </div>

              {items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Itens selecionados</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl">
                        <p className="flex-1 text-sm font-medium text-gray-900">{item.nome}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateItemQty(item.id, item.quantidade - 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center">−</button>
                          <span className="text-sm font-semibold w-5 text-center">{item.quantidade}</span>
                          <button onClick={() => updateItemQty(item.id, item.quantidade + 1)} className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold flex items-center justify-center">+</button>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-24 text-right">{currency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Desconto (R$)</label>
                  <input
                    type="number"
                    min={0}
                    value={desconto}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Observações</label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Instruções adicionais ao cliente..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] resize-none"
                />
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">← Voltar</button>
                <button
                  onClick={() => setStep(3)}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Revisar →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-5">
              <h2 className="font-semibold text-gray-900">Revisão</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tipo</span>
                  <span className="font-semibold text-gray-900 uppercase">{docType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-semibold text-gray-900">{selectedCustomer?.nome}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Documento</span>
                  <span className="text-gray-700">{selectedCustomer?.documento}</span>
                </div>
                {!selectedCustomer?.endereco && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    Endereço não cadastrado. Para emissão real, o endereço completo é obrigatório.
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Itens</p>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700">{item.nome} × {item.quantidade}</span>
                    <span className="font-medium">{currency(item.total)}</span>
                  </div>
                ))}
                {desconto > 0 && (
                  <div className="flex justify-between text-sm py-1.5 text-emerald-600">
                    <span>Desconto</span>
                    <span>− {currency(desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 mt-1">
                  <span>Total</span>
                  <span className="text-[#4f46e5]">{currency(total)}</span>
                </div>
              </div>

              {observacoes && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Observações</p>
                  <p className="text-sm text-gray-700">{observacoes}</p>
                </div>
              )}

              {/* Inline error message */}
              {emissionError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-0.5">Erro na emissão</p>
                    <p className="text-xs text-red-600 leading-relaxed">{emissionError}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">← Voltar</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-75"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Emitindo...
                    </>
                  ) : (
                    <>🧾 Emitir documento</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lateral summary */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200/60 rounded-2xl p-5 sticky top-6">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Resumo</h3>
            {selectedCustomer ? (
              <div className="mb-4 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                <p className="font-semibold text-gray-900 text-sm">{selectedCustomer.nome}</p>
                <p className="text-xs text-gray-400">{selectedCustomer.documento}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-4">Selecione um cliente</p>
            )}

            {items.length > 0 ? (
              <div className="space-y-1.5 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate flex-1 mr-2">{item.nome} ×{item.quantidade}</span>
                    <span className="font-medium text-gray-900">{currency(item.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-4">Nenhum item adicionado</p>
            )}

            <div className="border-t border-gray-100 pt-3 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>{currency(subtotal)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Desconto</span><span>− {currency(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
                <span>Total</span>
                <span className="text-[#4f46e5]">{currency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
