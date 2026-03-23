"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import Link from "next/link";
import {
  CheckCircleIcon,
  BoltIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { marketplaceBots } from "@/lib/marketplace/bots";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Tab = "marketplace" | "meubot" | "comportamento";

// Dados de exibição (cor, estilo) separados dos dados de negócio
const BOT_DISPLAY: Record<string, { color: string; tagColor: string; automationsCount: number }> = {
  "bot-imobiliaria": { color: "from-amber-500 to-orange-500", tagColor: "bg-amber-100 text-amber-700", automationsCount: 6 },
  "bot-clinica":     { color: "from-sky-500 to-blue-600",     tagColor: "bg-sky-100 text-sky-700",     automationsCount: 5 },
  "bot-ecommerce":   { color: "from-violet-500 to-purple-600",tagColor: "bg-violet-100 text-violet-700",automationsCount: 6 },
  "bot-cabeleireiro":{ color: "from-pink-500 to-rose-500",    tagColor: "bg-pink-100 text-pink-700",   automationsCount: 6 },
};

// ─── Página principal ─────────────────────────────────────────────────────────

function BotsIAContent() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") as Tab) || "marketplace";

  // Estado compartilhado: bot ativo e itens pendentes da última ativação
  const [activeBotId, setActiveBotId] = useState<string | null>(null);
  const [pendingSetup, setPendingSetup] = useState<string[]>([]);
  const [tenantSettings, setTenantSettings] = useState<any>(null);

  // Carrega tenant settings e deriva qual bot está instalado via businessType
  useEffect(() => {
    if (!user?.tenantId) return;
    fetch(`/api/tenant/settings?tenantId=${user.tenantId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setTenantSettings(data);
        const bt = data.businessType || data.business_type || "";
        const found = marketplaceBots.find((b) => b.niche === bt);
        if (found) setActiveBotId(found.id);
      })
      .catch(() => {});
  }, [user?.tenantId]);

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

  const onBotActivated = (botId: string, pending: string[]) => {
    setActiveBotId(botId);
    setPendingSetup(pending);
    setTab("meubot");
  };

  const tabBtn = (id: Tab, label: string) => (
    <button
      onClick={() => setTab(id)}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all relative ${
        tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      {id === "meubot" && activeBotId && tab !== "meubot" && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />
      )}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          🤖 Bots & IA
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Escolha um bot, configure o comportamento da IA e publique — tudo em um só lugar.
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabBtn("marketplace", "✨ Marketplace")}
        {tabBtn("meubot", "🤖 Meu Bot")}
        {tabBtn("comportamento", "⚙️ Comportamento da IA")}
      </div>

      {tab === "marketplace" && (
        <MarketplaceTab user={user} ent={ent} onBotActivated={onBotActivated} activeBotId={activeBotId} />
      )}
      {tab === "meubot" && (
        <MeuBotTab
          activeBotId={activeBotId}
          pendingSetup={pendingSetup}
          tenantSettings={tenantSettings}
          onGoMarketplace={() => setTab("marketplace")}
          onGoComportamento={() => setTab("comportamento")}
        />
      )}
      {tab === "comportamento" && <ComportamentoTab user={user} />}
    </div>
  );
}

export default function BotsIAPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
        </div>
      }
    >
      <BotsIAContent />
    </Suspense>
  );
}

// ─── Aba: Marketplace ─────────────────────────────────────────────────────────

function MarketplaceTab({
  user,
  ent,
  onBotActivated,
  activeBotId,
}: {
  user: any;
  ent: any;
  onBotActivated: (botId: string, pending: string[]) => void;
  activeBotId: string | null;
}) {
  const hasPremiumTemplates = ent.loading || ent.features.premiumTemplates;
  const [activating, setActivating] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState<string | null>(null);
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ botId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJustActivated(botId);
        setSelectedBot(null);
        onBotActivated(botId, data.pendingSetup ?? []);
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
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {marketplaceBots.map((bot) => {
          const display = BOT_DISPLAY[bot.id];
          const isActive = activeBotId === bot.id;
          const isActivating = activating === bot.id;
          const isJust = justActivated === bot.id;

          return (
            <div
              key={bot.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col ${
                isActive ? "border-indigo-300 ring-1 ring-indigo-200" : "border-gray-100"
              }`}
            >
              {/* Card header */}
              <div className={`p-6 bg-gradient-to-br ${display.color} relative overflow-hidden`}>
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
                  <div className="flex flex-col items-end gap-1">
                    {isActive && (
                      <span className="px-2 py-0.5 bg-white/90 text-indigo-700 text-xs font-bold rounded-full">
                        ativo
                      </span>
                    )}
                    <span className="text-white/80 text-sm font-medium">
                      <BoltIcon className="w-4 h-4 inline-block mr-1" />
                      {display.automationsCount} automações
                    </span>
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-sm text-gray-600 leading-relaxed">{bot.description}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {bot.tags.map((tag) => (
                    <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${display.tagColor}`}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Tom e objetivo */}
                <div className="mt-4 flex gap-4 text-xs text-gray-500">
                  <span>🎤 <strong>Tom:</strong> {bot.toneOfVoice}</span>
                  <span>🎯 <strong>Foco:</strong> {bot.objective}</span>
                </div>

                <div className="mt-auto pt-5">
                  {isJust ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
                        <CheckCircleIcon className="w-5 h-5 shrink-0" />
                        <span>
                          <strong>Bot ativado!</strong> Prompt, boas-vindas e automações configurados.
                        </span>
                      </div>
                    </div>
                  ) : selectedBot === bot.id ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                        <strong>Atenção:</strong> O prompt da IA e a mensagem de boas-vindas serão atualizados. Automações com os mesmos gatilhos <strong>não serão duplicadas</strong>.
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
                          className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all bg-gradient-to-r ${display.color} hover:shadow-lg disabled:opacity-60`}
                        >
                          {isActivating ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Ativando...
                            </span>
                          ) : (
                            "Confirmar ativação"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : hasPremiumTemplates ? (
                    <button
                      onClick={() => setSelectedBot(bot.id)}
                      className={`w-full py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r ${display.color} hover:shadow-lg hover:scale-[1.01] transition-all`}
                    >
                      {isActive ? "Reinstalar este bot" : "Ativar este bot"}
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

      <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start">
        <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
          <SparklesIcon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">Como funciona</h4>
          <p className="text-sm text-gray-600 mt-1">
            Ao ativar um bot, o prompt da IA, a mensagem de boas-vindas e as automações de resposta rápida são
            pré-configurados para o seu segmento. Acesse a aba <strong>Meu Bot</strong> para ver o checklist
            de configuração e testar o comportamento antes de ir ao ar.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Aba: Meu Bot ─────────────────────────────────────────────────────────────

function MeuBotTab({
  activeBotId,
  pendingSetup,
  tenantSettings,
  onGoMarketplace,
  onGoComportamento,
}: {
  activeBotId: string | null;
  pendingSetup: string[];
  tenantSettings: any;
  onGoMarketplace: () => void;
  onGoComportamento: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!activeBotId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-4">🤖</div>
        <h3 className="text-lg font-bold text-gray-900">Nenhum bot ativo</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          Escolha um bot no Marketplace para pré-configurar o atendimento do seu segmento em um clique.
        </p>
        <button
          onClick={onGoMarketplace}
          className="mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
        >
          Ver Marketplace →
        </button>
      </div>
    );
  }

  const bot = marketplaceBots.find((b) => b.id === activeBotId);
  if (!bot) return null;

  const display = BOT_DISPLAY[bot.id];

  // Calcula quais itens do checklist estão concluídos com base em tenantSettings
  const checklistWithStatus = bot.setupChecklist.map((item) => {
    let done = false;
    if (item.id === "channel") {
      done = !!(tenantSettings?.whatsappToken || tenantSettings?.instagramPageId || tenantSettings?.facebookPageId);
    } else if (item.id === "business_hours") {
      done = !!tenantSettings?.businessHours?.trim();
    } else if (item.id === "prompt_review") {
      done = !!tenantSettings?.aiPrompt?.trim();
    } else if (item.id === "welcome_review") {
      done = !!tenantSettings?.welcomeMessage?.trim();
    }
    // services / products: não há dado suficiente no settings endpoint — mostra como sugestão
    return { ...item, done };
  });

  const doneCount = checklistWithStatus.filter((c) => c.done).length;
  const totalCount = checklistWithStatus.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  const copyScenario = (msg: string) => {
    navigator.clipboard.writeText(msg).catch(() => {});
    setCopied(msg);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Bot identity */}
      <div className={`rounded-2xl p-6 bg-gradient-to-br ${display.color} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-4 -top-4 w-40 h-40 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{bot.emoji}</span>
            <div>
              <h2 className="text-2xl font-bold text-white">{bot.name}</h2>
              <p className="text-white/80 text-sm mt-0.5">{bot.nicheLabel} · {bot.toneOfVoice}</p>
              <p className="text-white/70 text-xs mt-1">🎯 {bot.objective}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">ativo</span>
            <button
              onClick={onGoComportamento}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Editar comportamento →
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Checklist de ativação</h3>
              <span className={`text-xs font-bold ${pct === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                {doneCount}/{totalCount} concluído(s)
              </span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-amber-400"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <ul className="space-y-3">
            {checklistWithStatus.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${
                  item.done
                    ? "bg-emerald-100 text-emerald-600"
                    : item.required
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {item.done ? (
                    <CheckIcon className="w-3 h-3" />
                  ) : (
                    <ExclamationTriangleIcon className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {item.label}
                    </span>
                    {item.required && !item.done && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        necessário
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  {!item.done && (
                    <Link href={item.href} className="text-xs text-indigo-600 font-semibold hover:underline mt-0.5 inline-block">
                      Configurar →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {pct === 100 && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 shrink-0" />
              Tudo configurado! Seu bot está pronto para atender.
            </div>
          )}
        </div>

        {/* Cenários de teste */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Cenários de teste sugeridos</h3>
          <p className="text-xs text-gray-500">
            Envie estas mensagens para o canal conectado para validar o comportamento do bot.
          </p>

          <ul className="space-y-3">
            {bot.testScenarios.map((scenario, i) => (
              <li key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2 items-start">
                    <span className="text-xs font-bold text-gray-400 mt-0.5">#{i + 1}</span>
                    <p className="text-sm font-medium text-gray-900">"{scenario.userMessage}"</p>
                  </div>
                  <button
                    onClick={() => copyScenario(scenario.userMessage)}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Copiar mensagem"
                  >
                    {copied === scenario.userMessage ? (
                      <CheckIcon className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 pl-5">
                  <span className="font-semibold text-gray-600">Esperado:</span> {scenario.expectedBehavior}
                </p>
              </li>
            ))}
          </ul>

          {bot.suggestedTools.length > 0 && (
            <div className="mt-2 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">Ferramentas recomendadas para este bot</p>
              <div className="flex flex-wrap gap-2">
                {bot.suggestedTools.map((tool) => {
                  const toolLinks: Record<string, { label: string; href: string; icon: string }> = {
                    agenda:     { label: "Agenda",     href: "/dashboard/appointments", icon: "📅" },
                    serviços:   { label: "Serviços",   href: "/dashboard/services",    icon: "🔧" },
                    produtos:   { label: "Produtos",   href: "/dashboard/products",    icon: "📦" },
                    pagamentos: { label: "Pagamentos", href: "/dashboard/payments",    icon: "💳" },
                  };
                  const t = toolLinks[tool];
                  if (!t) return null;
                  return (
                    <Link
                      key={tool}
                      href={t.href}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-all"
                    >
                      {t.icon} {t.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* O que foi configurado */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 text-sm mb-4">O que foi pré-configurado ao ativar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "🤖", label: "Prompt da IA", desc: "Personalidade, tom e regras de comportamento" },
            { icon: "👋", label: "Boas-vindas",  desc: "Mensagem enviada na primeira interação" },
            { icon: "⚡", label: `${display.automationsCount} automações`, desc: "Respostas rápidas para intenções comuns do segmento" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
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
              placeholder="Ex: Você é Maria, assistente virtual da loja Boutique Fashion. Seja educada, simpática e ajude os clientes com informações sobre produtos, preços e disponibilidade."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-2">💡 Dica: Quanto mais detalhado o prompt, melhor será o atendimento.</p>
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
              placeholder="Ex: Olá! 👋 Sou a secretária virtual da Boutique Fashion. Como posso te ajudar?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
            {welcomeMessage && (
              <div className="mt-4 p-4 bg-gradient-to-r from-[#4f46e5] to-[#5b51e0] rounded-xl text-white text-sm leading-relaxed">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">Prévia</p>
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
              placeholder="Ex: Seg-Sex 08:00-18:00, Sáb 09:00-13:00. Endereço: Rua das Flores, 123. Formas de pagamento: PIX, Cartão e Boleto."
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
