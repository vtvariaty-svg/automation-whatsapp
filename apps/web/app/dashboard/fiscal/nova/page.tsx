'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFiscalCustomers, getFiscalCatalog, simulateFiscalEmission } from '@/lib/fiscal/service';
import type { FiscalCustomer, FiscalCatalogItem, FiscalDocumentItem } from '@/lib/fiscal/types';

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
    try {
      await simulateFiscalEmission({
        tipo: docType,
        customerId: selectedCustomer.id,
        customerNome: selectedCustomer.nome,
        customerDocumento: selectedCustomer.documento,
        itens: items,
        subtotal,
        desconto,
        total,
        observacoes: observacoes || undefined,
      });
      router.push('/dashboard/fiscal/historico');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova emissão</h1>
        <p className="text-sm text-gray-500 mt-1">Simulação visual — pronto para conexão com backend fiscal</p>
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
                <h2 className="font-semibold text-gray-900 mb-3">Cliente</h2>
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
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedCustomer}
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

              {/* Catalog */}
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

              {/* Selected items */}
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

              {/* Discount + observations */}
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

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">ℹ️</span>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Esta emissão será <strong>simulada</strong>. Nenhum documento fiscal real será gerado. O módulo está pronto para conexão com backend fiscal externo.
                </p>
              </div>

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
                      Simulando...
                    </>
                  ) : (
                    <>🧾 Simular emissão</>
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
