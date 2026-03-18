'use client';

import { useState } from 'react';
import type { FiscalDocument, FiscalDocumentStatus, FiscalDocumentType, FiscalRequestOrigin } from '@/lib/fiscal/types';
import { FISCAL_DOCUMENT_TYPE_LABELS, FISCAL_ORIGIN_LABELS } from '@/lib/fiscal/types';
import FiscalStatusBadge from './FiscalStatusBadge';
import FiscalRequestTimeline from './FiscalRequestTimeline';

interface FiscalHistoryTableProps {
  documents: FiscalDocument[];
}

type SortKey = 'createdAt' | 'total' | 'customerNome';
type SortDir = 'asc' | 'desc';

const ALL = 'all' as const;

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FiscalHistoryTable({ documents }: FiscalHistoryTableProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FiscalDocumentStatus | typeof ALL>(ALL);
  const [filterTipo, setFilterTipo] = useState<FiscalDocumentType | typeof ALL>(ALL);
  const [filterOrigem, setFilterOrigem] = useState<FiscalRequestOrigin | typeof ALL>(ALL);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'createdAt', dir: 'desc' });
  const [selected, setSelected] = useState<FiscalDocument | null>(null);

  const filtered = documents
    .filter((d) => {
      if (filterStatus !== ALL && d.status !== filterStatus) return false;
      if (filterTipo !== ALL && d.tipo !== filterTipo) return false;
      if (filterOrigem !== ALL && d.origem !== filterOrigem) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.customerNome.toLowerCase().includes(q) ||
          d.customerDocumento.includes(q) ||
          (d.numero ?? '').includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sort.key === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sort.key === 'total') cmp = a.total - b.total;
      else if (sort.key === 'customerNome') cmp = a.customerNome.localeCompare(b.customerNome);
      return sort.dir === 'asc' ? cmp : -cmp;
    });

  function toggleSort(key: SortKey) {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sort.key === k ? (
      <span className="ml-1 text-[10px]">{sort.dir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, doc. ou número..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FiscalDocumentStatus | typeof ALL)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-700"
        >
          <option value={ALL}>Todos os status</option>
          <option value="autorizado">Autorizado</option>
          <option value="processando">Processando</option>
          <option value="emitido_mock">Emitido (simulado)</option>
          <option value="draft">Rascunho</option>
          <option value="pendente_validacao">Pendente</option>
          <option value="pronto_para_emitir">Pronto p/ Emitir</option>
          <option value="erro_sefaz">Erro SEFAZ</option>
          <option value="erro_mock">Erro</option>
          <option value="cancelado_sefaz">Cancelado SEFAZ</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value as FiscalDocumentType | typeof ALL)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-700"
        >
          <option value={ALL}>Todos os tipos</option>
          <option value="nfe">NF-e</option>
          <option value="nfse">NFS-e</option>
          <option value="nfce">NFC-e</option>
          <option value="cte">CT-e</option>
        </select>
        <select
          value={filterOrigem}
          onChange={(e) => setFilterOrigem(e.target.value as FiscalRequestOrigin | typeof ALL)}
          className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 text-gray-700"
        >
          <option value={ALL}>Todas as origens</option>
          <option value="painel">Painel</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200/60">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nº</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => toggleSort('customerNome')}>
                Cliente <SortIcon k="customerNome" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Origem</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => toggleSort('total')}>
                Valor <SortIcon k="total" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700" onClick={() => toggleSort('createdAt')}>
                Data <SortIcon k="createdAt" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  Nenhum documento encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{doc.numero ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">{doc.customerNome}</p>
                    <p className="text-[11px] text-gray-400">{doc.customerDocumento}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-100">
                      {FISCAL_DOCUMENT_TYPE_LABELS[doc.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${doc.origem === 'whatsapp' ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {doc.origem === 'whatsapp' ? '📱' : '🖥️'} {FISCAL_ORIGIN_LABELS[doc.origem]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(doc.total)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(doc.createdAt)}</td>
                  <td className="px-4 py-3"><FiscalStatusBadge status={doc.status} size="sm" /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(doc)}
                      className="text-xs text-[#4f46e5] hover:text-[#7c3aed] font-medium transition-colors"
                    >
                      Detalhes →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer / Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-gray-900 text-base">Detalhe do Documento</h2>
                {selected.numero && <p className="text-xs text-gray-400 mt-0.5">Nº {selected.numero}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {/* Status + badges */}
              <div className="flex flex-wrap gap-2 items-center">
                <FiscalStatusBadge status={selected.status} />
                <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-md border border-indigo-100">
                  {FISCAL_DOCUMENT_TYPE_LABELS[selected.tipo]}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${selected.origem === 'whatsapp' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {selected.origem === 'whatsapp' ? '📱' : '🖥️'} {FISCAL_ORIGIN_LABELS[selected.origem]}
                </span>
              </div>

              {/* Client */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Cliente</p>
                <p className="font-semibold text-gray-900">{selected.customerNome}</p>
                <p className="text-sm text-gray-500">{selected.customerDocumento}</p>
              </div>

              {/* Items */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Itens</p>
                <div className="space-y-2">
                  {selected.itens.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.nome} × {item.quantidade}</span>
                      <span className="font-medium text-gray-900">{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
                  <span className="text-gray-700">Total</span>
                  <span className="text-gray-900">{selected.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Timeline</p>
                <FiscalRequestTimeline events={selected.timeline} />
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200">
                  <span>📄</span> Visualizar
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200">
                  <span>📋</span> Duplicar
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200">
                  <span>⬇️</span> DANFE mock
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200">
                  <span>📦</span> XML mock
                </button>
                <button className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200/50">
                  <span>📨</span> Reenviar ao cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
