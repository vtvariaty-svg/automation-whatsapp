"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function WhatsAppCallbackPage() {
  const [status, setStatus] = useState("Processando autenticação do Facebook...");
  const { user } = useAuth();

  useEffect(() => {
    // Read the access token from the URL fragment (#access_token=...&state=...)
    const hash = window.location.hash.substring(1); // Remove the #
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const stateParam = params.get("state");

    if (!accessToken) {
      setStatus("❌ Token não recebido do Facebook. Tente novamente.");
      setTimeout(() => {
        window.location.href = "/dashboard/integrations?error=no_token";
      }, 2000);
      return;
    }

    // Decode state to get tenantId
    let tenantId: string | null = null;
    if (stateParam) {
      try {
        const stateJson = atob(stateParam);
        const state = JSON.parse(stateJson);
        tenantId = state.tenantId;
      } catch {
        console.error("Failed to decode state");
      }
    }

    // Fallback to user's tenantId from auth context
    if (!tenantId && user?.tenantId) {
      tenantId = user.tenantId;
    }

    if (!tenantId) {
      setStatus("❌ Não foi possível identificar o tenant. Tente novamente.");
      setTimeout(() => {
        window.location.href = "/dashboard/integrations?error=no_tenant";
      }, 2000);
      return;
    }

    // Send the token to our API for processing
    processToken(tenantId, accessToken);
  }, [user]);

  const processToken = async (tenantId: string, accessToken: string) => {
    setStatus("🔄 Conectando sua conta WhatsApp Business...");

    try {
      const res = await fetch("/api/integrations/whatsapp/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, accessToken }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const phoneInfo = data.phoneDisplay ? ` (${data.phoneDisplay})` : "";
        setStatus(`✅ WhatsApp conectado com sucesso!${phoneInfo} Redirecionando...`);
        setTimeout(() => {
          window.location.href = `/dashboard/integrations?success=true${data.phoneDisplay ? `&phone=${encodeURIComponent(data.phoneDisplay)}` : ""}`;
        }, 1500);
      } else {
        setStatus(`❌ Erro: ${data.error || "Falha ao processar token"}`);
        setTimeout(() => {
          window.location.href = "/dashboard/integrations?error=process_failed";
        }, 3000);
      }
    } catch (err: any) {
      setStatus(`❌ Erro de conexão: ${err.message}`);
      setTimeout(() => {
        window.location.href = "/dashboard/integrations?error=network";
      }, 3000);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">🔗</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Conectando WhatsApp</h2>
        <p className="text-gray-600">{status}</p>
        {status.includes("🔄") && (
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-3 border-gray-300 border-t-[#1877F2] rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
