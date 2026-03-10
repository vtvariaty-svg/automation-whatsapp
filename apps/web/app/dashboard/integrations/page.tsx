"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

interface WhatsAppStatus {
  connected: boolean;
  hasFullConfig: boolean;
  whatsappBusinessAccountId: string | null;
  whatsappPhoneNumberId: string | null;
}

function IntegrationsContent() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualWabaId, setManualWabaId] = useState("");
  const [manualPhoneId, setManualPhoneId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const phone = searchParams.get("phone");

    if (success === "true") {
      setMessage(phone
        ? `✅ WhatsApp conectado com sucesso! Número: ${phone}`
        : "✅ WhatsApp conectado com sucesso!"
      );
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: "Autorização cancelada pelo usuário.",
        no_token: "Token não recebido do Facebook. Tente novamente.",
        no_tenant: "Sessão expirada. Faça login novamente.",
        process_failed: "Falha ao processar conexão. Tente conectar manualmente.",
        network: "Erro de rede. Verifique sua conexão.",
        missing_app_id: "NEXT_PUBLIC_FB_APP_ID não configurada no servidor.",
        server_error: "Erro interno do servidor.",
      };
      setMessage("❌ " + (errorMessages[error] || `Erro: ${error}`));
      window.history.replaceState({}, "", "/dashboard/integrations");
    }

    fetchStatus();
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/integrations/whatsapp/status", { headers });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Error fetching status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/integrations/whatsapp/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp?")) return;

    setDisconnecting(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/integrations/whatsapp/disconnect", {
        method: "POST",
        headers,
      });
      if (res.ok) {
        setStatus({ connected: false, hasFullConfig: false, whatsappBusinessAccountId: null, whatsappPhoneNumberId: null });
        setMessage("WhatsApp desconectado.");
      } else {
        setMessage("❌ Erro ao desconectar.");
      }
    } catch (err: any) {
      setMessage("❌ Erro: " + err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualToken) {
      setMessage("❌ O Token de acesso é obrigatório.");
      return;
    }
    setSavingManual(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/integrations/whatsapp/callback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          accessToken: manualToken,
          wabaId: manualWabaId || undefined,
          phoneNumberId: manualPhoneId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("✅ WhatsApp configurado com sucesso!");
        setShowManualForm(false);
        fetchStatus();
      } else {
        setMessage("❌ Erro: " + (data.error || "Falha ao salvar"));
      }
    } catch (err: any) {
      setMessage("❌ Erro: " + err.message);
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <Card>
        <CardHeader className="mb-6">
          <CardTitle className="text-2xl">Integrações</CardTitle>
          <CardDescription>Conecte canais de atendimento e outras plataformas ao seu Workspace.</CardDescription>
        </CardHeader>

        {/* WhatsApp Integration Card */}
        <div className={`border rounded-xl p-6 transition ${
          status?.connected
            ? "border-green-300 bg-green-50/50"
            : "border-gray-200 hover:border-[#4f46e5]/40 hover:bg-gray-50/50"
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${
                status?.connected ? "bg-green-100 text-[#25D366]" : "bg-gray-100 text-gray-400"
              }`}>
                <span>📱</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-lg">WhatsApp Business</h3>
                  {!loading && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status?.connected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {status?.connected ? "● Conectado" : "○ Desconectado"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {status?.connected
                    ? status.hasFullConfig
                      ? "Conta WhatsApp Business conectada e pronta para uso."
                      : "Token salvo. Configure WABA ID e Phone ID abaixo para completar."
                    : "Conecte via Facebook ou configure manualmente."
                  }
                </p>
              </div>
            </div>

            {!loading && (
              <div className="flex gap-2">
                {status?.connected ? (
                  <Button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="md:w-auto w-full bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
                  >
                    {disconnecting ? "..." : "Desconectar"}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleConnect}
                      className="md:w-auto w-full bg-[#1877F2] hover:bg-[#166FE5] text-white focus:ring-[#1877F2]"
                    >
                      🔗 Facebook
                    </Button>
                    <Button
                      onClick={() => setShowManualForm(!showManualForm)}
                      className="md:w-auto w-full bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      ⚙️ Manual
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Connection details */}
          {status?.connected && (
            <div className="mt-4 pt-4 border-t border-green-200 grid grid-cols-1 md:grid-cols-2 gap-3">
              {status.whatsappBusinessAccountId && (
                <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">WABA ID</p>
                  <p className="text-sm font-mono text-gray-800">{status.whatsappBusinessAccountId}</p>
                </div>
              )}
              {status.whatsappPhoneNumberId && (
                <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone Number ID</p>
                  <p className="text-sm font-mono text-gray-800">{status.whatsappPhoneNumberId}</p>
                </div>
              )}
              {!status.hasFullConfig && (
                <div className="md:col-span-2">
                  <Button
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    ⚙️ Completar configuração manualmente
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Configuration Form */}
        {showManualForm && (
          <div className="mt-4 border border-gray-200 rounded-xl p-6 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-1">Configuração Manual</h4>
            <p className="text-sm text-gray-500 mb-4">
              Insira os dados do WhatsApp Business API. Encontre no{" "}
              <a href="https://developers.facebook.com" target="_blank" className="text-[#4f46e5] underline">
                Facebook Developer Console
              </a>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token de Acesso Permanente <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="EAAx..."
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WABA ID <span className="text-gray-400">(opcional)</span>
                  </label>
                  <Input
                    value={manualWabaId}
                    onChange={(e) => setManualWabaId(e.target.value)}
                    placeholder="Ex: 123456789"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number ID <span className="text-gray-400">(opcional)</span>
                  </label>
                  <Input
                    value={manualPhoneId}
                    onChange={(e) => setManualPhoneId(e.target.value)}
                    placeholder="Ex: 123456789"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleManualSave}
                  disabled={savingManual}
                  className="bg-[#25D366] hover:bg-[#1DA851] text-white"
                >
                  {savingManual ? "Salvando..." : "💾 Salvar Configuração"}
                </Button>
                <Button
                  onClick={() => setShowManualForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status messages */}
        {message && (
          <div className={`mt-6 px-4 py-3 rounded-lg text-sm font-medium border ${
            message.includes("❌") || message.includes("Erro")
              ? "bg-red-50 text-red-700 border-red-200"
              : message.includes("✅")
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
          }`}>
            {message}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-2 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#4f46e5] rounded-full animate-spin"></div>
            Verificando status da integração...
          </div>
        )}
      </Card>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto w-full">
        <Card>
          <CardHeader className="mb-6">
            <CardTitle className="text-2xl">Integrações</CardTitle>
            <CardDescription>Carregando...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  );
}
