"use client";

import { useEffect, useState } from "react";

interface HandoffConfig {
  id?: string;
  enabled: boolean;
  alertPhone: string;
  clientMessage: string;
  operatorMessage: string;
  cooldownMinutes: number;
  maxAlertsPerConversation: number;
  autoSetHuman: boolean;
  triggerOnLowConfidence: boolean;
  triggerOnExplicitRequest: boolean;
  triggerOnRepetition: boolean;
  triggerOnCheckoutError: boolean;
  triggerOnNoProduct: boolean;
}

const DEFAULT_CONFIG: HandoffConfig = {
  enabled: false,
  alertPhone: "",
  clientMessage:
    "Entendido! Vou transferir você para um de nossos atendentes. Por favor, aguarde um momento.",
  operatorMessage: "",
  cooldownMinutes: 60,
  maxAlertsPerConversation: 3,
  autoSetHuman: true,
  triggerOnLowConfidence: true,
  triggerOnExplicitRequest: true,
  triggerOnRepetition: false,
  triggerOnCheckoutError: false,
  triggerOnNoProduct: false,
};

export default function AvisosPage() {
  const [config, setConfig] = useState<HandoffConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenant/handoff-config")
      .then((r) => r.json())
      .then((data) => {
        if (data) setConfig({ ...DEFAULT_CONFIG, ...data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/tenant/handoff-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erro ao salvar");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof HandoffConfig) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avisos & Escalação Humana</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure quando e como o bot deve alertar um atendente humano e transferir o cliente.
        </p>
      </div>

      {/* Master toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Ativar escalação humana</p>
            <p className="text-sm text-gray-500">Permite que o bot encaminhe conversas para atendentes.</p>
          </div>
          <button
            onClick={() => toggle("enabled")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.enabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Operator phone */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Contato do Operador</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do WhatsApp do atendente (formato internacional)
              </label>
              <input
                type="text"
                placeholder="5511999990000"
                value={config.alertPhone}
                onChange={(e) => setConfig((p) => ({ ...p, alertPhone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                O bot enviará um alerta para este número quando a escalação for acionada.
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Mensagens</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem para o cliente (ao transferir)
              </label>
              <textarea
                rows={3}
                value={config.clientMessage}
                onChange={(e) => setConfig((p) => ({ ...p, clientMessage: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template do aviso ao operador{" "}
                <span className="text-gray-400">(deixe vazio para usar o padrão)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Deixe vazio para usar o aviso padrão gerado automaticamente pelo sistema."
                value={config.operatorMessage}
                onChange={(e) => setConfig((p) => ({ ...p, operatorMessage: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Triggers */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Gatilhos de Escalação</h2>

            {[
              {
                key: "triggerOnExplicitRequest" as const,
                label: "Pedido explícito do cliente",
                desc: 'Quando o cliente pede para falar com "humano", "atendente" ou "pessoa".',
              },
              {
                key: "triggerOnLowConfidence" as const,
                label: "IA sem resposta segura",
                desc: "Quando a IA indica que não tem certeza ou não consegue ajudar.",
              },
              {
                key: "triggerOnRepetition" as const,
                label: "Intenção repetida sem resolução",
                desc: "Quando o cliente repete a mesma intenção sem receber uma resposta satisfatória.",
              },
              {
                key: "triggerOnCheckoutError" as const,
                label: "Erro ao gerar checkout",
                desc: "Quando o sistema não consegue criar o link de pagamento.",
              },
              {
                key: "triggerOnNoProduct" as const,
                label: "Nenhum produto encontrado",
                desc: "Quando a IA detecta intenção de compra mas não encontra produto correspondente.",
              },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start gap-3">
                <button
                  onClick={() => toggle(key)}
                  className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    config[key] ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      config[key] ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Anti-spam */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">Anti-spam</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooldown entre alertas (minutos)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={config.cooldownMinutes}
                  onChange={(e) =>
                    setConfig((p) => ({ ...p, cooldownMinutes: parseInt(e.target.value) || 60 }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de alertas por conversa
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.maxAlertsPerConversation}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      maxAlertsPerConversation: parseInt(e.target.value) || 3,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <button
                onClick={() => toggle("autoSetHuman")}
                className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  config.autoSetHuman ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    config.autoSetHuman ? "translate-x-4.5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Pausar IA automaticamente ao escalar
                </p>
                <p className="text-xs text-gray-500">
                  Define a conversa como "Atendimento Humano" para que a IA pare de responder.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">Configurações salvas!</span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
