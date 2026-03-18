"use client";

import { useState, useEffect } from "react";
import { authApi } from "@/lib/api/client";

const NICHOS = [
  {
    id: "clínica",
    label: "Clínica / Consultório",
    emoji: "🏥",
    desc: "Agendamentos, dúvidas de procedimentos e horários",
  },
  {
    id: "salão",
    label: "Salão / Barbearia",
    emoji: "💇",
    desc: "Serviços, agendamentos, tabela de preços",
  },
  {
    id: "restaurante",
    label: "Restaurante / Delivery",
    emoji: "🍽️",
    desc: "Cardápio, reservas, pedidos e delivery",
  },
  {
    id: "ecommerce",
    label: "Loja / E-commerce",
    emoji: "🛍️",
    desc: "Produtos, pedidos, frete e suporte",
  },
  {
    id: "outro",
    label: "Outro",
    emoji: "🏢",
    desc: "Configuração básica para qualquer tipo de negócio",
  },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingNiche, setApplyingNiche] = useState(false);
  const [message, setMessage] = useState("");
  const [nicheMessage, setNicheMessage] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("");
  const [config, setConfig] = useState({
    name: "",
    businessDescription: "",
    phone: "",
    openingHours: "",
    address: "",
    templateBookingConfirmed: "",
    templateReminder24h: "",
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await authApi.getTenantConfig();
        setConfig({
          name: data.name || "",
          businessDescription: data.businessDescription || "",
          phone: data.phone || "",
          openingHours: data.businessConfig?.openingHours || "",
          address: data.businessConfig?.address || "",
          templateBookingConfirmed: data.businessConfig?.templateBookingConfirmed || "",
          templateReminder24h: data.businessConfig?.templateReminder24h || "",
        });
        if (data.businessType) setSelectedNiche(data.businessType);
      } catch {
        console.error("Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleApplyNiche = async () => {
    if (!selectedNiche) return;
    setApplyingNiche(true);
    setNicheMessage("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/tenant/apply-niche", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessType: selectedNiche }),
      });
      if (res.ok) {
        setNicheMessage("✅ Preset aplicado! Prompt da IA e mensagem de boas-vindas atualizados.");
      } else {
        const err = await res.json();
        setNicheMessage(`❌ Erro: ${err.error}`);
      }
    } catch {
      setNicheMessage("❌ Erro ao aplicar o preset.");
    } finally {
      setApplyingNiche(false);
      setTimeout(() => setNicheMessage(""), 5000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await authApi.updateTenantConfig(config);
      setMessage("✅ Configurações salvas com sucesso!");
    } catch {
      setMessage("❌ Erro ao salvar configurações.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie as informações do seu negócio</p>
      </div>

      {/* Toast */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.includes("✅")
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-xl flex items-center justify-center text-white text-lg">
                🏢
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Informações da Empresa</h3>
                <p className="text-xs text-gray-500">Dados usados pela IA e no painel</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Empresa</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
                placeholder="Nome do seu negócio"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição do Negócio</label>
              <textarea
                rows={3}
                value={config.businessDescription}
                onChange={(e) => setConfig({ ...config, businessDescription: e.target.value })}
                placeholder="Descreva o que sua empresa faz, produtos, serviços..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg">
                📍
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Contato e Localização</h3>
                <p className="text-xs text-gray-500">Informações de contato e endereço</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone Comercial</label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Horário de Funcionamento</label>
                <input
                  type="text"
                  value={config.openingHours}
                  onChange={(e) => setConfig({ ...config, openingHours: e.target.value })}
                  placeholder="Seg-Sex 08:00 - 18:00"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço</label>
              <input
                type="text"
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Templates API Oficial */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
                💬
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Templates de WhatsApp</h3>
                <p className="text-xs text-gray-500">Vincule os Message Templates aprovados na Meta API</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmação de Agendamento
                </label>
                <input
                  type="text"
                  value={config.templateBookingConfirmed}
                  onChange={(e) => setConfig({ ...config, templateBookingConfirmed: e.target.value })}
                  placeholder="Ex: appointment_confirmation"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Disparado assim que salvo. <br/>Variáveis: <code>{"{{1}}"}</code> Nome, <code>{"{{2}}"}</code> Serviço, <code>{"{{3}}"}</code> Data, <code>{"{{4}}"}</code> Hora.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lembrete de Véspera (24h)
                </label>
                <input
                  type="text"
                  value={config.templateReminder24h}
                  onChange={(e) => setConfig({ ...config, templateReminder24h: e.target.value })}
                  placeholder="Ex: appointment_reminder_24h"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                   Disparado na véspera. <br/>Variáveis: <code>{"{{1}}"}</code> Nome, <code>{"{{2}}"}</code> Serviço, <code>{"{{3}}"}</code> Data, <code>{"{{4}}"}</code> Hora.
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-700">
              <strong>Atenção:</strong> Se vazios ou se a mensagem falhar, o sistema ainda tentará fazer o envio padrão em formato de texto livre (que só funciona se o cliente tiver engajado nas últimas 24hs).
            </div>
          </div>
        </div>

        {/* Nicho de Negócio */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg">
                🎯
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Nicho de Negócio</h3>
                <p className="text-xs text-gray-500">
                  Aplica um preset de prompt da IA e mensagem de boas-vindas para o seu segmento
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {NICHOS.map((nicho) => (
                <button
                  key={nicho.id}
                  type="button"
                  onClick={() => setSelectedNiche(nicho.id)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    selectedNiche === nicho.id
                      ? "bg-violet-50 border-violet-400 ring-2 ring-violet-500/10 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{nicho.emoji}</span>
                  <p className={`font-bold text-sm mt-2 ${selectedNiche === nicho.id ? "text-violet-700" : "text-gray-800"}`}>
                    {nicho.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${selectedNiche === nicho.id ? "text-violet-600/80" : "text-gray-500"}`}>
                    {nicho.desc}
                  </p>
                </button>
              ))}
            </div>

            {nicheMessage && (
              <div className={`p-3 rounded-xl text-sm font-medium border ${
                nicheMessage.includes("✅")
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-red-50 text-red-700 border-red-100"
              }`}>
                {nicheMessage}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">
                Atualiza somente o prompt da IA e a mensagem de boas-vindas. Seus dados, serviços e automações existentes <strong>não serão apagados</strong>.
              </p>
              <button
                type="button"
                onClick={handleApplyNiche}
                disabled={applyingNiche || !selectedNiche}
                className="ml-4 shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-violet-200/50 transition-all disabled:opacity-50"
              >
                {applyingNiche ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  "Aplicar Preset"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
