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
  webhookRegistered?: boolean;
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
  const [showApiKey, setShowApiKey] = useState(false);

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
        body: JSON.stringify({ environment, enabled, apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar configuração");
      setConfig(data);
      setApiKey("");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm"
        >
          ← Voltar
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Configuração de Pagamentos</h1>
      </div>

      {/* Current config summary */}
      {config?.id && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">API Key</span>
            <span className="font-mono text-gray-700">{config.apiKeyMasked}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Ambiente</span>
            <span className={config.environment === "production" ? "text-green-700 font-medium" : "text-yellow-700 font-medium"}>
              {config.environment === "production" ? "Produção" : "Sandbox"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Webhook</span>
            {config.webhookRegistered ? (
              <span className="text-green-700 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Registrado automaticamente
              </span>
            ) : (
              <span className="text-red-600 font-medium">Não registrado</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status</span>
            <span className={config.enabled ? "text-green-700 font-medium" : "text-gray-500"}>
              {config.enabled ? "Habilitado" : "Desabilitado"}
            </span>
          </div>
          {config.updatedAt && (
            <p className="text-gray-400 text-xs pt-1 border-t border-gray-200">
              Atualizado em {new Date(config.updatedAt).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ambiente</label>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="sandbox">Sandbox (testes)</option>
            <option value="production">Produção</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            API Key Asaas
            <span className="text-gray-400 font-normal ml-1">
              (Conta Asaas → Integrações → Gerar chave)
            </span>
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.apiKeyMasked ? `Atual: ${config.apiKeyMasked}` : "Cole aqui a sua API Key"}
              className="w-full px-3 py-2 pr-20 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs px-1"
            >
              {showApiKey ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            A chave é salva com segurança e nunca exibida novamente.
          </p>
        </div>

        {/* What happens automatically */}
        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 text-sm space-y-1.5">
          <p className="text-indigo-700 font-medium text-xs uppercase tracking-wide">O que acontece ao salvar</p>
          <ul className="text-indigo-600 space-y-1 text-xs">
            <li>✓ Token de segurança gerado automaticamente</li>
            <li>✓ Webhook registrado na sua conta Asaas automaticamente</li>
            <li>✓ Nenhuma configuração manual necessária no painel Asaas</li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              enabled ? "bg-indigo-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-gray-700">
            {enabled ? "Pagamentos habilitados" : "Pagamentos desabilitados"}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm space-y-0.5">
            <p className="font-medium">Configuração salva com sucesso.</p>
            {config?.webhookRegistered ? (
              <p className="text-xs text-green-600">Webhook registrado automaticamente na sua conta Asaas.</p>
            ) : (
              <p className="text-xs text-yellow-600">Aviso: não foi possível registrar o webhook automaticamente. Tente salvar novamente.</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !apiKey.trim()}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {saving ? "Salvando e registrando webhook..." : "Salvar configuração"}
        </button>

        {config?.id && !config.webhookRegistered && (
          <p className="text-xs text-center text-yellow-600">
            Webhook não registrado. Salve novamente para tentar o registro automático.
          </p>
        )}
      </form>
    </div>
  );
}
