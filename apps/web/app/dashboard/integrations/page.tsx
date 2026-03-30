"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import PlanGate from "@/components/PlanGate";
import { useEntitlements } from "@/hooks/useEntitlements";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhatsAppStatus {
  connected: boolean;
  hasFullConfig: boolean;
  whatsappBusinessAccountId: string | null;
  whatsappPhoneNumberId: string | null;
  displayPhone: string | null;
}

interface InstagramStatus {
  connected: boolean;
  readyForMessages: boolean;
  subscriptionOk: boolean;
  tokenPresent: boolean;
  tokenExpiresAt: string | null;
  igUserId: string | null;
  username: string | null;
}

interface FacebookStatus {
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
}

interface IgPageCandidate {
  pageId: string;
  pageName: string;
  igAccountId: string;
  username: string | null;
  tasks: string[];
  eligibleForMessaging: boolean;
  diagnostic: string;
}

interface FbPageCandidate {
  pageId: string;
  pageName: string;
  tasks: string[];
  eligibleForMessaging: boolean;
}

// ─── UX helpers ───────────────────────────────────────────────────────────────

/** Maps internal diagnostic codes → human-friendly user message + guidance */
function igDiagnosticToLabel(diagnostic: string): { badge: string; guidance: string; color: "amber" | "red" | "blue" | "green" } {
  switch (diagnostic) {
    case "connected_instagram_account_present_but_instagram_business_account_missing":
      return { badge: "Vínculo parcial", guidance: "Instagram detectado, mas a API não retornou os dados completos de Conta Profissional.", color: "amber" };
    case "instagram_business_account_present":
      return { badge: "Mensagens desativadas", guidance: "Faltam permissões de mensagens (MESSAGING/MANAGE) nesta Página.", color: "amber" };
    case "page_token_probe_success_only":
      return { badge: "Acesso secundário", guidance: "Conta conectada, mas com falhas de permissão no token principal.", color: "blue" };
    case "page_token_missing":
      return { badge: "Vínculo não detectado", guidance: "Página não possui token isolado para concluir a validação profunda.", color: "amber" };
    case "unknown_probe_failure":
      return { badge: "Dados ocultados", guidance: "A Meta bloqueou o retorno dos dados da Página.", color: "red" };
    case "graph_permission_error":
      return { badge: "Permissão insuficiente", guidance: "Reconecte aceitando todas as permissões.", color: "red" };
    default:
      return { badge: "Não elegível", guidance: "Esta página não pode ser conectada.", color: "amber" };
  }
}

/** Maps error codes from URL → user-friendly explanation */
const IG_ERROR_MESSAGES: Record<string, { title: string; guidance: string }> = {
  oauth_cancelled: { title: "Autorização cancelada.", guidance: "Tente novamente e conclua o processo de autorização." },
  no_pages_found: { title: "Nenhuma Página do Facebook encontrada.", guidance: "Entre com uma conta Meta que administre ao menos uma Página do Facebook." },
  connected_instagram_account_present_but_instagram_business_account_missing: { title: "Sua conta foi autorizada. O vínculo foi detectado parcialmente, mas a API não retornou os dados completos para concluir a conexão.", guidance: "Acesse as configurações do Instagram e garanta que ele é uma Conta Profissional (Business)." },
  instagram_business_account_present: { title: "Sua conta foi autorizada, mas não foi possível confirmar a elegibilidade da Página para mensagens do Instagram.", guidance: "Acesse as configurações da sua Página no Facebook e ative as permissões avançadas de mensagens." },
  page_token_missing: { title: "Sua conta foi autorizada, mas a Meta não retornou o vínculo profissional esperado entre a Página e o Instagram.", guidance: "Não foi possível validar as permissões profundas. Reconecte nas configurações do Facebook marcando todas as caixas." },
  unknown_probe_failure: { title: "Sua conta foi autorizada. O vínculo foi detectado parcialmente, mas a API não retornou os dados completos para concluir a conexão.", guidance: "A Meta não expôs os dados da Página. Tente reconectar marcando todas as permissões exibidas no popup da Meta." },
  graph_permission_error: { title: "Sua conta foi autorizada, mas a Meta não retornou permissões suficientes nesta tentativa.", guidance: "Tente novamente garantindo que aceitou todas as permissões solicitadas." },
  no_instagram_account: { title: "Nenhuma conta Instagram Business encontrada.", guidance: "Certifique-se de que sua Página do Facebook está vinculada a uma conta Instagram Business." },
  token_exchange: { title: "Erro ao autenticar com a Meta.", guidance: "Tente novamente. Se o problema persistir, contate o suporte." },
  server_error: { title: "Erro interno.", guidance: "Tente novamente em alguns instantes." },
  missing_instagram_config: { title: "Configuração incompleta.", guidance: "Contate o suporte." },
};

