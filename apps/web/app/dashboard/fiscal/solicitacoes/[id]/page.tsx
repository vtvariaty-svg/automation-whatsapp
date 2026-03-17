'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { getFiscalRequestById } from '@/lib/fiscal/service';
import type { FiscalRequest } from '@/lib/fiscal/types';
import FiscalStatusBadge from '@/components/fiscal/FiscalStatusBadge';
import FiscalRequestTimeline from '@/components/fiscal/FiscalRequestTimeline';

export default function SolicitacaoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [request, setRequest] = useState<FiscalRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFiscalRequestById(id).then((data) => {
      setRequest(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <span className="text-4xl mb-4">🔍</span>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Solicitação não encontrada</h2>
        <p className="text-sm text-gray-500 mb-6">O ID informado não corresponde a nenhuma solicitação.</p>
        <Link href="/dashboard/fiscal/whatsapp" className="text-sm text-[#4f46e5] font-medium hover:text-[#7c3aed] transition-colors">
          ← Voltar para Emissão por WhatsApp
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/fiscal/whatsapp" className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detalhe da solicitação</h1>
          <p className="text-xs text-gray-400 mt-0.5">ID: {request.id}</p>
        </div>
      </div>

      {/* Status + meta */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <FiscalStatusBadge status={request.status} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            📱 WhatsApp
          </span>
          {request.telefone && (
            <span className="text-xs text-gray-500">{request.telefone}</span>
          )}
        </div>

        {/* Original message */}
        {request.mensagemOriginal && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Mensagem original</p>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{request.mensagemOriginal}</p>
            </div>
          </div>
        )}

        {/* Extracted data */}
        {request.dadosExtraidos && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Dados extraídos</p>
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
              {request.dadosExtraidos.clienteNome && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Cliente</p>
                  <p className="text-sm font-medium text-gray-900">{request.dadosExtraidos.clienteNome}</p>
                </div>
              )}
              {request.dadosExtraidos.clienteDocumento && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">CPF / CNPJ</p>
                  <p className="text-sm font-medium text-gray-900">{request.dadosExtraidos.clienteDocumento}</p>
                </div>
              )}
              {request.dadosExtraidos.itens && (
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Itens</p>
                  <p className="text-sm font-medium text-gray-900">{request.dadosExtraidos.itens}</p>
                </div>
              )}
              {request.dadosExtraidos.valor != null && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Valor estimado</p>
                  <p className="text-sm font-semibold text-[#4f46e5]">
                    {request.dadosExtraidos.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Inconsistencies */}
      {(request.inconsistencias?.length ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h2 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
            <span>⚠️</span> Inconsistências detectadas
          </h2>
          <ul className="space-y-2">
            {request.inconsistencias!.map((inc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-0.5 flex-shrink-0">•</span>
                {inc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Attachments mock */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>📎</span> Anexos (simulados)
        </h2>
        <div className="space-y-2">
          {['mensagem_original.txt', 'dados_extraidos.json'].map((f) => (
            <div key={f} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-gray-400">📄</span>
              <span className="text-sm text-gray-700 font-medium">{f}</span>
              <button className="ml-auto text-xs text-[#4f46e5] hover:text-[#7c3aed] font-medium transition-colors">
                ⬇️ Baixar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Timeline de processamento</h2>
        <FiscalRequestTimeline events={request.timeline} />
      </div>

      {/* Actions */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Ações</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-semibold text-sm transition-colors border border-emerald-200">
            ✅ Aprovar
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold text-sm transition-colors border border-red-200">
            ❌ Rejeitar
          </button>
          <button className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-indigo-200/50">
            🧾 Simular emissão
          </button>
          <button className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium text-sm transition-colors border border-gray-200">
            📨 Reenviar comprovante ao cliente
          </button>
        </div>
      </div>
    </div>
  );
}
