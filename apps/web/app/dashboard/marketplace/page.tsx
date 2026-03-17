"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircleIcon, BoltIcon, SparklesIcon } from "@heroicons/react/24/outline";

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
    bgLight: "bg-amber-50",
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
    bgLight: "bg-sky-50",
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
    bgLight: "bg-violet-50",
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
    bgLight: "bg-pink-50",
    tagColor: "bg-pink-100 text-pink-700",
  },
];

export default function MarketplacePage() {
  const { user } = useAuth();
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <SparklesIcon className="w-8 h-8 text-indigo-500" />
            Marketplace de Automações
            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Pro</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bots prontos para o seu segmento. Ative em um clique e personalize depois.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid de bots */}
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
              {/* Card header */}
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

              {/* Card body */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-sm text-gray-600 leading-relaxed">{bot.description}</p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {bot.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bot.tagColor}`}
                    >
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
                        onClick={() => setActivated((prev) => { const n = { ...prev }; delete n[bot.id]; return n; })}
                        className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Ativar novamente
                      </button>
                    </div>
                  ) : selectedBot === bot.id ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                        <strong>Atenção:</strong> Isso atualizará o prompt da IA e a mensagem de boas-vindas do seu tenant. Automações existentes com mesmos gatilhos <strong>não serão duplicadas</strong>.
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
                  ) : (
                    <button
                      onClick={() => setSelectedBot(bot.id)}
                      className={`w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r ${bot.color} hover:shadow-lg hover:scale-[1.01] transition-all`}
                    >
                      Ativar este bot
                    </button>
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
            Tudo pode ser editado depois em <strong>Respostas Rápidas</strong> e <strong>Configuração de IA</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
