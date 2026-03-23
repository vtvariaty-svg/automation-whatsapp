"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import Link from "next/link";
import { CheckCircleIcon, BoltIcon, SparklesIcon } from "@heroicons/react/24/outline";

// ─── Tipos e dados ────────────────────────────────────────────────────────────

type Tab = "marketplace" | "comportamento";

const BOTS = [
  {
    id: "bot-imobiliaria",
    name: "Bot Imobiliária",
    emoji: "🏠",
    nicheLabel: "Imobiliária",
    description:
      "Qualifica leads automaticamente, responde dúvidas sobre imóveis disponíveis, agenda visitas e apresenta portfólio. Ideal para corretores e imobiliárias.",
    tags: ["imóveis", "corretor", "locação", "venda", "visita"],
    automationsCount: 6,
    color: "from-amber-500 to-orange-500",
    tagColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "bot-clinica",
    name: "Bot Clínica",
    emoji: "🏥",
    nicheLabel: "Clínica / Consultório",
    description:
      "Atendimento humanizado para clínicas e consultórios. Agenda consultas, responde sobre procedimentos, horários e convênios. Nunca emite diagnósticos.",
    tags: ["saúde", "consulta", "agendamento", "convênio"],
    automationsCount: 5,
    color: "from-sky-500 to-blue-600",
    tagColor: "bg-sky-100 text-sky-700",
  },
  {
    id: "bot-ecommerce",
    name: "Bot E-commerce",
    emoji: "🛍️",
    nicheLabel: "Loja / E-commerce",
    description:
      "Atendimento completo para lojas online. Ajuda clientes a encontrar produtos, acompanhar pedidos e esclarecer dúvidas sobre frete, troca e pagamento.",
    tags: ["loja", "pedido", "frete", "troca", "suporte"],
    automationsCount: 6,
    color: "from-violet-500 to-purple-600",
    tagColor: "bg-violet-100 text-violet-700",
  },
  {
    id: "bot-cabeleireiro",
    name: "Bot Cabeleireiro",
    emoji: "💇",
    nicheLabel: "Salão / Barbearia",
    description:
      "Agendamentos, tabela de serviços, promoções e fidelização para salões e barbearias. Tom descontraído e próximo do cliente.",
    tags: ["corte", "coloração", "agendamento", "promoção"],
    automationsCount: 6,
    color: "from-pink-500 to-rose-500",
    tagColor: "bg-pink-100 text-pink-700",
  },
];

// ─── Página principal ─────────────────────────────────────────────────────────

