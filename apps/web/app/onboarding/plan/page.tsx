"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WHATSAPP_BUSINESS_URL } from "@/lib/config/plans";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "Grátis",
    priceNote: "para sempre",
    badge: null,
    highlight: false,
    channels: ["Instagram"],
    features: ["500 mensagens/mês", "1 agente", "5 automações", "IA básica"],
    cta: "Começar grátis",
    ctaStyle: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 49,90",
    priceNote: "/mês — 7 dias grátis",
    badge: "7 DIAS GRÁTIS",
    highlight: true,
    channels: ["WhatsApp", "Instagram", "Facebook"],
    features: ["10.000 mensagens/mês", "5 agentes", "Automações ilimitadas", "CRM avançado", "AI Copilot"],
    cta: "Assinar Pro",
    ctaStyle: "bg-gray-900 text-white hover:bg-gray-800",
  },
  {
    id: "business",
    name: "Business",
    price: "Custom",
    priceNote: "",
    badge: null,
    highlight: false,
    channels: ["WhatsApp", "Instagram", "Facebook"],
    features: ["Mensagens ilimitadas", "Agentes ilimitados", "White-label", "Painel de agência", "Tudo do Pro"],
    cta: "Assinar Business",
    ctaStyle: "bg-gray-900 text-white hover:bg-gray-800",
  },
];

export default function OnboardingPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSelect = async (planId: string) => {
    if (planId === "business") {
      window.open(WHATSAPP_BUSINESS_URL, "_blank");
      return;
    }

    setLoading(planId);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/onboarding/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao selecionar plano"); setLoading(null); return; }

      // Save to localStorage for quick access on later steps
      localStorage.setItem("onboarding_plan", planId);

      if (data.checkoutUrl) {
        // Pro/Business: redirect to Stripe
        window.location.href = data.checkoutUrl;
        return;
      }

      // Free/Standard: proceed directly to onboarding
      router.push("/onboarding/step/1");
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Escolha seu plano</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
          Comece agora. Você pode mudar de plano a qualquer momento.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl border shadow-sm flex flex-col transition-all ${
              plan.highlight
                ? "border-indigo-400 ring-2 ring-indigo-500/20 shadow-indigo-100"
                : "border-gray-200/60"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-md">
                  {plan.badge}
                </span>
              </div>
            )}

            <div className={`px-5 pt-7 pb-5 border-b ${plan.highlight ? "border-indigo-100 bg-indigo-50/30" : "border-gray-100"}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{plan.name}</p>
              <p className="text-2xl font-extrabold text-gray-900">{plan.price}</p>
              <p className={`text-xs mt-0.5 ${plan.highlight ? "text-indigo-600 font-semibold" : "text-gray-400"}`}>
                {plan.priceNote}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {plan.channels.map((ch) => (
                  <span key={ch} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-semibold">
                    {ch}
                  </span>
                ))}
              </div>
            </div>

            <ul className="flex-1 px-5 py-4 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="px-5 pb-5">
              <button
                onClick={() => handleSelect(plan.id)}
                disabled={loading !== null}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${plan.ctaStyle}`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></span>
                    Aguarde...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Sem cartão de crédito para plano Free e Standard (trial). Cancele quando quiser.
      </p>
    </div>
  );
}
