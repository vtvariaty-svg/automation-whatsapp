"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const OPERATION_TYPES = [
  {
    id: "clinica",
    label: "Clínica / Odontologia",
    description: "Consultórios, clínicas médicas, odontológicas ou de estética.",
    icon: "🏥",
    borderActive: "border-teal-500",
    bgActive: "bg-teal-50",
    disclaimer: "A IA não diagnostica, não prescreve e não interpreta exames.",
  },
  {
    id: "restaurante",
    label: "Restaurante / Delivery",
    description: "Restaurantes, delivery, marmitarias e estabelecimentos alimentares.",
    icon: "🍽️",
    borderActive: "border-orange-500",
    bgActive: "bg-orange-50",
    disclaimer: "Pagamento online não é processado nesta etapa.",
  },
  {
    id: "outro",
    label: "Outro negócio via WhatsApp",
    description: "Loja, serviços, educação, imobiliária, academia e outros.",
    icon: "💬",
    borderActive: "border-indigo-500",
    bgActive: "bg-indigo-50",
    disclaimer: null,
  },
] as const;

// Map subscription plan to suggested operation type for pre-highlight
const PLAN_TO_TYPE: Record<string, string> = {
  consultorio: "clinica",
  restaurante: "restaurante",
};

export default function OnboardingPlanPage() {
  const router = useRouter();
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [suggested, setSuggested] = useState<string | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Check if user already has a subscription.
    // If not → redirect to /precos (plan selection happens there now).
    // If yes → show operation type selector with optional pre-highlight.
    fetch("/api/billing/subscription", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.hasSubscription) {
          router.replace("/precos");
          return;
        }
        // Pre-highlight (not pre-select) based on subscription plan
        if (d.plan && PLAN_TO_TYPE[d.plan]) {
          setSuggested(PLAN_TO_TYPE[d.plan]);
        }
        setLoadingCheck(false);
      })
      .catch(() => setLoadingCheck(false));
  }, [router]);

  const handleSelect = (typeId: string) => {
    // Pass the chosen type to Step 1 via query param.
    // Step 1 will use it as a secondary signal for pre-selection.
    // Actual persistence happens when Step 1 submits to /api/onboarding/step1.
    router.push(`/onboarding/step/1?type=${typeId}`);
  };

  if (loadingCheck) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Qual operação você quer automatizar?
        </h1>
        <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
          Escolha o tipo de negócio. A configuração inicial da IA será ajustada para o seu segmento.
          Você pode alterar depois nas configurações.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
        {OPERATION_TYPES.map((op) => {
          const isSuggested = suggested === op.id;
          return (
            <button
              key={op.id}
              type="button"
              onClick={() => handleSelect(op.id)}
              className={`text-left flex items-start gap-4 p-6 rounded-2xl border-2 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                isSuggested
                  ? `${op.borderActive} ${op.bgActive}`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="text-3xl shrink-0" aria-hidden="true">
                {op.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">
                  {op.label}
                  {isSuggested && (
                    <span className="ml-2 text-xs font-semibold text-indigo-500 align-middle">
                      ← seu plano
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{op.description}</p>
                {op.disclaimer && (
                  <p className="text-xs text-gray-400 mt-2">{op.disclaimer}</p>
                )}
              </div>
              <span className="shrink-0 text-gray-300 text-lg" aria-hidden="true">
                →
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Você pode alterar o tipo de negócio a qualquer momento nas configurações.
      </p>
    </div>
  );
}
