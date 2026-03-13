"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingStep4() {
  const router = useRouter();
  const [whatDoes, setWhatDoes] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [commonQuestions, setCommonQuestions] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [presetPrompt, setPresetPrompt] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("/api/onboarding/step4", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.aiPrompt) setPresetPrompt(data.aiPrompt);
          if (data.welcomeMessage) setWelcomeMessage(data.welcomeMessage);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // If the user didn't type anything new, assume they want to keep the preset
    if (!whatDoes.trim() && presetPrompt) {
      router.push("/onboarding/step/5");
      return;
    }

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

  if (loading) return <div className="text-center py-20 animate-pulse text-indigo-400 font-bold">Carregando contexto da IA...</div>;

  return (
    <div>
      <StepProgress current={4} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
          <h2 className="text-xl font-bold text-gray-900">🤖 Configuração da IA</h2>
          <p className="text-sm text-gray-500 mt-1">Sua IA já foi pré-configurada! Revise ou refaça se desejar.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {presetPrompt && !generatedPrompt && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✨</span>
                <p className="text-sm font-bold text-indigo-900">IA Pré-Configurada via Template</p>
              </div>
              <p className="text-xs text-indigo-700 font-medium mb-3">Já criamos um comportamento padrão profissional. Se gostar, apenas clique em Continuar.</p>
              <div className="bg-white/60 p-3 rounded-lg border border-indigo-200 text-[11px] text-gray-600 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                {presetPrompt}
              </div>
            </div>
          )}

          {generatedPrompt && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-sm font-semibold text-emerald-700 mb-2">✅ Novo Prompt gerado com sucesso!</p>
              <p className="text-xs text-emerald-600">Redirecionando para o próximo passo...</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Ou recrie respondendo abaixo</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  1. O que sua empresa faz? <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={whatDoes}
                  onChange={(e) => setWhatDoes(e.target.value)}
                  placeholder="Se preencher isso, um NOVO prompt será gerado ignorando o pré-configurado acima..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  2. O que os clientes mais perguntam? <span className="text-gray-400 font-normal">(opcional)</span>
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
            </div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-700">
            💡 Você sempre pode editar as instruções detalhadas depois no menu <strong>Configurações → IA</strong>.
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
              {saving ? "Processando..." : (whatDoes.trim() ? "Gerar Novo Prompt →" : "Continuar com IA Padrão →")}
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
