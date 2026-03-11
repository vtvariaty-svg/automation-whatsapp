"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

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
  const [embeddedLoading, setEmbeddedLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const searchParams = useSearchParams();
  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const phone = searchParams.get("phone");

    if (success === "true") {
      setMessage(phone ? `✅ WhatsApp conectado! Número: ${phone}` : "✅ WhatsApp conectado!");
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_cancelled: "Autorização cancelada.",
        no_token: "Token não recebido. Tente novamente.",
        no_tenant: "Sessão expirada. Faça login novamente.",
        process_failed: "Falha na conexão.",
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
      if (res.ok) setStatus(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  // Initialize Facebook SDK
  const initFbSdk = useCallback(() => {
    if (!appId) return;
    if ((window as any).FB) {
      (window as any).FB.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v22.0",
      });
      setSdkReady(true);
    }
  }, [appId]);

  // Save token to our API (separate async function)
  const saveWhatsAppToken = async (accessToken: string) => {
    try {
      const jwtToken = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (jwtToken) headers["Authorization"] = `Bearer ${jwtToken}`;

      const res = await fetch("/api/integrations/whatsapp/callback", {
        method: "POST",
        headers,
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(
          data.phoneDisplay
            ? `✅ WhatsApp conectado! Número: ${data.phoneDisplay}`
            : data.wabaId
              ? "✅ WhatsApp conectado com sucesso!"
              : "✅ Token salvo! Configure WABA ID e Phone ID manualmente se necessário."
        );
        fetchStatus();
      } else {
        setMessage("❌ " + (data.error || "Falha ao conectar"));
      }
    } catch (err: any) {
      setMessage("❌ Erro: " + err.message);
    } finally {
      setEmbeddedLoading(false);
    }
  };

  // Embedded Signup handler - uses direct token flow
  const handleEmbeddedSignup = () => {
    if (!appId || !(window as any).FB) {
      setMessage("❌ Facebook SDK não carregado. Recarregue a página.");
      return;
    }

    if (embeddedLoading) {
      setEmbeddedLoading(false);
      return;
    }

    setEmbeddedLoading(true);
    setMessage("");

    // Safety timeout
    const timeout = setTimeout(() => {
      setEmbeddedLoading(false);
    }, 60000);

    (window as any).FB.login(
      function(response: any) {
        clearTimeout(timeout);
        if (response.authResponse && response.authResponse.accessToken) {
          saveWhatsAppToken(response.authResponse.accessToken);
        } else {
          setEmbeddedLoading(false);
          setMessage("❌ Autorização cancelada.");
        }
      },
      {
        scope: "whatsapp_business_management,whatsapp_business_messaging",
      }
    );
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp?")) return;
    setDisconnecting(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/integrations/whatsapp/disconnect", { method: "POST", headers });
      if (res.ok) {
        setStatus({ connected: false, hasFullConfig: false, whatsappBusinessAccountId: null, whatsappPhoneNumberId: null });
        setMessage("✅ WhatsApp desconectado com sucesso.");
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Disconnect error:", res.status, data);
        setMessage("❌ Erro ao desconectar: " + (data.error || `Status ${res.status}`));
      }
    } catch (err: any) {
      console.error("Disconnect exception:", err);
      setMessage("❌ Erro: " + err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleManualSave = async () => {
    // When already connected, token is optional (already saved)
    if (!status?.connected && !manualToken) {
      setMessage("❌ O Token de acesso é obrigatório.");
      return;
    }
    if (!manualWabaId && !manualPhoneId) {
      setMessage("❌ Insira pelo menos WABA ID ou Phone Number ID.");
      return;
    }
    setSavingManual(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const body: any = { wabaId: manualWabaId || undefined, phoneNumberId: manualPhoneId || undefined };
      if (manualToken) body.accessToken = manualToken;
      // If already connected but no manual token, we still need to send something
      if (!body.accessToken) body.accessToken = "__KEEP_EXISTING__";
      
      const res = await fetch("/api/integrations/whatsapp/callback", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("✅ Configuração atualizada com sucesso!");
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Facebook SDK */}
      {appId && (
        <Script
          src="https://connect.facebook.net/pt_BR/sdk.js"
          strategy="lazyOnload"
          onLoad={initFbSdk}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
        <p className="text-sm text-gray-500 mt-1">Conecte canais de atendimento ao seu workspace</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.includes("❌") ? "bg-red-50 text-red-700 border-red-100"
            : message.includes("✅") ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-blue-50 text-blue-700 border-blue-100"
        }`}>
          {message}
        </div>
      )}

      {/* WhatsApp Card */}
      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        status?.connected ? "border-emerald-200" : "border-gray-200/60"
      }`}>
        {/* Card header */}
        <div className={`px-6 py-5 border-b ${
          status?.connected
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100"
            : "bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-gray-100"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${
                status?.connected ? "bg-[#25D366] text-white" : "bg-white border border-gray-200"
              }`}>
                {status?.connected ? "✅" : "💬"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-lg">WhatsApp Business</h3>
                  {!loading && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      status?.connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                      {status?.connected ? "Conectado" : "Desconectado"}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {status?.connected
                    ? "Sua conta WhatsApp Business está ativa e pronta"
                    : "Conecte seu WhatsApp Business para automação"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
            </div>
          ) : status?.connected ? (
            /* Connected state */
            <div className="space-y-4">
              {/* Connection details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {status.whatsappBusinessAccountId && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">WABA ID</p>
                    <p className="text-sm font-mono text-gray-800">{status.whatsappBusinessAccountId}</p>
                  </div>
                )}
                {status.whatsappPhoneNumberId && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number ID</p>
                    <p className="text-sm font-mono text-gray-800">{status.whatsappPhoneNumberId}</p>
                  </div>
                )}
              </div>

              {!status.hasFullConfig && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                  ⚠️ Token salvo, mas WABA ID ou Phone ID não foram detectados.{" "}
                  <button onClick={() => setShowManualForm(!showManualForm)} className="font-semibold underline hover:no-underline">
                    {showManualForm ? "Fechar formulário" : "Completar manualmente"}
                  </button>
                </div>
              )}

              {/* Inline manual form for completing WABA/Phone IDs */}
              {showManualForm && (
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">WABA ID</label>
                      <input
                        value={manualWabaId}
                        onChange={(e) => setManualWabaId(e.target.value)}
                        placeholder="Ex: 123456789012345"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number ID</label>
                      <input
                        value={manualPhoneId}
                        onChange={(e) => setManualPhoneId(e.target.value)}
                        placeholder="Ex: 123456789012345"
                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleManualSave}
                      disabled={savingManual || (!manualWabaId && !manualPhoneId)}
                      className="px-5 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {savingManual ? "Salvando..." : "Salvar IDs"}
                    </button>
                    <button
                      onClick={() => setShowManualForm(false)}
                      className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Encontre esses IDs no{" "}
                    <a href="https://developers.facebook.com" target="_blank" className="text-[#4f46e5] underline">
                      Facebook Developer Console
                    </a>
                    {" → WhatsApp → Configuração da API"}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50"
                >
                  {disconnecting ? "Desconectando..." : "Desconectar WhatsApp"}
                </button>
              </div>
            </div>
          ) : (
            /* Not connected - show connection options */
            <div className="space-y-4">
              {/* Primary: Embedded Signup */}
              <div className="p-5 bg-gradient-to-r from-[#25D366]/5 to-emerald-50/50 rounded-xl border border-[#25D366]/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white text-lg shrink-0 shadow-sm">
                    📱
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-1">Conexão Automática</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Conecte com 1 clique via Facebook. Detectamos automaticamente sua conta WhatsApp Business.
                    </p>
                    <button
                      onClick={handleEmbeddedSignup}
                      disabled={embeddedLoading || !appId}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#1DA851] hover:shadow-lg hover:shadow-green-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {embeddedLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Conectando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.549 4.104 1.511 5.833L0 24l6.335-1.466A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.819a9.782 9.782 0 01-5.292-1.542l-.38-.226-3.933.912.992-3.635-.248-.395A9.787 9.787 0 012.181 12c0-5.414 4.406-9.819 9.819-9.819S21.819 6.586 21.819 12s-4.405 9.819-9.819 9.819z"/>
                          </svg>
                          Conectar WhatsApp
                        </>
                      )}
                    </button>
                    {!appId && (
                      <p className="text-xs text-red-500 mt-2">⚠️ NEXT_PUBLIC_FB_APP_ID não configurado.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-1">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 font-medium">ou</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Secondary: Manual config */}
              <div>
                <button
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚙️</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Configuração Manual</p>
                      <p className="text-xs text-gray-500">Insira token e IDs do Facebook Developer Console</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showManualForm ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Configuration Form (expandable) */}
      {showManualForm && !status?.connected && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h4 className="font-bold text-gray-900">Configuração Manual</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Dados do{" "}
              <a href="https://developers.facebook.com" target="_blank" className="text-[#4f46e5] underline">
                Facebook Developer Console
              </a>
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Token de Acesso Permanente <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="EAAx..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all font-mono"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  WABA ID <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  value={manualWabaId}
                  onChange={(e) => setManualWabaId(e.target.value)}
                  placeholder="123456789"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number ID <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  value={manualPhoneId}
                  onChange={(e) => setManualPhoneId(e.target.value)}
                  placeholder="123456789"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all font-mono"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleManualSave}
                disabled={savingManual}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
              >
                {savingManual ? "Salvando..." : "Salvar Configuração"}
              </button>
              <button
                onClick={() => setShowManualForm(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Como funciona?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">1️⃣</div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Conecte</p>
            <p className="text-xs text-gray-500">Clique em "Conectar WhatsApp" e faça login no Facebook</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">2️⃣</div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Autorize</p>
            <p className="text-xs text-gray-500">Selecione sua conta WhatsApp Business</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl">3️⃣</div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Pronto!</p>
            <p className="text-xs text-gray-500">A IA começa a atender seus clientes automaticamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
        </div>
      }
    >
      <IntegrationsContent />
    </Suspense>
  );
}
