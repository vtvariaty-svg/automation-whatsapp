'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getFiscalRequests } from '@/lib/fiscal/service';
import type { FiscalRequest } from '@/lib/fiscal/types';
import FiscalStatusBadge from '@/components/fiscal/FiscalStatusBadge';
import FiscalRequestTimeline from '@/components/fiscal/FiscalRequestTimeline';
import FiscalEmptyState from '@/components/fiscal/FiscalEmptyState';

const PIPELINE_STEPS = [
  { icon: '📱', label: 'Mensagem recebida' },
  { icon: '🤖', label: 'Extração IA' },
  { icon: '✔️', label: 'Validação' },
  { icon: '💬', label: 'Confirmação' },
  { icon: '🧾', label: 'Emissão' },
  { icon: '📨', label: 'Envio ao cliente' },
];

const TEMPLATES = [
  {
    title: 'NF-e Produto',
    desc: 'Emissão de nota fiscal de produto',
    example: 'Oi, preciso de nota fiscal.\nProduto: [nome do produto]\nQtd: [quantidade]\nValor unit: R$ [valor]\nCliente: [nome], CPF/CNPJ: [documento]',
  },
  {
    title: 'NFS-e Serviço',
    desc: 'Emissão de nota de serviço',
    example: 'Olá, preciso de NFS-e.\nServiço: [descrição]\nHoras: [qtd] × R$ [valor]\nCliente: [nome], CPF: [documento]',
  },
  {
    title: 'Consulta status',
    desc: 'Verificar status de emissão',
    example: 'Status da nota [número]?',
  },
];

const EXPECTED_FIELDS = [
  { icon: '👤', label: 'Nome do cliente' },
  { icon: '🪪', label: 'CPF ou CNPJ' },
  { icon: '📦', label: 'Produto ou serviço' },
  { icon: '🔢', label: 'Quantidade' },
  { icon: '💰', label: 'Valor unitário' },
];

export default function WhatsAppFiscalPage() {
  const [requests, setRequests] = useState<FiscalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FiscalRequest | null>(null);

  useEffect(() => {
    getFiscalRequests().then((data) => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emissão por WhatsApp</h1>
        <p className="text-sm text-gray-500 mt-1">Seus clientes enviam uma mensagem e o sistema cuida da emissão.</p>
      </div>

      {/* Dedicated number */}
      <div className="bg-gradient-to-br from-[#4f46e5]/5 to-[#7c3aed]/5 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50 flex-shrink-0">
            <span className="text-white text-xl">📱</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Número dedicado para emissão</p>
            <p className="text-xl font-bold text-gray-900">+55 11 93333-0001</p>
            <p className="text-sm text-gray-500 mt-1">
              Clientes enviam mensagens para este número e o sistema extrai os dados automaticamente para emissão fiscal.
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200">
              ⏳ Integração em validação
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Fluxo de emissão</h2>
        <div className="flex items-center gap-1 flex-wrap">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div className="text-center px-2">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center mb-2">
                  <span className="text-lg">{step.icon}</span>
                </div>
                <p className="text-[9px] font-semibold text-gray-500 leading-tight max-w-[56px]">{step.label}</p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <span className="text-gray-300 text-sm mx-0.5">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Message templates */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Modelos de mensagem</h2>
          <div className="space-y-3">
            {TEMPLATES.map((t) => (
              <div key={t.title} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{t.title}</p>
                <p className="text-xs text-gray-400 mb-2">{t.desc}</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans bg-white border border-gray-100 rounded-lg p-2.5 leading-relaxed">
                  {t.example}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Expected fields */}
        <div className="bg-white border border-gray-200/60 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Campos esperados</h2>
          <p className="text-sm text-gray-500 mb-4">
            Para garantir a extração correta, a mensagem deve conter:
          </p>
          <div className="space-y-2">
            {EXPECTED_FIELDS.map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm font-medium text-gray-700">{f.label}</span>
                <span className="ml-auto text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Obrigatório</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-700 leading-relaxed">
              A IA extrai os dados automaticamente. Campos ausentes geram inconsistências que requerem revisão manual.
            </p>
          </div>
        </div>
      </div>

      {/* Requests list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Solicitações recentes</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <FiscalEmptyState
            icon="📱"
            title="Nenhuma solicitação via WhatsApp"
            description="Quando seus clientes enviarem mensagens para o número dedicado, as solicitações aparecerão aqui."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-gray-200/60 rounded-2xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span>📱</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{req.dadosExtraidos?.clienteNome ?? 'Cliente não identificado'}</p>
                      <FiscalStatusBadge status={req.status} size="sm" />
                      {(req.inconsistencias?.length ?? 0) > 0 && (
                        <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-full font-semibold">
                          {req.inconsistencias!.length} inconsist.
                        </span>
                      )}
                    </div>
                    {req.telefone && <p className="text-xs text-gray-400 mt-0.5">{req.telefone}</p>}
                    {req.mensagemOriginal && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{req.mensagemOriginal}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelected(req)}
                      className="text-xs text-[#4f46e5] hover:text-[#7c3aed] font-medium transition-colors"
                    >
                      Detalhes →
                    </button>
                    <Link
                      href={`/dashboard/fiscal/solicitacoes/${req.id}`}
                      className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
                    >
                      Abrir
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-gray-900">Solicitação via WhatsApp</h2>
                {selected.telefone && <p className="text-xs text-gray-400 mt-0.5">{selected.telefone}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-6 space-y-5">
              <FiscalStatusBadge status={selected.status} />

              {/* Original message */}
              {selected.mensagemOriginal && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Mensagem original</p>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.mensagemOriginal}</p>
                  </div>
                </div>
              )}

              {/* Extracted data */}
              {selected.dadosExtraidos && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Dados extraídos</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                    {Object.entries(selected.dadosExtraidos).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-500 capitalize">{k.replace('cliente', 'Cliente ')}</span>
                        <span className="font-medium text-gray-900">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inconsistencies */}
              {(selected.inconsistencias?.length ?? 0) > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Inconsistências</p>
                  <div className="space-y-1.5">
                    {selected.inconsistencias!.map((inc, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                        <span className="text-red-400 text-xs mt-0.5">⚠️</span>
                        <p className="text-xs text-red-700">{inc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Timeline</p>
                <FiscalRequestTimeline events={selected.timeline} />
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold transition-colors border border-emerald-200">
                  ✅ Aprovar
                </button>
                <button className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors border border-red-200">
                  ❌ Rejeitar
                </button>
                <button className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-indigo-200/50">
                  🧾 Simular emissão
                </button>
                <button className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200">
                  📨 Reenviar comprovante
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
