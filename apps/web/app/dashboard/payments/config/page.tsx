"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface PaymentConfig {
  id?: string;
  provider: string;
  environment: string;
  enabled: boolean;
  apiKeyMasked?: string;
  hasWebhookToken?: boolean;
  updatedAt?: string;
}

export default function PaymentsConfigPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [environment, setEnvironment] = useState("sandbox");
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [webhookAuthToken, setWebhookAuthToken] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookToken, setShowWebhookToken] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/payments/config", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setConfig(data);
          setEnvironment(data.environment);
          setEnabled(data.enabled);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/payments/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: "asaas",
          environment,
          enabled,
          apiKey,
          webhookAuthToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar configuração");
      setConfig(data);
      setApiKey("");
      setWebhookAuthToken("");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/asaas?tenantId=SEU_TENANT_ID`
      : "/api/webhook/asaas?tenantId=SEU_TENANT_ID";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/payments")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Voltar
        </button>
        <h1 className="text-xl font-semibold text-white">Configuração de Pagamentos</h1>
      </div>

      {config?.id && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 space-y-1">
          <p>
            <span className="text-gray-400">Provider:</span>{" "}
            <span className="text-white font-medium">{config.provider}</span>
          </p>
          <p>
            <span className="text-gray-400">API Key:</span>{" "}
            <span className="font-mono">{config.apiKeyMasked}</span>
          </p>
          <p>
            <span className="text-gray-400">Webhook Token:</span>{" "}
            <span>{config.hasWebhookToken ? "Configurado ✓" : "Não configurado"}</span>
          </p>
          <p>
            <span className="text-gray-400">Status:</span>{" "}
            <span
              className={
                config.enabled
                  ? "text-green-400 font-medium"
                  : "text-yellow-400 font-medium"
              }
            >
              {config.enabled ? "Habilitado" : "Desabilitado"}
            </span>
          </p>
          {config.updatedAt && (
            <p className="text-gray-500 text-xs">
              Atualizado em{" "}
              {new Date(config.updatedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Ambiente</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="sandbox">Sandbox (testes)</option>
            <option value="production">Produção</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">
            API Key Asaas{" "}
            <span className="text-gray-500 font-normal">
              (Conta → Integrações → Gerar chave)
            </span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                config?.apiKeyMasked ? `Atual: ${config.apiKeyMasked}` : "Cole aqui a sua API Key"
              }
              className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              {showApiKey ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            A chave é salva de forma segura e nunca é exibida novamente.
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1.5">
            Webhook Auth Token{" "}
            <span className="text-gray-500 font-normal">
              (configure no painel Asaas → Webhooks)
            </span>
          </label>
          <div className="relative">
            <input
              type={showWebhookToken ? "text" : "password"}
              value={webhookAuthToken}
              onChange={(e) => setWebhookAuthToken(e.target.value)}
              placeholder={
                config?.hasWebhookToken ? "Token já configurado" : "Token de autenticação do webhook"
              }
              className="w-full px-3 py-2 pr-10 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowWebhookToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
            >
              {showWebhookToken ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2 font-medium">URL do Webhook (configure no Asaas)</p>
          <code className="text-xs text-indigo-300 break-all">
            {`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/asaas?tenantId=`}
            <span className="text-yellow-300">SEU_TENANT_ID</span>
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE, PAYMENT_DELETED, PAYMENT_REFUNDED
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              enabled ? "bg-indigo-600" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-300">
            {enabled ? "Pagamentos habilitados" : "Pagamentos desabilitados"}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Configuração salva com sucesso.
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !apiKey.trim() || !webhookAuthToken.trim()}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {saving ? "Salvando..." : "Salvar configuração"}
        </button>
      </form>
    </div>
  );
}
