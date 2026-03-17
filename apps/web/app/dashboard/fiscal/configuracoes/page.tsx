'use client';

import { useState, useEffect } from 'react';
import { getFiscalSettings, saveFiscalSettings } from '@/lib/fiscal/service';
import type { FiscalCompanyConfig } from '@/lib/fiscal/types';
import FiscalIntegrationPanel from '@/components/fiscal/FiscalIntegrationPanel';

export default function ConfiguracoesFiscalPage() {
  const [config, setConfig] = useState<FiscalCompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getFiscalSettings().then((data) => {
      setConfig(data);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await saveFiscalSettings(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const f = (label: string, key: keyof FiscalCompanyConfig, type = 'text') => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={config ? String(config[key] ?? '') : ''}
        onChange={(e) => setConfig((c) => c ? { ...c, [key]: e.target.value } : c)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações Fiscais</h1>
        <p className="text-sm text-gray-500 mt-1">Dados da empresa e preferências de emissão.</p>
      </div>

      {/* Section: Company */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">🏢</span> Dados da empresa
        </h2>
        {f('Razão Social', 'razaoSocial')}
        {f('CNPJ', 'cnpj')}
        {f('Inscrição Estadual', 'inscricaoEstadual')}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Regime tributário</label>
          <select
            value={config.regime}
            onChange={(e) => setConfig((c) => c ? { ...c, regime: e.target.value as FiscalCompanyConfig['regime'] } : c)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
          >
            <option value="simples">Simples Nacional</option>
            <option value="lucro_presumido">Lucro Presumido</option>
            <option value="lucro_real">Lucro Real</option>
          </select>
        </div>
      </section>

      {/* Section: Fiscal preferences */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">🧾</span> Preferências fiscais
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {f('Série da nota', 'serieNota')}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Próximo número</label>
            <input
              type="number"
              value={config.proximoNumero}
              onChange={(e) => setConfig((c) => c ? { ...c, proximoNumero: Number(e.target.value) } : c)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
            />
          </div>
        </div>
        {f('Natureza da operação', 'naturezaOperacao')}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Observações padrão</label>
          <textarea
            rows={3}
            value={config.observacoesPadrao}
            onChange={(e) => setConfig((c) => c ? { ...c, observacoesPadrao: e.target.value } : c)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] resize-none"
          />
        </div>
      </section>

      {/* Section: Delivery */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">📨</span> Envio ao cliente
        </h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setConfig((c) => c ? { ...c, envioAutomatico: !c.envioAutomatico } : c)}
            className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${config.envioAutomatico ? 'bg-[#4f46e5]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.envioAutomatico ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">Envio automático após emissão</span>
        </label>
        {f('Canal WhatsApp para emissão (opcional)', 'canalWhatsapp', 'tel')}
      </section>

      {/* Section: Integration */}
      <section className="bg-white border border-gray-200/60 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-base">🔗</span> Integração com backend fiscal
        </h2>
        <FiscalIntegrationPanel status={config.integrationStatus} />
        <p className="text-xs text-gray-400 leading-relaxed">
          A conexão com o sistema de emissão fiscal real será configurada nesta seção.
          Atualmente o módulo opera em <strong>modo de simulação visual</strong>, pronto para ser conectado ao backend fiscal externo.
        </p>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-75"
        >
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">✅ Salvo</span>}
      </div>
    </div>
  );
}
