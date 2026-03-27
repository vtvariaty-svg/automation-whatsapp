"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { marketplaceBots, Blueprint } from "@/lib/marketplace/bots";

const BLUEPRINT_LABELS: Record<Blueprint, { label: string; emoji: string }> = {
  "agenda-servicos": { label: "Agenda & Serviços", emoji: "📅" },
  "catalogo-vendas": { label: "Catálogo & Vendas", emoji: "🛒" },
  "consulta-leads": { label: "Consulta & Leads", emoji: "🎯" },
  hibrido: { label: "Híbrido", emoji: "🔀" },
};

const businessTypeOptions = [
  { id: "clinica", label: "Clínica / Saúde" },
  { id: "salão", label: "Beleza & Estética" },
  { id: "restaurante", label: "Restaurante / Delivery" },
  { id: "ecommerce", label: "Loja / E-commerce" },
  { id: "educacao", label: "Educação / Cursos" },
  { id: "imobiliaria", label: "Imobiliária" },
  { id: "outro", label: "Outro" },
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<Blueprint | "all">("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
          if (!data.hasSubscription) router.replace("/onboarding/plan");
        }
      } catch {}
    };
    check();
  }, [router]);

  const blueprints = Object.keys(BLUEPRINT_LABELS) as Blueprint[];
  const filteredBots =
    activeBlueprint === "all"
      ? marketplaceBots
      : marketplaceBots.filter((b) => b.blueprint === activeBlueprint);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Nome da empresa é obrigatório");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");

      // Single call: saves context AND activates bot server-side
      const res = await fetch("/api/onboarding/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyName, businessType, businessDescription, phone, address, botId: selectedBotId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Erro ao salvar");
        return;
      }

      router.push("/onboarding/step/2");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <StepProgress current={1} />

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden mt-6">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <h2 className="text-xl font-bold text-gray-900">🤖 Bot + Negócio</h2>
          <p className="text-sm text-gray-500 mt-1">
            Escolha um bot especializado e informe os dados da sua empresa.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {/* Bot Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Bot Especializado{" "}
              <span className="font-normal text-gray-400 text-xs ml-1">(opcional — ative depois se preferir)</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              O bot define o comportamento base da IA para o seu segmento de negócio.
            </p>

            {/* Blueprint filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveBlueprint("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeBlueprint === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              {blueprints.map((bp) => (
                <button
                  key={bp}
                  type="button"
                  onClick={() => setActiveBlueprint(bp)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeBlueprint === bp
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {BLUEPRINT_LABELS[bp].emoji} {BLUEPRINT_LABELS[bp].label}
                </button>
              ))}
            </div>

            {/* No bot option */}
            <div
              onClick={() => setSelectedBotId(null)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all mb-3 ${
                selectedBotId === null
                  ? "bg-gray-50 border-gray-400 ring-2 ring-gray-200"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span className="text-2xl">⛔</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">Sem bot por agora</p>
                <p className="text-xs text-gray-400">Configure a IA manualmente depois.</p>
              </div>
            </div>

            {/* Bot grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredBots.map((bot) => (
                <div
                  key={bot.id}
                  onClick={() => setSelectedBotId(bot.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedBotId === bot.id
                      ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/10 shadow-sm"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl shrink-0">{bot.emoji}</span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold leading-tight ${
                        selectedBotId === bot.id ? "text-indigo-800" : "text-gray-800"
                      }`}
                    >
                      {bot.name}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        selectedBotId === bot.id ? "text-indigo-600/80" : "text-gray-400"
                      }`}
                    >
                      {bot.nicheLabel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business context fields */}
          <div className="border-t border-gray-100 pt-6 space-y-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Dados da Empresa</p>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Negócio</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                >
                  <option value="">Selecione...</option>
                  {businessTypeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone de Contato</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-0000"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Endereço</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rua das Flores, 123 – São Paulo, SP"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição do Negócio</label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Descreva brevemente o que sua empresa faz..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Continuar →"}
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
