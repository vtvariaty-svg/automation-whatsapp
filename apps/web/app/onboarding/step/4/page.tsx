"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingStep4() {
  const router = useRouter();
  const [whatDoes, setWhatDoes] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [commonQuestions, setCommonQuestions] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/onboarding/step4", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          whatDoesCompanyDo: whatDoes,
          servicesOffered,
          commonQuestions,
          welcomeMessage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedPrompt(data.generatedPrompt);
        // Small delay to show the generated prompt
        setTimeout(() => router.push("/onboarding/step/5"), 1500);
      } else {
        setError(data.error || "Erro ao salvar");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <StepProgress current={4} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
          <h2 className="text-xl font-bold text-gray-900">🤖 Configuração da IA</h2>
          <p className="text-sm text-gray-500 mt-1">Responda as perguntas para configurar o comportamento da IA</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {generatedPrompt && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-sm font-semibold text-emerald-700 mb-2">✅ Prompt gerado com sucesso!</p>
              <p className="text-xs text-emerald-600">Redirecionando para o próximo passo...</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. O que sua empresa faz?
            </label>
            <textarea
              value={whatDoes}
              onChange={(e) => setWhatDoes(e.target.value)}
              placeholder="Ex: Somos um salão de beleza especializado em cortes modernos e coloração..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              2. Quais serviços oferece? <span className="text-gray-400 font-normal">(opcional, já preenchido pela etapa anterior)</span>
            </label>
            <textarea
              value={servicesOffered}
              onChange={(e) => setServicesOffered(e.target.value)}
              placeholder="Ex: Corte, barba, coloração, hidratação..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              3. O que os clientes mais perguntam?
            </label>
            <textarea
              value={commonQuestions}
              onChange={(e) => setCommonQuestions(e.target.value)}
              placeholder="Ex: Preço de serviços, horários disponíveis, formas de pagamento..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mensagem de Boas-Vindas <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Ex: Olá! 👋 Bem-vindo ao Studio Bela Vida! Como posso ajudá-lo?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
            />
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-700">
            💡 A IA vai gerar um prompt personalizado baseado nas suas respostas. Você pode editá-lo depois em <strong>Configurações → IA</strong>.
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => router.push("/onboarding/step/3")}
              className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
            >
              {saving ? "Gerando prompt..." : "Gerar Prompt IA →"}
            </button>
          </div>
        </form>
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
