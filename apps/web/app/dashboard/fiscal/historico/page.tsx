'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FiscalDocument, FiscalDocumentStatus, FiscalDocumentType } from '@/lib/fiscal/types';
import FiscalHistoryTable from '@/components/fiscal/FiscalHistoryTable';
import FiscalEmptyState from '@/components/fiscal/FiscalEmptyState';

interface RawRecord {
  id: string;
  externalReferenceId: string;
  invoiceId: string | null;
  requestId: string | null;
  protocol: string | null;
  status: string;
  mode: string;
  tipo: string;
  customerNome: string;
  customerDocumento: string;
  total: number;
  itensJson: string | null;
  createdAt: string;
  updatedAt: string;
}

function recordToDocument(record: RawRecord): FiscalDocument {
  let fiscalItems: FiscalDocument['itens'] = [];
  if (record.itensJson) {
    try {
      const nfeItems: Array<{ codigo_produto: string; descricao: string; quantidade: number; valor_unitario: number }> =
        JSON.parse(record.itensJson);
      fiscalItems = nfeItems.map((it, i) => ({
        id: `${record.id}-item-${i}`,
        nome: it.descricao,
        quantidade: it.quantidade,
        precoUnitario: it.valor_unitario,
        total: it.quantidade * it.valor_unitario,
      }));
    } catch {
      // keep empty
    }
  }

  return {
    id: record.id,
    numero: record.invoiceId ?? undefined,
    tipo: (record.tipo as FiscalDocumentType) ?? 'nfe',
    status: record.status as FiscalDocumentStatus,
    origem: 'painel',
    customerId: record.id,
    customerNome: record.customerNome,
    customerDocumento: record.customerDocumento,
    itens: fiscalItems,
    subtotal: record.total,
    desconto: 0,
    total: record.total,
    timeline: [
      {
        id: 't1',
        evento: record.mode === 'real' ? 'Emissão enviada ao serviço fiscal' : 'Emissão simulada',
        descricao:
          record.mode === 'real'
            ? `Invoice ID: ${record.invoiceId ?? '—'}`
            : 'Modo simulação (NFE_EXTERNAL_ENABLED=false)',
        timestamp: record.createdAt,
        status: record.status === 'autorizado' || record.status === 'emitido_mock' ? 'success' : 'info',
      },
    ],
    mode: record.mode as 'mock' | 'real',
    externalReferenceId: record.externalReferenceId,
    invoiceId: record.invoiceId ?? undefined,
    protocol: record.protocol ?? undefined,
    requestId: record.requestId ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export default function HistoricoPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fiscal/records')
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(b.error ?? 'Erro ao carregar histórico'));
        return res.json();
      })
      .then((records: RawRecord[]) => {
        setDocuments(records.map(recordToDocument));
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>
          <p className="text-sm text-gray-500 mt-1">Documentos fiscais emitidos e em processamento.</p>
        </div>
        <Link
          href="/dashboard/fiscal/nova"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
        >
          ＋ Nova emissão
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <FiscalEmptyState
          icon="📋"
          title="Nenhum documento emitido"
          description="Crie sua primeira emissão e ela aparecerá aqui com status e histórico completo."
          cta={{ label: '+ Nova emissão', onClick: () => router.push('/dashboard/fiscal/nova') }}
        />
      ) : (
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
          <FiscalHistoryTable documents={documents} />
        </div>
      )}
    </div>
  );
}
