"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import Link from "next/link";
import {
  CheckCircleIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { marketplaceBots, Blueprint } from "@/lib/marketplace/bots";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Tab = "marketplace" | "meubot" | "comportamento";

// Cores por blueprint — cobre todos os bots automaticamente
const BLUEPRINT_DISPLAY: Record<Blueprint, { color: string; tagColor: string }> = {
  "agenda-servicos": { color: "from-emerald-500 to-teal-500",  tagColor: "bg-emerald-100 text-emerald-700" },
  "catalogo-vendas": { color: "from-violet-500 to-purple-600", tagColor: "bg-violet-100 text-violet-700"  },
  "consulta-leads":  { color: "from-amber-500 to-orange-500",  tagColor: "bg-amber-100 text-amber-700"   },
  "hibrido":         { color: "from-sky-500 to-blue-600",      tagColor: "bg-sky-100 text-sky-700"       },
};

// ─── Página principal ─────────────────────────────────────────────────────────

function BotsIAContent() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") as Tab) || "marketplace";

  // Estado compartilhado: bot ativo
  const [activeBotId, setActiveBotId] = useState<string | null>(null);

  // Carrega tenant settings e determina o bot ativo
  useEffect(() => {
    if (!user?.tenantId) return;
    fetch(`/api/tenant/settings?tenantId=${user.tenantId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.activeBotKey) {
          // fonte de verdade primária
          setActiveBotId(data.activeBotKey);
        } else {
          // fallback somente-leitura para tenants antigos (não persiste)
          const bt = data.businessType || "";
          const found = marketplaceBots.find((b) => b.niche === bt);
          if (found) setActiveBotId(found.id);
        }
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

  const onBotActivated = (botId: string) => {
    setActiveBotId(botId);
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
  activeBotId,
}: {
  user: any;
  ent: any;
  onBotActivated: (botId: string) => void;
  activeBotId: string | null;
}) {
  const activeBot = activeBotId ? marketplaceBots.find(b => b.id === activeBotId) : null;

  return (
    <div className="max-w-2xl py-8 space-y-6">
      <div className="text-center space-y-3">
        <div className="text-5xl">🧠</div>
        <h2 className="text-xl font-bold text-gray-900">Ativação de bots unificada</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
          A seleção e ativação de bots do marketplace foi movida para a{" "}
          <strong>Central de Atendimento IA</strong>, onde você pode configurar todo o
          comportamento conversacional em um único lugar.
        </p>
      </div>

      {activeBot && (
        <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4">
          <span className="text-2xl">{activeBot.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Bot ativo: {activeBot.name}</p>
            <p className="text-xs text-indigo-600">{activeBot.nicheLabel}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Link
          href="/dashboard/atendimento-ia#bot-preset"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <SparklesIcon className="w-4 h-4" />
          Ir para Central de Atendimento IA
        </Link>
      </div>
    </div>
  );
}

// ─── Aba: Meu Bot ─────────────────────────────────────────────────────────────

function MeuBotTab({
  activeBotId,
  onGoMarketplace,
  onGoComportamento,
}: {
  activeBotId: string | null;
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

  const display = BLUEPRINT_DISPLAY[bot.blueprint as Blueprint];

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
        {/* Link para Setup */}
        <Link
          href="/dashboard/setup"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all group"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircleIcon className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-gray-900 text-sm">Checklist de ativação</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Veja o progresso completo da configuração da plataforma e do bot em um só lugar.
            </p>
          </div>
          <div className="mt-4 text-xs font-semibold text-indigo-600 group-hover:underline">
            Abrir checklist →
          </div>
        </Link>

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
                    produtos:   { label: "Produtos",   href: "/dashboard/vendas?tab=produtos",    icon: "📦" },
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
            { icon: "⚡", label: `${bot.automations.length} automações`, desc: "Respostas rápidas para intenções comuns do segmento" },
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

  useEffect(() => {
    if (!user?.tenantId) return;
    setLoading(true);
    fetch(`/api/tenant/settings?tenantId=${user.tenantId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setAiPrompt(data.aiPrompt || data.ai_prompt || "");
        setWelcomeMessage(data.welcomeMessage || data.welcome_message || "");
        setBusinessHours(data.businessHours || data.business_hours || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <span className="text-xl mt-0.5">🔒</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Comportamento da IA gerenciado na Central</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Edição do prompt, boas-vindas e horários foi unificada na Central de Atendimento IA.{" "}
            <a href="/dashboard/atendimento-ia#ai-identity" className="underline font-medium hover:text-amber-900">
              Editar na Central →
            </a>
          </p>
        </div>
      </div>

      {/* Read-only prompt */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-xl flex items-center justify-center text-white text-lg">🤖</div>
            <div>
              <h3 className="font-bold text-gray-900">Prompt Base da IA</h3>
              <p className="text-xs text-gray-500">Somente leitura — edite na Central</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <textarea
            rows={6}
            value={aiPrompt}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none leading-relaxed text-gray-600 cursor-default"
          />
        </div>
      </div>

      {/* Read-only boas-vindas */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg">👋</div>
            <div>
              <h3 className="font-bold text-gray-900">Mensagem de Boas-Vindas</h3>
              <p className="text-xs text-gray-500">Somente leitura — edite na Central</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <textarea
            rows={4}
            value={welcomeMessage}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none leading-relaxed text-gray-600 cursor-default"
          />
        </div>
      </div>

      {/* Read-only horários */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">🕐</div>
            <div>
              <h3 className="font-bold text-gray-900">Horários e Regras</h3>
              <p className="text-xs text-gray-500">Somente leitura — edite na Central</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <textarea
            rows={4}
            value={businessHours}
            readOnly
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none leading-relaxed text-gray-600 cursor-default"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <a
          href="/dashboard/atendimento-ia#ai-identity"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Editar na Central de Atendimento IA →
        </a>
      </div>
    </div>
  );
}
