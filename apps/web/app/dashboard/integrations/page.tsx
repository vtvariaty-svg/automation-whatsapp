"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface WhatsAppStatus {
  connected: boolean;
  whatsappBusinessAccountId: string | null;
  whatsappPhoneNumberId: string | null;
}

export default function IntegrationsPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL params for success/error from OAuth callback
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const phone = searchParams.get("phone");

    if (success === "true") {
      setMessage(phone
        ? `✅ WhatsApp conectado com sucesso! Número: ${phone}`
        : "✅ WhatsApp conectado com sucesso!"
      );
      // Clean URL params
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: "Autorização cancelada pelo usuário.",
        missing_params: "Parâmetros ausentes no retorno do Facebook.",
        invalid_state: "Estado inválido no retorno do Facebook.",
        missing_tenant: "Tenant não identificado.",
        server_config: "Configuração do servidor incompleta. Verifique FB_APP_SECRET no Render.",
        token_exchange: "Falha ao trocar código por token. Verifique as configurações do app no Facebook.",
        server_error: "Erro interno do servidor.",
      };
      setMessage("❌ " + (errorMessages[error] || `Erro desconhecido: ${error}`));
      window.history.replaceState({}, "", "/dashboard/integrations");
    }

    fetchStatus();
  }, [searchParams]);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/integrations/whatsapp/status", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
    // Redirect to the server-side OAuth connect route
    window.location.href = "/api/integrations/whatsapp/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp?")) return;

    setDisconnecting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/integrations/whatsapp/disconnect", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setStatus({ connected: false, whatsappBusinessAccountId: null, whatsappPhoneNumberId: null });
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
                status?.connected
                  ? "bg-green-100 text-[#25D366]"
                  : "bg-gray-100 text-gray-400"
              }`}>
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-lg">WhatsApp Business</h3>
                  {!loading && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status?.connected
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {status?.connected ? "● Conectado" : "○ Desconectado"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {status?.connected
                    ? "Sua conta WhatsApp Business está conectada e pronta para uso."
                    : "Conecte via Facebook para habilitar o envio e recebimento de mensagens."
                  }
                </p>
              </div>
            </div>

            {!loading && (
              status?.connected ? (
                <Button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="md:w-auto w-full bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
                >
                  {disconnecting ? "Desconectando..." : "Desconectar"}
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  className="md:w-auto w-full bg-[#1877F2] hover:bg-[#166FE5] text-white focus:ring-[#1877F2]"
                >
                  🔗 Conectar com Facebook
                </Button>
              )
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
            </div>
          )}
        </div>

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
