"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Step4Data {
  presetPromptPreview: string | null;
  guidedSetupDone: boolean;
  welcomeMessage: string;
  botName: string | null;
  hasBotActive: boolean;
}

export default function OnboardingStep4() {
  const router = useRouter();
  const [data, setData] = useState<Step4Data | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("/api/onboarding/step4", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result: Step4Data = await res.json();
          setData(result);
          if (result.welcomeMessage) setWelcomeMessage(result.welcomeMessage);
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
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/onboarding/step4", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ welcomeMessage }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        router.push("/onboarding/step/5");
      } else {
        setError(result.error || "Erro ao salvar");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="text-center py-20 animate-pulse text-indigo-400 font-bold">Carregando configuração de IA...</div>
  );

  return (
    <div>
      <StepProgress current={4} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
          <h2 className="text-xl font-bold text-gray-900">🤖 Configuração da IA</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data?.botName
              ? `A IA do ${data.botName} está pré-configurada via preset.`
              : "Configure como sua IA vai se comportar."}
            {" "}Você pode personalizar tudo depois na Central de IA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {/* Section 1: Preset do Bot */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Preset do Bot</p>

            {data?.hasBotActive ? (
              data.presetPromptPreview ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✅</span>
                    <p className="text-sm font-bold text-emerald-800">
                      Identidade base configurada — {data.botName}
                    </p>
                  </div>
                  <p className="text-xs text-emerald-600 mb-3">
                    Esta camada é gerenciada pelo bot ativo e define o comportamento base da IA.
                    Você pode adicionar uma camada manual na Central de IA.
                  </p>
                  <details className="group">
                    <summary className="text-xs text-emerald-700 font-semibold cursor-pointer hover:text-emerald-900 select-none">
                      Ver preview do preset ▸
                    </summary>
                    <div className="mt-2 bg-white/60 p-3 rounded-lg border border-emerald-200 text-[11px] text-gray-600 font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {data.presetPromptPreview}
                    </div>
                  </details>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800">⚠️ Preset sendo configurado</p>
                  <p className="text-xs text-amber-600 mt-1">
                    O bot foi ativado. O preset pode levar alguns segundos para aparecer.
                  </p>
                </div>
              )
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm font-semibold text-gray-700">🤖 Sem bot ativo</p>
                <p className="text-xs text-gray-500 mt-1">
                  Você não selecionou um bot na etapa 1. A IA operará sem comportamento especializado.
                  Você pode ativar um bot depois em Configurações → Bots.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Ensine sua IA */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Ensine sua IA</p>
            <div
              className={`p-4 rounded-xl border ${
                data?.guidedSetupDone ? "bg-emerald-50 border-emerald-100" : "bg-indigo-50/50 border-indigo-100"
              }`}
            >
              {data?.guidedSetupDone ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span>✅</span>
                    <p className="text-sm font-bold text-emerald-800">Configuração guiada concluída!</p>
                  </div>
                  <p className="text-xs text-emerald-600">
                    O contexto do seu negócio foi ensinado à IA com sucesso.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-indigo-800 mb-1">
                    Recomendado: ensine o contexto do seu negócio
                  </p>
                  <p className="text-xs text-indigo-600 mb-3">
                    Responda algumas perguntas rápidas para que a IA entenda como representar sua empresa. 
                    Esta etapa melhora muito a qualidade das respostas.
                  </p>
                  <Link
                    href="/dashboard/atendimento-ia#ensinar-ia"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Ensinar minha IA →
                  </Link>
                  <p className="text-xs text-indigo-400 mt-2">
                    Você pode fazer isso agora (em nova aba) ou depois de concluir o setup.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Mensagem de Boas-Vindas */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Mensagem de Boas-Vindas
            </p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mensagem inicial para novos contatos{" "}
              <span className="text-gray-400 font-normal text-xs">(opcional)</span>
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Ex: Olá! 👋 Bem-vindo(a) à nossa empresa! Como posso ajudá-lo(a) hoje?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enviada automaticamente quando um cliente entra em contato pela primeira vez.
              Esta mensagem não é configurada pelo bot automaticamente.
            </p>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-700">
            💡 Você pode configurar todos os detalhes depois em{" "}
            <strong>Atendimento → Central de IA</strong>.
          </div>

          <div className="flex justify-between pt-2">
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
              {saving ? "Salvando..." : "Concluir Configuração →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StepProgress({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Bot + Negócio" },
    { n: 2, label: "WhatsApp" },
    { n: 3, label: "Operação" },
    { n: 4, label: "IA" },
    { n: 5, label: "Teste" },
  ];
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step.n < current
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                  : step.n === current
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {step.n < current ? "✓" : step.n}
            </div>
            <span
              className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider ${
                step.n <= current ? "text-gray-700" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 rounded-full ${
                step.n < current ? "bg-emerald-400" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