function BotsIAContent() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") as Tab) || "marketplace";

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "marketplace") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.push(`/dashboard/bots${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header da página */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          🤖 Bots & IA
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Escolha um bot para o seu segmento, configure o comportamento da IA e publique — tudo em um só lugar.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setTab("marketplace")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === "marketplace"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ✨ Marketplace
        </button>
        <button
          onClick={() => setTab("comportamento")}
          className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
            tab === "comportamento"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚙️ Comportamento da IA
        </button>
      </div>

      {/* Conteúdo das abas */}
      {tab === "marketplace" && <MarketplaceTab user={user} ent={ent} onConfigureClick={() => setTab("comportamento")} />}
      {tab === "comportamento" && <ComportamentoTab user={user} />}
    </div>
  );
}

export default function BotsIAPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    }>
      <BotsIAContent />
    </Suspense>
  );
}

// ─── Aba: Marketplace ─────────────────────────────────────────────────────────

function MarketplaceTab({
  user,
  ent,
  onConfigureClick,
}: {
  user: any;
  ent: any;
  onConfigureClick: () => void;
}) {
  const hasPremiumTemplates = ent.loading || ent.features.premiumTemplates;
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<Record<string, { automationsCreated: number; automationsSkipped: number }>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  const handleActivate = async (botId: string) => {
    if (!user?.tenantId) return;
    setActivating(botId);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/marketplace/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ botId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActivated((prev) => ({ ...prev, [botId]: data }));
        setSelectedBot(null);
      } else {
        setError(data.error || "Erro ao ativar o bot.");
      }
    } catch {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BOTS.map((bot) => {
          const isActivated = !!activated[bot.id];
          const isActivating = activating === bot.id;
          const result = activated[bot.id];

          return (
            <div
              key={bot.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col"
            >
              <div className={`p-6 bg-gradient-to-br ${bot.color} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-white" />
                  <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-white" />
                </div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <span className="text-4xl">{bot.emoji}</span>
                    <h2 className="text-xl font-bold text-white mt-2">{bot.name}</h2>
                    <span className="inline-block mt-1 px-3 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full">
                      {bot.nicheLabel}
                    </span>
                  </div>
                  <div className="text-right text-white/80 text-sm font-medium">
                    <BoltIcon className="w-5 h-5 inline-block mr-1" />
                    {bot.automationsCount} automações
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <p className="text-sm text-gray-600 leading-relaxed">{bot.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {bot.tags.map((tag) => (
                    <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bot.tagColor}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-5">
                  {isActivated ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                        <CheckCircleIcon className="w-5 h-5 shrink-0" />
                        <span>
                          <strong>Bot ativado!</strong>{" "}
                          {result.automationsCreated} automação(ões) adicionada(s)
                          {result.automationsSkipped > 0 && `, ${result.automationsSkipped} já existia(m)`}.
                          Prompt e boas-vindas atualizados.
                        </span>
                      </div>
                      <button
                        onClick={onConfigureClick}
                        className={`w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r ${bot.color} hover:shadow-lg transition-all`}
                      >
                        Configurar comportamento da IA →
                      </button>
                    </div>
                  ) : selectedBot === bot.id ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                        <strong>Atenção:</strong> Isso atualizará o prompt da IA e a mensagem de boas-vindas. Automações com mesmos gatilhos <strong>não serão duplicadas</strong>.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBot(null)}
                          className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleActivate(bot.id)}
                          disabled={isActivating}
                          className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all bg-gradient-to-r ${bot.color} hover:shadow-lg disabled:opacity-60`}
                        >
                          {isActivating ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Ativando...
                            </span>
                          ) : (
                            "Confirmar"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : hasPremiumTemplates ? (
                    <button
                      onClick={() => setSelectedBot(bot.id)}
                      className={`w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r ${bot.color} hover:shadow-lg hover:scale-[1.01] transition-all`}
                    >
                      Ativar este bot
                    </button>
                  ) : (
                    <Link
                      href="/dashboard/billing"
                      className="w-full block py-2.5 text-sm font-semibold text-center text-gray-500 rounded-xl bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-all"
                    >
                      Requer Pro — Fazer upgrade
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start">
        <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
          <SparklesIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">Como funciona</h4>
          <p className="text-sm text-gray-600 mt-1">
            Ao ativar um bot, o prompt da IA e a mensagem de boas-vindas são atualizados para o perfil do segmento escolhido.
            As automações de resposta rápida são adicionadas sem sobrescrever as que você já tem.
            Tudo pode ser ajustado depois em <strong>Respostas Rápidas</strong> e na aba{" "}
            <button onClick={onConfigureClick} className="font-semibold text-indigo-600 hover:underline">
              Comportamento da IA
            </button>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Aba: Comportamento da IA ─────────────────────────────────────────────────

function ComportamentoTab({ user }: { user: any }) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/settings?tenantId=${user.tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setAiPrompt(data.aiPrompt || data.ai_prompt || "");
        setWelcomeMessage(data.welcomeMessage || data.welcome_message || "");
        setBusinessHours(data.businessHours || data.business_hours || "");
      }
    } catch {
      setMessage("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tenantId) loadSettings();
  }, [user?.tenantId]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/tenant/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: user.tenantId,
          ai_prompt: aiPrompt,
          welcome_message: welcomeMessage,
          business_hours: businessHours,
        }),
      });
      setMessage(res.ok ? "✅ Configuração salva com sucesso!" : "❌ Erro ao salvar.");
    } catch {
      setMessage("❌ Erro ao salvar.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.includes("✅")
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        {/* Prompt */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-xl flex items-center justify-center text-white text-lg">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Prompt Base da IA</h3>
                <p className="text-xs text-gray-500">Define a personalidade e conhecimento da IA</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              rows={6}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Você é Maria, assistente virtual da loja Boutique Fashion. Seja educada, simpática e ajude os clientes com informações sobre produtos, preços e disponibilidade. Quando não souber algo, ofereça conectar com um atendente humano."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-2">💡 Dica: Quanto mais detalhado o prompt, melhor será o atendimento da IA.</p>
          </div>
        </div>

        {/* Boas-vindas */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg">
                👋
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Mensagem de Boas-Vindas</h3>
                <p className="text-xs text-gray-500">Enviada automaticamente na primeira interação</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              rows={4}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Ex: Olá! 👋 Sou a secretária virtual da Boutique Fashion. Posso te ajudar com informações sobre nossos produtos, preços e horários. Como posso te ajudar?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
            {welcomeMessage && (
              <div className="mt-4 p-4 bg-gradient-to-r from-[#4f46e5] to-[#5b51e0] rounded-xl text-white text-sm leading-relaxed">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">Prévia da mensagem</p>
                {welcomeMessage}
              </div>
            )}
          </div>
        </div>

        {/* Horários */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                🕐
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Horários e Regras</h3>
                <p className="text-xs text-gray-500">Informações que a IA usará para responder clientes</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              rows={4}
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="Ex: Funcionamos de segunda a sexta das 08:00 às 18:00 e sábados das 09:00 às 13:00. Endereço: Rua das Flores, 123 - Centro. Formas de pagamento: PIX, Cartão e Boleto."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !user?.tenantId}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
