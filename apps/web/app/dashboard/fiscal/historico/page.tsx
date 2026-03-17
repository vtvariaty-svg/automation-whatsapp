'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFiscalDocuments } from '@/lib/fiscal/service';
import type { FiscalDocument } from '@/lib/fiscal/types';
import FiscalHistoryTable from '@/components/fiscal/FiscalHistoryTable';
import FiscalEmptyState from '@/components/fiscal/FiscalEmptyState';

export default function HistoricoPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFiscalDocuments().then((data) => {
      setDocuments(data);
      setLoading(false);
    });
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
