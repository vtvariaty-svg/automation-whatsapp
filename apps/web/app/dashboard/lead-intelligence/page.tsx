'use client';

import { useState } from 'react';

export default function LeadIntelligencePage() {
  const [nicho, setNicho] = useState('');
  const [cidade, setCidade] = useState('');
  const [raio, setRaio] = useState('');
  const [quantidade, setQuantidade] = useState('');

  const [ticketMinimo, setTicketMinimo] = useState('');
  const [ratingMinimo, setRatingMinimo] = useState('');
  const [minimoReviews, setMinimoReviews] = useState('');
  const [precisaSite, setPrecisaSite] = useState('nao');
  const [precisaTelefone, setPrecisaTelefone] = useState('nao');
  const [focoBB, setFocoBB] = useState('nao');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🎯</span>
          <h1 className="text-2xl font-bold text-gray-900">Prospecção IA</h1>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">
            Business
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Descubra e priorize empresas por nicho, região e potencial comercial. A IA analisa o mercado e retorna uma lista qualificada com score de oportunidade para cada lead.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Seção 1 — Descoberta de empresas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">🔍 Descoberta de empresas</h2>
            <p className="text-xs text-gray-500 mt-0.5">Defina o perfil do mercado que deseja mapear.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nicho / segmento</label>
              <input
                type="text"
                value={nicho}
                onChange={e => setNicho(e.target.value)}
                placeholder="Ex: clínicas de estética, restaurantes japoneses..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade / estado</label>
              <input
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="Ex: São Paulo, SP"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Raio (km)</label>
                <input
                  type="number"
                  value={raio}
                  onChange={e => setRaio(e.target.value)}
                  placeholder="Ex: 20"
                  min={1}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantidade máxima</label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={e => setQuantidade(e.target.value)}
                  placeholder="Ex: 100"
                  min={1}
                  max={500}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2 — Parâmetros de análise */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">⚙️ Parâmetros de análise</h2>
            <p className="text-xs text-gray-500 mt-0.5">Filtros de qualidade para priorizar os melhores leads.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ticket mínimo desejado (R$)</label>
                <input
                  type="number"
                  value={ticketMinimo}
                  onChange={e => setTicketMinimo(e.target.value)}
                  placeholder="Ex: 500"
                  min={0}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rating mínimo (0–5)</label>
                <input
                  type="number"
                  value={ratingMinimo}
                  onChange={e => setRatingMinimo(e.target.value)}
                  placeholder="Ex: 3.5"
                  min={0}
                  max={5}
                  step={0.1}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mínimo de reviews</label>
              <input
                type="number"
                value={minimoReviews}
                onChange={e => setMinimoReviews(e.target.value)}
                placeholder="Ex: 10"
                min={0}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">Precisa ter site?</label>
                <select
                  value={precisaSite}
                  onChange={e => setPrecisaSite(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">Precisa ter telefone comercial?</label>
                <select
                  value={precisaTelefone}
                  onChange={e => setPrecisaTelefone(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">Foco em B2B local?</label>
                <select
                  value={focoBB}
                  onChange={e => setFocoBB(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de análise */}
      <div className="flex justify-end">
        <button
          disabled
          title="Integração em breve"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600/40 text-white/70 rounded-xl text-sm font-bold cursor-not-allowed select-none"
        >
          🎯 Analisar mercado
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Em breve</span>
        </button>
      </div>

      {/* Seção 3 — Resultado esperado */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">📊 Resultado esperado</h2>
          <p className="text-xs text-gray-500 mt-0.5">Prévia do que a análise irá retornar para cada empresa encontrada.</p>
        </div>

        {/* Exemplo de card de resultado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Score de oportunidade</p>
            <div className="text-3xl font-black text-gray-300">—</div>
            <p className="text-[11px] text-gray-400 mt-1">0 a 100</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">compensa</span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">revisar</span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">não compensa</span>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Leads qualificados</p>
            <div className="text-3xl font-black text-gray-300">—</div>
            <p className="text-[11px] text-gray-400 mt-1">após filtros</p>
          </div>
        </div>

        {/* Lista vazia placeholder */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl py-14 flex flex-col items-center justify-center text-center">
          <span className="text-4xl mb-3">🎯</span>
          <p className="text-sm font-semibold text-gray-400">Nenhuma análise realizada ainda</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Preencha os parâmetros acima e clique em <strong>Analisar mercado</strong> para descobrir empresas qualificadas.
          </p>
        </div>
      </div>
    </div>
  );
}
