"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const businessTypes = [
  { id: "clínica", label: "Clínica Médica / Odontológica", desc: "Configura Consultas, Avaliações e automação de horários." },
  { id: "salão", label: "Salão de Beleza / Barbearia", desc: "Configura Cortes, Colorações e automação de tabela de preços." },
  { id: "restaurante", label: "Restaurante / Delivery", desc: "Configura Reservas, Entregas e automação de cardápio." },
  { id: "ecommerce", label: "Loja / E-commerce", desc: "Configura Suporte e automação para frete e trocas." },
  { id: "outro", label: "Outro", desc: "Configuração básica em branco." },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessHours, setBusinessHours] = useState("Seg-Sex 08:00-18:00, Sáb 08:00-12:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Redirect to plan selection if no subscription has been chosen yet
  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      try {
        const res = await fetch("/api/billing/subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.hasSubscription) {
            router.replace("/onboarding/plan");
          }
        }
      } catch {}
    };
    check();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) { setError("Nome da empresa é obrigatório"); return; }
    if (!businessType) { setError("Por favor, selecione um tipo de negócio para aplicar os templates corretos."); return; }
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/onboarding/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyName, businessType, businessDescription, businessHours }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/onboarding/step/2");
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
      {/* Progress */}
      <StepProgress current={1} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <h2 className="text-xl font-bold text-gray-900">🏢 Sobre sua empresa</h2>
          <p className="text-sm text-gray-500 mt-1">Conte-nos um pouco sobre o seu negócio para configurarmos a IA sob medida.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome da Empresa <span className="text-red-500">*</span>
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Studio Bela Vida"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Negócio <span className="text-red-500">*</span> <span className="font-normal text-gray-400 text-xs ml-1">(Isso define as automações padrão da sua IA)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {businessTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setBusinessType(type.id)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    businessType === type.id
                      ? "bg-indigo-50 border-indigo-400 text-indigo-700 ring-2 ring-indigo-500/10 shadow-sm"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <p className="font-bold text-sm mb-1">{type.label}</p>
                  <p className={`text-xs ${businessType === type.id ? "text-indigo-600/80" : "text-gray-500"}`}>{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição da Empresa / Regras Gerais</label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Descreva brevemente o que sua empresa faz ou regras importantes que a IA deve saber..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Horário de Atendimento</label>
            <input
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="Ex: Seg-Sex 08:00-18:00"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
            >
              {saving ? "Salvando e Criando Automações..." : "Continuar →"}
            </button>
          </div>
        </form>
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
              step.n < current
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                : step.n === current
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-gray-100 text-gray-400"
            }`}>
              {step.n < current ? "✓" : step.n}
            </div>
            <span className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider ${
              step.n <= current ? "text-gray-700" : "text-gray-400"
            }`}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 rounded-full ${
              step.n < current ? "bg-emerald-400" : "bg-gray-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
