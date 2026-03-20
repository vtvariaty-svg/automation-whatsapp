"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import PlanGate from "@/components/PlanGate";
import { useEntitlements } from "@/hooks/useEntitlements";

export const dynamic = "force-dynamic";

interface WhatsAppStatus {
  connected: boolean;
  hasFullConfig: boolean;
  whatsappBusinessAccountId: string | null;
  whatsappPhoneNumberId: string | null;
  displayPhone: string | null;
}

interface InstagramStatus {
  connected: boolean;
  pageId: string | null;
  igAccountId: string | null;
  username: string | null;
}

interface FacebookStatus {
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-gray-400"}`}></span>
      {connected ? "Conectado" : "Desconectado"}
    </span>
  );
}

function IntegrationsContent() {
  const ent = useEntitlements();
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [igStatus, setIgStatus] = useState<InstagramStatus | null>(null);
  const [fbStatus, setFbStatus] = useState<FacebookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualWabaId, setManualWabaId] = useState("");
  const [manualPhoneId, setManualPhoneId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [embeddedLoading, setEmbeddedLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
    return { Authorization: `Bearer ${token}` };
  };

  const fetchAll = useCallback(async () => {
    try {
      const headers = authHeaders();
      const [waRes, igRes, fbRes] = await Promise.all([
        fetch("/api/integrations/whatsapp/status", { headers }),
        fetch("/api/integrations/instagram/status", { headers }),
        fetch("/api/integrations/facebook/status", { headers }),
      ]);
      if (waRes.ok) setWaStatus(await waRes.json());
      if (igRes.ok) setIgStatus(await igRes.json());
      if (fbRes.ok) setFbStatus(await fbRes.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true" || success === "instagram" || success === "facebook") {
      const channel = success === "true" ? "WhatsApp" : success === "instagram" ? "Instagram" : "Facebook";
      const extra = searchParams.get("phone") || searchParams.get("username") || searchParams.get("page") || "";
      setMessage(`✅ ${channel} conectado!${extra ? ` (${extra})` : ""}`);
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (error) {
      const msgs: Record<string, string> = {
        oauth_cancelled: "Autorização cancelada.",
        no_token: "Token não recebido.",
        no_tenant: "Sessão expirada.",
        process_failed: "Falha na conexão.",
        no_instagram_account: "Nenhuma conta Instagram Business encontrada. Certifique-se de que sua página do Facebook está vinculada a uma conta Instagram Business.",
        no_facebook_page: "Nenhuma página do Facebook encontrada.",
        token_exchange: "Erro ao trocar o token. Tente novamente.",
        plan_required: searchParams.get("message") || "Recurso não disponível no seu plano atual.",
      };
      setMessage("❌ " + (msgs[error] || `Erro: ${error}`));
      window.history.replaceState({}, "", "/dashboard/integrations");
    }
    fetchAll();
  }, [searchParams, fetchAll]);

  const initFbSdk = useCallback(() => {
    if (!appId) return;
    if ((window as any).FB) {
      (window as any).FB.init({ appId, autoLogAppEvents: true, xfbml: true, version: "v22.0" });
      setSdkReady(true);
    }
  }, [appId]);

  const saveWhatsAppToken = async (accessToken: string, wabaId?: string, phoneNumberId?: string) => {
    try {
      const res = await fetch("/api/integrations/whatsapp/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ accessToken, wabaId, phoneNumberId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(data.phoneDisplay ? `✅ WhatsApp conectado! Número: ${data.phoneDisplay}` : "✅ WhatsApp conectado!");
        fetchAll();
      } else {
        setMessage("❌ " + (data.error || "Falha ao conectar"));
      }
    } catch (err: any) {
      setMessage("❌ Erro: " + err.message);
    } finally {
      setEmbeddedLoading(false);
    }
  };

  const handleEmbeddedSignup = () => {
    if (!appId || !(window as any).FB) { setMessage("❌ Facebook SDK não carregado."); return; }
    if (embeddedLoading) { setEmbeddedLoading(false); return; }
    setEmbeddedLoading(true);
    setMessage("");

    // Capture WABA ID and Phone Number ID sent by Meta during Embedded Signup
    let capturedWabaId: string | undefined;
    let capturedPhoneId: string | undefined;

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP" && data.event === "FINISH") {
          capturedWabaId = data.data?.waba_id || undefined;
          capturedPhoneId = data.data?.phone_number_id || undefined;
        }
      } catch {}
    };
    window.addEventListener("message", messageHandler);

    const timeout = setTimeout(() => {
      setEmbeddedLoading(false);
      window.removeEventListener("message", messageHandler);
    }, 60000);

    (window as any).FB.login(
      (response: any) => {
        clearTimeout(timeout);
        window.removeEventListener("message", messageHandler);
        if (response.authResponse?.accessToken) {
          saveWhatsAppToken(response.authResponse.accessToken, capturedWabaId, capturedPhoneId);
        } else {
          setEmbeddedLoading(false);
          setMessage("❌ Autorização cancelada.");
        }
      },
      {
        scope: "whatsapp_business_management,whatsapp_business_messaging",
        extras: {
          feature: "whatsapp_embedded_signup",
          version: 2,
          sessionInfoVersion: 3,
        },
      }
    );
  };

  const handleDisconnect = async (channel: "whatsapp" | "instagram" | "facebook") => {
    if (!confirm(`Tem certeza que deseja desconectar o ${channel}?`)) return;
    setDisconnecting(channel);
    try {
      const res = await fetch(`/api/integrations/${channel}/disconnect`, { method: "POST", headers: authHeaders() });
      if (res.ok) {
        setMessage(`✅ ${channel} desconectado.`);
        fetchAll();
      } else {
        setMessage("❌ Erro ao desconectar.");
      }
    } catch { setMessage("❌ Erro ao desconectar."); }
    finally { setDisconnecting(null); }
  };

  const handleManualSave = async () => {
    if (!waStatus?.connected && !manualToken) { setMessage("❌ Token é obrigatório."); return; }
    if (!manualWabaId && !manualPhoneId) { setMessage("❌ Insira WABA ID ou Phone Number ID."); return; }
    setSavingManual(true);
    try {
      const body: any = { wabaId: manualWabaId || undefined, phoneNumberId: manualPhoneId || undefined };
      body.accessToken = manualToken || "__KEEP_EXISTING__";
      const res = await fetch("/api/integrations/whatsapp/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) { setMessage("✅ Configuração salva!"); setShowManualForm(false); fetchAll(); }
      else setMessage("❌ " + (data.error || "Falha ao salvar"));
    } catch (err: any) { setMessage("❌ " + err.message); }
    finally { setSavingManual(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {appId && <Script src="https://connect.facebook.net/pt_BR/sdk.js" strategy="lazyOnload" onLoad={initFbSdk} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
        <p className="text-sm text-gray-500 mt-1">Conecte canais de atendimento ao seu workspace</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.includes("❌") ? "bg-red-50 text-red-700 border-red-100"
          : "bg-emerald-50 text-emerald-700 border-emerald-100"
        }`}>{message}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* ── WhatsApp Card — Standard+ ─────────────────── */}
          <PlanGate feature="whatsapp" allowed={ent.features.whatsapp} loading={ent.loading} name="WhatsApp Business" icon="💬" minPlan="standard">
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${waStatus?.connected ? "border-emerald-200" : "border-gray-200/60"}`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${waStatus?.connected ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100" : "bg-gray-50/50 border-gray-100"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${waStatus?.connected ? "bg-[#25D366]" : "bg-white border border-gray-200"}`}>
                  {waStatus?.connected ? "✅" : "💬"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">WhatsApp Business</h3>
                    <StatusBadge connected={!!waStatus?.connected} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {waStatus?.connected ? "Conta ativa e pronta para atendimento" : "Conecte via Meta WhatsApp Business API"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {waStatus?.connected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {waStatus.whatsappBusinessAccountId && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">WABA ID</p>
                        <p className="text-sm font-mono text-gray-800">{waStatus.whatsappBusinessAccountId}</p>
                      </div>
                    )}
                    {waStatus.whatsappPhoneNumberId && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number ID</p>
                        <p className="text-sm font-mono text-gray-800">{waStatus.whatsappPhoneNumberId}</p>
                      </div>
                    )}
                    {waStatus.displayPhone && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Número</p>
                        <p className="text-sm font-mono text-gray-800">{waStatus.displayPhone}</p>
                      </div>
                    )}
                  </div>
                  {!waStatus.hasFullConfig && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                      ⚠️ WABA ID ou Phone ID não detectados.{" "}
                      <button onClick={() => setShowManualForm(!showManualForm)} className="font-semibold underline">
                        {showManualForm ? "Fechar" : "Completar manualmente"}
                      </button>
                    </div>
                  )}
                  {showManualForm && (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">WABA ID</label>
                          <input value={manualWabaId} onChange={e => setManualWabaId(e.target.value)} placeholder="Ex: 123456789012345" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number ID</label>
                          <input value={manualPhoneId} onChange={e => setManualPhoneId(e.target.value)} placeholder="Ex: 123456789012345" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono" />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleManualSave} disabled={savingManual} className="px-5 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm disabled:opacity-50">
                          {savingManual ? <span>Salvando...</span> : <span>Salvar IDs</span>}
                        </button>
                        <button onClick={() => setShowManualForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">Cancelar</button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <Link href="/dashboard/conversations" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-colors">
                      💬 Ver Conversas →
                    </Link>
                    <button onClick={() => handleDisconnect("whatsapp")} disabled={disconnecting === "whatsapp"} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 disabled:opacity-50">
                      {disconnecting === "whatsapp" ? <span>Desconectando...</span> : <span>Desconectar</span>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-5 bg-gradient-to-r from-[#25D366]/5 to-emerald-50/50 rounded-xl border border-[#25D366]/20">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white shrink-0">📱</div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Conexão Automática</h4>
                        <p className="text-sm text-gray-500 mb-4">Conecte com 1 clique via Facebook Embedded Signup.</p>
                        <button onClick={handleEmbeddedSignup} disabled={embeddedLoading || !appId} className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#1DA851] transition-all disabled:opacity-50">
                          {embeddedLoading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                              <span>Conectando...</span>
                            </span>
                          ) : (
                            <span>Conectar WhatsApp</span>
                          )}
                        </button>
                        {!appId && <p className="text-xs text-red-500 mt-2">⚠️ NEXT_PUBLIC_FB_APP_ID não configurado.</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4"><div className="flex-1 h-px bg-gray-200"></div><span className="text-xs text-gray-400">ou</span><div className="flex-1 h-px bg-gray-200"></div></div>
                  <div onClick={() => setShowManualForm(!showManualForm)} className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <span>⚙️</span>
                      <div className="text-left">
                        <span className="block font-semibold text-gray-900 text-sm">Configuração Manual</span>
                        <span className="block text-xs text-gray-500">Token + IDs do Developer Console</span>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showManualForm ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {showManualForm && (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Token de Acesso <span className="text-red-500">*</span></label>
                        <input type="password" value={manualToken} onChange={e => setManualToken(e.target.value)} placeholder="EAAx..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">WABA ID</label>
                          <input value={manualWabaId} onChange={e => setManualWabaId(e.target.value)} placeholder="123456789" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number ID</label>
                          <input value={manualPhoneId} onChange={e => setManualPhoneId(e.target.value)} placeholder="123456789" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleManualSave} disabled={savingManual} className="px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm disabled:opacity-50">
                          {savingManual ? <span>Salvando...</span> : <span>Salvar</span>}
                        </button>
                        <button onClick={() => setShowManualForm(false)} className="px-5 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-xl">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          </PlanGate>

          {/* ── Instagram Card — all plans ────────────────── */}
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${igStatus?.connected ? "border-pink-200" : "border-gray-200/60"}`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${igStatus?.connected ? "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100" : "bg-gray-50/50 border-gray-100"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${igStatus?.connected ? "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]" : "bg-white border border-gray-200"}`}>
                  📸
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">Instagram</h3>
                    <StatusBadge connected={!!igStatus?.connected} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {igStatus?.connected ? `@${igStatus.username || igStatus.igAccountId}` : "DMs, comentários e automações"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {igStatus?.connected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {igStatus.username && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Username</p>
                        <p className="text-sm font-mono text-gray-800">@{igStatus.username}</p>
                      </div>
                    )}
                    {igStatus.pageId && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Page ID</p>
                        <p className="text-sm font-mono text-gray-800">{igStatus.pageId}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-pink-50 rounded-xl border border-pink-100 text-sm text-pink-700">
                    DMs e comentários do Instagram estão sendo processados automaticamente.
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href="/dashboard/conversations" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-pink-700 bg-pink-50 rounded-xl hover:bg-pink-100 border border-pink-100 transition-colors">
                      💬 Ver Conversas →
                    </Link>
                    <button onClick={() => handleDisconnect("instagram")} disabled={disconnecting === "instagram"} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 disabled:opacity-50">
                      {disconnecting === "instagram" ? <span>Desconectando...</span> : <span>Desconectar</span>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-r from-pink-50/50 to-purple-50/50 rounded-xl border border-pink-100/50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shrink-0">📸</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Conectar Instagram Business</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Responda DMs, automatize comentários e crie sequências de conversão. Requer conta Instagram Business vinculada a uma Página do Facebook.
                      </p>
                      <a href="/api/integrations/instagram/connect" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:shadow-lg" style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
                        Conectar Instagram
                      </a>
                      <p className="text-xs text-gray-400 mt-3">
                        Precisa de: Instagram Business + Página do Facebook vinculada.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Facebook Messenger Card — Pro+ ────────────── */}
          <PlanGate feature="facebook" allowed={ent.features.facebook} loading={ent.loading} name="Facebook Messenger" icon="💬" minPlan="pro">
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${fbStatus?.connected ? "border-blue-200" : "border-gray-200/60"}`}>
            <div className={`px-6 py-5 border-b flex items-center justify-between ${fbStatus?.connected ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100" : "bg-gray-50/50 border-gray-100"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${fbStatus?.connected ? "bg-[#1877F2]" : "bg-white border border-gray-200"}`}>
                  💬
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">Facebook Messenger</h3>
                    <StatusBadge connected={!!fbStatus?.connected} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {fbStatus?.connected ? fbStatus.pageName || "Página conectada" : "Atenda DMs da sua Página no Facebook"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {fbStatus?.connected ? (
                <div className="space-y-4">
                  {fbStatus.pageName && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 inline-block">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Página</p>
                      <p className="text-sm font-semibold text-gray-800">{fbStatus.pageName}</p>
                    </div>
                  )}
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
                    Mensagens do Facebook Messenger estão sendo processadas automaticamente.
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href="/dashboard/conversations" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors">
                      💬 Ver Conversas →
                    </Link>
                    <button onClick={() => handleDisconnect("facebook")} disabled={disconnecting === "facebook"} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 disabled:opacity-50">
                      {disconnecting === "facebook" ? <span>Desconectando...</span> : <span>Desconectar</span>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shrink-0">💬</div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Conectar Facebook Messenger</h4>
                      <p className="text-sm text-gray-500 mb-4">
                        Responda mensagens diretas da sua Página do Facebook com IA e automações.
                      </p>
                      <a href="/api/integrations/facebook/connect" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#1565D8] text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg">
                        Conectar Facebook
                      </a>
                      <p className="text-xs text-gray-400 mt-3">Requer uma Página do Facebook com permissão de mensagens.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </PlanGate>
        </>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div></div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
