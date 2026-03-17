"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function OnboardingStep2() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [planSlug, setPlanSlug] = useState<string | null>(null);
  const appId = process.env.NEXT_PUBLIC_FB_APP_ID;

  // Read chosen plan (localStorage is fastest; API is authoritative)
  useEffect(() => {
    const cached = localStorage.getItem("onboarding_plan");
    if (cached) { setPlanSlug(cached); return; }
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    fetch("/api/billing/subscription", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.plan) { setPlanSlug(d.plan); localStorage.setItem("onboarding_plan", d.plan); } })
      .catch(() => {});
  }, []);

  const initFbSdk = useCallback(() => {
    if (!appId) return;
    if ((window as any).FB) {
      (window as any).FB.init({ appId, autoLogAppEvents: true, xfbml: true, version: "v22.0" });
      setSdkReady(true);
    }
  }, [appId]);

  // Check if already connected
  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("/api/integrations/whatsapp/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setConnected(true);
            setMessage("✅ WhatsApp já está conectado!");
          }
        }
      } catch {}
    };
    check();
  }, []);

  const handleConnect = () => {
    if (!appId || !(window as any).FB) {
      setMessage("❌ Facebook SDK não carregado.");
      return;
    }
    setConnecting(true);
    setMessage("");

    const timeout = setTimeout(() => setConnecting(false), 60000);

    (window as any).FB.login(
      async function(response: any) {
        clearTimeout(timeout);
        if (response.authResponse?.accessToken) {
          try {
            const jwtToken = localStorage.getItem("auth_token");
            const res = await fetch("/api/integrations/whatsapp/callback", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` },
              body: JSON.stringify({ accessToken: response.authResponse.accessToken }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
              setConnected(true);
              setMessage(data.phoneDisplay
                ? `✅ WhatsApp conectado! Número: ${data.phoneDisplay}`
                : "✅ WhatsApp conectado com sucesso!"
              );
            } else {
              setMessage("❌ " + (data.error || "Falha ao conectar"));
            }
          } catch (err: any) {
            setMessage("❌ Erro: " + err.message);
          }
        } else {
          setMessage("❌ Autorização cancelada.");
        }
        setConnecting(false);
      },
      { scope: "whatsapp_business_management,whatsapp_business_messaging" }
    );
  };

  const handleContinue = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch("/api/onboarding/step2", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      router.push("/onboarding/step/3");
    } catch {}
  };

  const handleSkip = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      // Advance step even without connection
      await fetch("/api/onboarding/step2", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      router.push("/onboarding/step/3");
    } catch {}
  };

  return (
    <div>
      {appId && <Script src="https://connect.facebook.net/pt_BR/sdk.js" strategy="lazyOnload" onLoad={initFbSdk} />}

      <StepProgress current={2} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
          <h2 className="text-xl font-bold text-gray-900">📱 Conectar WhatsApp</h2>
          <p className="text-sm text-gray-500 mt-1">Vincule sua conta WhatsApp Business para receber mensagens</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Free plan: WhatsApp not included — prompt to skip or upgrade */}
          {planSlug === 'free' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-semibold text-amber-800 mb-1">WhatsApp não está no plano Free</p>
              <p className="text-xs text-amber-700 mb-3">
                O WhatsApp Business está disponível a partir do plano Standard. Você pode pular esta etapa e conectar o Instagram, ou fazer upgrade agora.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Pular e continuar →
                </button>
                <a
                  href="/dashboard/billing"
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium underline underline-offset-2"
                >
                  Fazer upgrade
                </a>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-xl text-sm font-medium border ${
              message.includes("❌") ? "bg-red-50 text-red-700 border-red-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }`}>{message}</div>
          )}

          {connected ? (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-4xl">✅</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">WhatsApp Conectado!</h3>
                <p className="text-sm text-gray-500 mt-1">Sua conta está vinculada e pronta para uso</p>
              </div>
              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
              >
                Continuar →
              </button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-4xl">📱</div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">Conecte seu WhatsApp Business</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  Clique no botão abaixo e faça login com sua conta Facebook que administra o WhatsApp Business.
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting || !appId}
                className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#1DA851] hover:shadow-lg hover:shadow-green-200/50 transition-all disabled:opacity-50"
              >
                {connecting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Conectando...</>
                ) : (
                  <>💬 Conectar WhatsApp</>
                )}
              </button>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleSkip}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Pular por enquanto →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Empresa" },
    { n: 2, label: "WhatsApp" },
    { n: 3, label: "Serviços" },
    { n: 4, label: "IA" },
    { n: 5, label: "Teste" },
  ];
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step.n < current ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
              : step.n === current ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              : "bg-gray-100 text-gray-400"
            }`}>{step.n < current ? "✓" : step.n}</div>
            <span className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider ${step.n <= current ? "text-gray-700" : "text-gray-400"}`}>{step.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${step.n < current ? "bg-emerald-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}