const FB_ERROR_MESSAGES: Record<string, { title: string; guidance: string }> = {
  no_facebook_page: {
    title: "Nenhuma Página do Facebook encontrada.",
    guidance: "Entre com uma conta Meta que administre ao menos uma Página.",
  },
  no_eligible_facebook_page: {
    title: "Nenhuma página está pronta para mensagens.",
    guidance: "Ative as permissões de mensagens na sua Página do Facebook e tente novamente.",
  },
  token_exchange: {
    title: "Erro ao autenticar com a Meta.",
    guidance: "Tente novamente.",
  },
  server_error: { title: "Erro interno.", guidance: "Tente novamente em alguns instantes." },
};

// ─── Reusable UI atoms ────────────────────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-gray-400"}`} />
      {connected ? "Conectado" : "Desconectado"}
    </span>
  );
}

function PageBadge({ label, color }: { label: string; color: "green" | "amber" | "red" | "blue" }) {
  const cls = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-600 border-red-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}

/** 3-step mini progress indicator for connection flows */
function StepFlow({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"
              }`}>
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-xs font-semibold ${active ? "text-gray-800" : done ? "text-emerald-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px ${done ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Error banner with title + guidance copy */
function ErrorBanner({ title, guidance, onRetry }: { title: string; guidance: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
      <p className="text-sm font-bold text-red-700 mb-1">⚠ {title}</p>
      <p className="text-xs text-red-600 leading-relaxed">{guidance}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-xs font-semibold text-red-700 underline hover:no-underline">
          Tentar novamente
        </button>
      )}
    </div>
  );
}

const STEPS_INSTAGRAM = ["Autorizar Instagram", "Concluir"];
const STEPS_FACEBOOK  = ["Autorizar Meta", "Escolher página", "Concluir"];

// ─── Main component ───────────────────────────────────────────────────────────

function IntegrationsContent() {
  const ent = useEntitlements();
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [igStatus, setIgStatus] = useState<InstagramStatus | null>(null);
  const [fbStatus, setFbStatus] = useState<FacebookStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // WhatsApp manual form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualWabaId, setManualWabaId] = useState("");
  const [manualPhoneId, setManualPhoneId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [savingManual, setSavingManual] = useState(false);
  const [embeddedLoading, setEmbeddedLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Instagram selector
  const [igSelectPending, setIgSelectPending] = useState(false);
  const [igPages, setIgPages] = useState<IgPageCandidate[]>([]);
  const [igSelecting, setIgSelecting] = useState(false);
  const [igError, setIgError] = useState<{ title: string; guidance: string } | null>(null);

  // Facebook selector
  const [fbSelectPending, setFbSelectPending] = useState(false);
  const [fbPages, setFbPages] = useState<FbPageCandidate[]>([]);
  const [fbSelecting, setFbSelecting] = useState(false);
  const [fbError, setFbError] = useState<{ title: string; guidance: string } | null>(null);

  const searchParams = useSearchParams();
  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;

  const authHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
    return { Authorization: `Bearer ${token}` };
  };

  const fetchAll = useCallback(async () => {
    try {
      const h = authHeaders();
      const [waRes, igRes, fbRes] = await Promise.all([
        fetch("/api/integrations/whatsapp/status", { headers: h }),
        fetch("/api/integrations/instagram/status", { headers: h }),
        fetch("/api/integrations/facebook/status", { headers: h }),
      ]);
      if (waRes.ok) setWaStatus(await waRes.json());
      if (igRes.ok) setIgStatus(await igRes.json());
      if (fbRes.ok) setFbStatus(await fbRes.json());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const error   = searchParams.get("error");

    if (success === "true" || success === "instagram" || success === "facebook") {
      const extra = searchParams.get("phone") || searchParams.get("username") || searchParams.get("page") || "";
      if (success === "instagram") {
        const subFailed = searchParams.get("sub") === "failed";
        if (subFailed) {
          setMessage(extra
            ? `⚠️ Instagram (@${extra}) conectado, mas o webhook não foi ativado. O Direct ainda não está operacional.`
            : "⚠️ Instagram conectado, mas o webhook não foi ativado. O Direct ainda não está operacional.");
        } else {
          setMessage(extra
            ? `✅ Instagram conectado com sucesso! (@${extra}) — sua página está pronta para receber mensagens.`
            : "✅ Instagram conectado com sucesso! Sua página está pronta para receber mensagens.");
        }
      } else if (success === "facebook") {
        setMessage(extra
          ? `✅ Facebook Messenger conectado! (${extra}) — sua página agora recebe mensagens no sistema.`
          : "✅ Facebook Messenger conectado com sucesso!");
      } else {
        setMessage("✅ WhatsApp conectado com sucesso!");
      }
      window.history.replaceState({}, "", "/dashboard/integrations");
    } else if (searchParams.get("instagram_select") === "1") {
      window.history.replaceState({}, "", "/dashboard/integrations");
      setIgSelectPending(true);
      fetch("/api/integrations/instagram/pages", { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setIgPages(d.pages || []))
        .catch(() => {});
    } else if (searchParams.get("facebook_select") === "1") {
      window.history.replaceState({}, "", "/dashboard/integrations");
      setFbSelectPending(true);
      fetch("/api/integrations/facebook/pages", { headers: authHeaders() })
        .then(r => r.json())
        .then(d => setFbPages(d.pages || []))
        .catch(() => {});
    } else if (error) {
      window.history.replaceState({}, "", "/dashboard/integrations");
      // Determine channel from error code set
      const fbOnlyCodes = new Set(Object.keys(FB_ERROR_MESSAGES));
      const igText = IG_ERROR_MESSAGES[error];
      const fbText = FB_ERROR_MESSAGES[error];
      if (fbOnlyCodes.has(error) && !IG_ERROR_MESSAGES[error]) {
        setFbError(fbText || { title: `Erro: ${error}`, guidance: "Tente novamente." });
      } else if (igText) {
        // Could be IG-sourced; show in global banner
        setMessage("❌ " + igText.title + " " + igText.guidance);
      } else if (error === "plan_required") {
        setMessage("❌ " + (searchParams.get("message") || "Recurso não disponível no seu plano atual."));
      } else {
        setMessage(`❌ Erro: ${error}`);
      }
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

  // ── WhatsApp helpers (unchanged logic) ────────────────────────────────────

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
      } else setMessage("❌ " + (data.error || "Falha ao conectar"));
    } catch (err: any) { setMessage("❌ Erro: " + err.message); }
    finally { setEmbeddedLoading(false); }
  };

  const handleEmbeddedSignup = () => {
    if (!appId || !(window as any).FB) { setMessage("❌ Facebook SDK não carregado."); return; }
    if (embeddedLoading) { setEmbeddedLoading(false); return; }
    setEmbeddedLoading(true); setMessage("");
    let capturedWabaId: string | undefined, capturedPhoneId: string | undefined, isCoexistenceSignup = false;
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH") { capturedWabaId = data.data?.waba_id; capturedPhoneId = data.data?.phone_number_id; }
          else if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") { capturedWabaId = data.data?.waba_id; capturedPhoneId = data.data?.phone_number_id; isCoexistenceSignup = true; }
        }
      } catch {}
    };
    window.addEventListener("message", messageHandler);
    const timeout = setTimeout(() => { setEmbeddedLoading(false); window.removeEventListener("message", messageHandler); }, 60000);
    (window as any).FB.login(
      (response: any) => {
        clearTimeout(timeout); window.removeEventListener("message", messageHandler);
        if (response.authResponse?.code || response.authResponse?.accessToken) {
          const code = response.authResponse.code, token = response.authResponse.accessToken;
          if (code) {
            fetch("/api/integrations/whatsapp/embedded-signup", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ code, wabaId: capturedWabaId, phoneNumberId: capturedPhoneId, isCoexistence: isCoexistenceSignup }) })
              .then(r => r.json()).then(data => { if (data.success) { setMessage(data.phoneDisplay ? `✅ WhatsApp conectado! Número: ${data.phoneDisplay}` : "✅ WhatsApp conectado!"); fetchAll(); } else setMessage("❌ " + (data.error || "Falha ao conectar")); })
              .catch(err => setMessage("❌ Erro: " + err.message)).finally(() => setEmbeddedLoading(false));
          } else saveWhatsAppToken(token, capturedWabaId, capturedPhoneId);
        } else { setEmbeddedLoading(false); setMessage("❌ Autorização cancelada."); }
      },
      { config_id: "1603049500912992", response_type: "code", override_default_response_type: true, extras: { featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: 3 } }
    );
  };

  const handleManualSave = async () => {
    if (!waStatus?.connected && !manualToken) { setMessage("❌ Token é obrigatório."); return; }
    if (!manualWabaId && !manualPhoneId) { setMessage("❌ Insira WABA ID ou Phone Number ID."); return; }
    setSavingManual(true);
    try {
      const body: any = { wabaId: manualWabaId || undefined, phoneNumberId: manualPhoneId || undefined };
      body.accessToken = manualToken || "__KEEP_EXISTING__";
      const res = await fetch("/api/integrations/whatsapp/callback", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok && data.success) { setMessage("✅ Configuração salva!"); setShowManualForm(false); fetchAll(); }
      else setMessage("❌ " + (data.error || "Falha ao salvar"));
    } catch (err: any) { setMessage("❌ " + err.message); }
    finally { setSavingManual(false); }
  };

  const handleDisconnect = async (channel: "whatsapp" | "instagram" | "facebook") => {
    if (!confirm(`Tem certeza que deseja desconectar o ${channel}?`)) return;
    setDisconnecting(channel);
    try {
      const res = await fetch(`/api/integrations/${channel}/disconnect`, { method: "POST", headers: authHeaders() });
      if (res.ok) { setMessage(`✅ ${channel} desconectado.`); fetchAll(); }
      else setMessage("❌ Erro ao desconectar.");
    } catch { setMessage("❌ Erro ao desconectar."); }
    finally { setDisconnecting(null); }
  };

  // ── Instagram handlers ─────────────────────────────────────────────────────

  const handleConnectInstagram = async () => {
    setIgError(null); setMessage("");
    try {
      const res = await fetch("/api/integrations/instagram/connect", { headers: authHeaders() });
      if (res.status === 401) { setMessage("❌ Sessão expirada. Faça login novamente."); return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMessage("❌ " + (data.error || "Erro ao iniciar conexão"));
    } catch (err: any) { setMessage("❌ Erro: " + err.message); }
  };

  const handleIgPageSelect = async (pageId: string) => {
    setIgSelecting(true);
    try {
      const res = await fetch("/api/integrations/instagram/select", {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.subscriptionOk === false) {
          setMessage(data.username
            ? `⚠️ Instagram (@${data.username}) conectado, mas o webhook não foi ativado. O Direct ainda não está operacional.`
            : "⚠️ Instagram conectado, mas o webhook não foi ativado. O Direct ainda não está operacional.");
        } else {
          setMessage(data.username
            ? `✅ Instagram conectado com sucesso! (@${data.username}) — sua página está pronta para receber mensagens.`
            : `✅ Instagram conectado com sucesso! (${data.pageName || ""})`);
        }
        setIgSelectPending(false); setIgPages([]); fetchAll();
      } else {
        setIgError({ title: "Não foi possível conectar.", guidance: data.error === "page_not_eligible" ? "Esta página não está pronta para mensagens. Escolha outra ou corrija as permissões." : data.error || "Tente novamente." });
      }
    } catch (err: any) { setIgError({ title: "Erro ao conectar.", guidance: err.message }); }
    finally { setIgSelecting(false); }
  };

  // ── Facebook handlers ──────────────────────────────────────────────────────

  const handleFbPageSelect = async (pageId: string) => {
    setFbSelecting(true);
    try {
      const res = await fetch("/api/integrations/facebook/select", {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ Facebook Messenger conectado! (${data.pageName || ""}) — sua página agora recebe mensagens no sistema.`);
        setFbSelectPending(false); setFbPages([]); fetchAll();
      } else {
        setFbError({ title: "Não foi possível conectar.", guidance: data.error === "page_not_eligible" ? "Esta página não está pronta para mensagens. Escolha outra ou corrija as permissões." : data.error || "Tente novamente." });
      }
    } catch (err: any) { setFbError({ title: "Erro ao conectar.", guidance: err.message }); }
    finally { setFbSelecting(false); }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {appId && <Script src="https://connect.facebook.net/pt_BR/sdk.js" strategy="lazyOnload" onLoad={initFbSdk} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
        <p className="text-sm text-gray-500 mt-1">Conecte canais de atendimento ao seu workspace</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.includes("❌") ? "bg-red-50 text-red-700 border-red-100" :
          message.includes("⚠️") ? "bg-amber-50 text-amber-700 border-amber-200" :
          "bg-emerald-50 text-emerald-700 border-emerald-100"
        }`}>{message}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ── WhatsApp Card (UNTOUCHED logic) ───────────────────────────── */}
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
                  <p className="text-sm text-gray-500 mt-0.5">{waStatus?.connected ? "Conta ativa e pronta para atendimento" : "Conecte via Meta WhatsApp Business API"}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {waStatus?.connected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {waStatus.whatsappBusinessAccountId && <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">WABA ID</p><p className="text-sm font-mono text-gray-800">{waStatus.whatsappBusinessAccountId}</p></div>}
                    {waStatus.whatsappPhoneNumberId && <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Phone Number ID</p><p className="text-sm font-mono text-gray-800">{waStatus.whatsappPhoneNumberId}</p></div>}
                    {waStatus.displayPhone && <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Número</p><p className="text-sm font-mono text-gray-800">{waStatus.displayPhone}</p></div>}
                  </div>
                  {!waStatus.hasFullConfig && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700">
                      ⚠️ WABA ID ou Phone ID não detectados.{" "}
                      <button onClick={() => setShowManualForm(!showManualForm)} className="font-semibold underline">{showManualForm ? "Fechar" : "Completar manualmente"}</button>
                    </div>
                  )}
                  {showManualForm && (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">WABA ID</label><input value={manualWabaId} onChange={e => setManualWabaId(e.target.value)} placeholder="Ex: 123456789012345" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono" /></div>
                        <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number ID</label><input value={manualPhoneId} onChange={e => setManualPhoneId(e.target.value)} placeholder="Ex: 123456789012345" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono" /></div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleManualSave} disabled={savingManual} className="px-5 py-2 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm disabled:opacity-50">{savingManual ? "Salvando..." : "Salvar IDs"}</button>
                        <button onClick={() => setShowManualForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">Cancelar</button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <Link href="/dashboard/conversations" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 border border-emerald-100 transition-colors">💬 Ver Conversas →</Link>
                    <button onClick={() => handleDisconnect("whatsapp")} disabled={disconnecting === "whatsapp"} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 disabled:opacity-50">{disconnecting === "whatsapp" ? "Desconectando..." : "Desconectar"}</button>
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
                          {embeddedLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /><span>Conectando...</span></> : "Conectar WhatsApp"}
                        </button>
                        {!appId && <p className="text-xs text-red-500 mt-2">⚠️ NEXT_PUBLIC_FB_APP_ID não configurado.</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400">ou</span><div className="flex-1 h-px bg-gray-200" /></div>
                  <div onClick={() => setShowManualForm(!showManualForm)} className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-3"><span>⚙️</span><div className="text-left"><span className="block font-semibold text-gray-900 text-sm">Configuração Manual</span><span className="block text-xs text-gray-500">Token + IDs do Developer Console</span></div></div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showManualForm ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {showManualForm && (
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                      <div><label className="block text-sm font-semibold text-gray-700 mb-2">Token de Acesso <span className="text-red-500">*</span></label><input type="password" value={manualToken} onChange={e => setManualToken(e.target.value)} placeholder="EAAx..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-gray-700 mb-2">WABA ID</label><input value={manualWabaId} onChange={e => setManualWabaId(e.target.value)} placeholder="123456789" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number ID</label><input value={manualPhoneId} onChange={e => setManualPhoneId(e.target.value)} placeholder="123456789" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleManualSave} disabled={savingManual} className="px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm disabled:opacity-50">{savingManual ? "Salvando..." : "Salvar"}</button>
                        <button onClick={() => setShowManualForm(false)} className="px-5 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-xl">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </PlanGate>

          {/* ── Instagram Card ─────────────────────────────────────────────── */}
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${igStatus?.connected ? "border-pink-200" : "border-gray-200/60"}`}>
            {/* Header */}
            <div className={`px-6 py-5 border-b flex items-center justify-between ${igStatus?.connected ? "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100" : "bg-gray-50/50 border-gray-100"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${igStatus?.connected ? "bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]" : "bg-white border border-gray-200"}`}>📸</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">Instagram</h3>
                    <StatusBadge connected={!!igStatus?.connected} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {igStatus?.connected ? `@${igStatus.username || igStatus.igUserId}` : "DMs, comentários e automações"}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {igSelectPending ? (
                /* ── Selector step ── */
                <div className="space-y-4">
                  <StepFlow steps={STEPS_INSTAGRAM} current={1} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Escolha a página correta para continuar</h4>
                    <p className="text-xs text-gray-500 mb-4">Encontramos suas páginas do Facebook. Selecione a que está vinculada à conta Instagram que deseja usar.</p>
                  </div>

                  {igError && (
                    <ErrorBanner title={igError.title} guidance={igError.guidance} onRetry={() => setIgError(null)} />
                  )}

                  {igPages.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin" />
                      Buscando suas páginas...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {igPages.map((pg) => {
                        const { badge, guidance, color } = igDiagnosticToLabel(pg.diagnostic);
                        return (
                          <div key={pg.pageId} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            pg.eligibleForMessaging
                              ? "bg-white border-gray-200 hover:border-pink-200 hover:shadow-sm"
                              : "bg-gray-50 border-gray-100 opacity-70"
                          }`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-bold text-gray-900 text-sm truncate">{pg.pageName}</p>
                                {pg.eligibleForMessaging
                                  ? <PageBadge label="✓ Pronta para conectar" color="green" />
                                  : <PageBadge label={badge} color={color} />
                                }
                              </div>
                              {pg.username && <p className="text-xs text-gray-500">@{pg.username}</p>}
                              {!pg.eligibleForMessaging && (
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{guidance}</p>
                              )}
                            </div>
                            <div className="ml-4 shrink-0">
                              {pg.eligibleForMessaging ? (
                                <button
                                  onClick={() => handleIgPageSelect(pg.pageId)}
                                  disabled={igSelecting}
                                  className="px-5 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 transition-all hover:shadow-md active:scale-95"
                                  style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                                >
                                  {igSelecting ? "Conectando..." : "Conectar"}
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 font-semibold">Corrigir no Facebook</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button onClick={() => { setIgSelectPending(false); setIgPages([]); setIgError(null); }} className="text-xs text-gray-400 hover:text-gray-600 underline mt-1">
                    Cancelar e voltar
                  </button>
                </div>
              ) : igStatus?.connected ? (
                /* ── Connected state ── */
                <div className="space-y-4">
                  {/* Readiness banner — green when webhook is active, amber when subscription failed */}
                  {igStatus.readyForMessages ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-emerald-500 text-base">✅</span>
                      <p className="text-xs font-semibold text-emerald-700">Conta conectada e pronta para receber mensagens</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-amber-500 text-base mt-0.5">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Conta conectada, mas o webhook do Instagram não foi ativado.</p>
                        <p className="text-xs text-amber-700 mt-0.5">O Direct ainda não está operacional. Reconecte para tentar ativar o webhook novamente.</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {igStatus.username && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Username</p>
                        <p className="text-sm font-mono text-gray-800">@{igStatus.username}</p>
                      </div>
                    )}
                    {igStatus.igUserId && (
                      <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Instagram User ID</p>
                        <p className="text-sm font-mono text-gray-800">{igStatus.igUserId}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href="/dashboard/conversations" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-pink-700 bg-pink-50 rounded-xl hover:bg-pink-100 border border-pink-100 transition-colors">💬 Ver Conversas →</Link>
                    <button onClick={() => handleDisconnect("instagram")} disabled={disconnecting === "instagram"} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 disabled:opacity-50">{disconnecting === "instagram" ? "Desconectando..." : "Desconectar"}</button>
                  </div>
                </div>
              ) : (
                /* ── Disconnected / start state ── */
                <div className="space-y-5">
                  <StepFlow steps={STEPS_INSTAGRAM} current={0} />
                  <div className="p-5 bg-gradient-to-r from-pink-50/60 to-purple-50/60 rounded-xl border border-pink-100/60">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888] flex items-center justify-center text-white shrink-0">📸</div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Conectar Instagram Business</h4>
                        <p className="text-sm text-gray-500 mb-1">Responda DMs, automatize comentários e crie sequências de conversão.</p>
                        <p className="text-xs text-gray-400 mb-4">Requer conta Instagram Business ou Creator.</p>
                        <button onClick={handleConnectInstagram} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}>
                          Autorizar com Instagram →
                        </button>
                      </div>
                    </div>
                  </div>
                  {igError && <ErrorBanner title={igError.title} guidance={igError.guidance} onRetry={handleConnectInstagram} />}
                </div>
              )}
            </div>
          </div>

          {/* ── Facebook Messenger Card ────────────────────────────────────── */}
          <PlanGate feature="facebook" allowed={ent.features.facebook} loading={ent.loading} name="Facebook Messenger" icon="💬" minPlan="pro">
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${fbStatus?.connected ? "border-blue-200" : "border-gray-200/60"}`}>
            {/* Header */}
            <div className={`px-6 py-5 border-b flex items-center justify-between ${fbStatus?.connected ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100" : "bg-gray-50/50 border-gray-100"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${fbStatus?.connected ? "bg-[#1877F2]" : "bg-white border border-gray-200"}`}>💬</div>
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

            {/* Body */}
            <div className="p-6">
              {fbSelectPending ? (
                /* ── Selector step ── */
                <div className="space-y-4">
                  <StepFlow steps={STEPS_FACEBOOK} current={1} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Escolha a página correta para continuar</h4>
                    <p className="text-xs text-gray-500 mb-4">Encontramos suas páginas do Facebook. Selecione a que deseja usar para o Messenger.</p>
                  </div>

                  {fbError && (
                    <ErrorBanner title={fbError.title} guidance={fbError.guidance} onRetry={() => setFbError(null)} />
                  )}

                  {fbPages.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      Buscando suas páginas...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fbPages.map((pg) => (
                        <div key={pg.pageId} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          pg.eligibleForMessaging
                            ? "bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm"
                            : "bg-gray-50 border-gray-100 opacity-70"
                        }`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-bold text-gray-900 text-sm truncate">{pg.pageName}</p>
                              {pg.eligibleForMessaging
                                ? <PageBadge label="✓ Pronta para conectar" color="green" />
                                : <PageBadge label="Mensagens indisponíveis" color="amber" />
                              }
                            </div>
                            {!pg.eligibleForMessaging && (
                              <p className="text-xs text-gray-400 mt-1">Ative as permissões de mensagens desta Página e tente novamente.</p>
                            )}
                          </div>
                          <div className="ml-4 shrink-0">
                            {pg.eligibleForMessaging ? (
                              <button
                                onClick={() => handleFbPageSelect(pg.pageId)}
                                disabled={fbSelecting}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-[#1877F2] hover:bg-[#1565D8] rounded-xl disabled:opacity-50 transition-all hover:shadow-md active:scale-95"
                              >
                                {fbSelecting ? "Conectando..." : "Conectar"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-semibold">Corrigir no Facebook</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => { setFbSelectPending(false); setFbPages([]); setFbError(null); }} className="text-xs text-gray-400 hover:text-gray-600 underline mt-1">
                    Cancelar e voltar
                  </button>
                </div>
              ) : fbStatus?.connected ? (
                /* ── Connected state ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-emerald-500 text-base">✅</span>
                    <p className="text-xs font-semibold text-emerald-700">Página conectada e pronta para receber mensagens</p>
                  </div>
                  {fbStatus.pageName && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 inline-block">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Página</p>
                      <p className="text-sm font-semibold text-gray-800">{fbStatus.pageName}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Link href="/dashboard/conversations" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors">💬 Ver Conversas →</Link>
                    <button onClick={() => handleDisconnect("facebook")} disabled={disconnecting === "facebook"} className="px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 disabled:opacity-50">{disconnecting === "facebook" ? "Desconectando..." : "Desconectar"}</button>
                  </div>
                </div>
              ) : (
                /* ── Disconnected / start state ── */
                <div className="space-y-5">
                  <StepFlow steps={STEPS_FACEBOOK} current={0} />
                  <div className="p-5 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-xl border border-blue-100/60">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center text-white shrink-0">💬</div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">Conectar Facebook Messenger</h4>
                        <p className="text-sm text-gray-500 mb-1">Responda mensagens diretas da sua Página do Facebook com IA e automações.</p>
                        <p className="text-xs text-gray-400 mb-4">Requer uma Página do Facebook com permissão de mensagens ativa.</p>
                        <a href="/api/integrations/facebook/connect" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] hover:bg-[#1565D8] text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                          Autorizar com Meta →
                        </a>
                      </div>
                    </div>
                  </div>
                  {fbError && <ErrorBanner title={fbError.title} guidance={fbError.guidance} />}
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
    <Suspense fallback={<div className="max-w-3xl mx-auto flex items-center justify-center py-32"><div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" /></div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
