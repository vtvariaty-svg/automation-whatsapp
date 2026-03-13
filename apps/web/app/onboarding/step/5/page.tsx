"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingStep5() {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const token = localStorage.getItem("auth_token");
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      router.push("/onboarding/completed");
    } catch {
      setCompleting(false);
    }
  };

  const handleSkip = async () => {
    handleComplete();
  };

  return (
    <div>
      <StepProgress current={5} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-cyan-50/50 to-blue-50/50">
          <h2 className="text-xl font-bold text-gray-900">🧪 Teste seu Atendimento</h2>
          <p className="text-sm text-gray-500 mt-1">Verifique se tudo está funcionando corretamente</p>
        </div>

        <div className="p-8">
          <div className="text-center py-8 space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto text-5xl">
              📱
            </div>

            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Envie uma mensagem de teste</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Abra o WhatsApp no seu celular e envie um <strong>"Oi"</strong> para o número que você conectou. 
                A IA deve responder automaticamente com a mensagem de boas-vindas.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">1</span>
                  <span className="text-gray-700">Abra o WhatsApp no celular</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">2</span>
                  <span className="text-gray-700">Envie <strong>"Oi"</strong> para o número conectado</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">3</span>
                  <span className="text-gray-700">Aguarde a resposta automática da IA</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-4">
              <button
                onClick={handleComplete}
                disabled={completing}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
              >
                {completing ? "Finalizando..." : "✅ Testei e está funcionando! Concluir →"}
              </button>
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Pular teste e finalizar →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Empresa" }, { n: 2, label: "WhatsApp" },
    { n: 3, label: "Serviços" }, { n: 4, label: "IA" }, { n: 5, label: "Teste" },
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
