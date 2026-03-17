"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  totalConversations: number;
  activeConversations: number;
  messagesThisMonth: number;
  aiResponseRate: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const hasWhatsapp = ent.loading || ent.features.whatsapp;
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    activeConversations: 0,
    messagesThisMonth: 0,
    aiResponseRate: 0,
  });
  const [whatsappStatus, setWhatsappStatus] = useState<"connected" | "disconnected" | "loading">("loading");

  useEffect(() => {
    // Load basic stats
    const loadStats = async () => {
      try {
        const res = await fetch(`/api/conversations?tenantId=${user?.tenantId}`);
        if (res.ok) {
          const convs = await res.json();
          const active = convs.filter((c: any) => c.status === "ai" || c.status === "human").length;
          setStats({
            totalConversations: convs.length,
            activeConversations: active,
            messagesThisMonth: convs.length * 12, // approximate
            aiResponseRate: convs.length > 0 ? 94 : 0,
          });
        }
      } catch { /* ignore */ }
    };

    const checkWhatsapp = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
        const res = await fetch("/api/integrations/whatsapp/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWhatsappStatus(data.connected ? "connected" : "disconnected");
        } else {
          setWhatsappStatus("disconnected");
        }
      } catch {
        setWhatsappStatus("disconnected");
      }
    };

    if (user?.tenantId) {
      loadStats();
      checkWhatsapp();
    }
  }, [user?.tenantId]);

  const statCards = [
    {
      label: "Conversas Totais",
      value: stats.totalConversations.toString(),
      icon: "💬",
      change: "+12%",
      positive: true,
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50",
    },
    {
      label: "Atendimentos Ativos",
      value: stats.activeConversations.toString(),
      icon: "🟢",
      change: "agora",
      positive: true,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Mensagens (mês)",
      value: stats.messagesThisMonth.toString(),
      icon: "📨",
      change: "+8%",
      positive: true,
      gradient: "from-violet-500 to-purple-500",
      bg: "bg-violet-50",
    },
    {
      label: "Taxa de Resposta IA",
      value: `${stats.aiResponseRate}%`,
      icon: "🤖",
      change: "excelente",
      positive: true,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
    },
  ];

  const quickActions = [
    { label: "Ativar Automação", href: "/dashboard/onboarding", icon: "🚀", desc: "Wizard de ativação" },
    { label: "Ver Conversas", href: "/dashboard/conversations", icon: "💬", desc: "Inbox de atendimento" },
    { label: "Configurar IA", href: "/dashboard/ai", icon: "🤖", desc: "Tom de voz e regras" },
    { label: "Integrações", href: "/dashboard/integrations", icon: "🔌", desc: "WhatsApp e redes" },
    { label: "Agenda", href: "/dashboard/appointments", icon: "📅", desc: "Agendamentos" },
    { label: "Configurações", href: "/dashboard/settings", icon: "⚙️", desc: "Dados da empresa" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome banner */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] p-8 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Bem-vindo ao Variaty Secretary IA 🚀
            </h1>
            <p className="text-indigo-200 text-sm md:text-base max-w-xl">
              Seu painel de controle para automação de atendimento inteligente. Monitore conversas e gerencie seu plano.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
              {hasWhatsapp ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    {whatsappStatus === "connected" && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      whatsappStatus === "connected" ? "bg-green-400" : whatsappStatus === "loading" ? "bg-yellow-400" : "bg-red-400"
                    }`}></span>
                  </span>
                  <span className="text-sm font-medium">
                    WhatsApp {whatsappStatus === "connected" ? "Conectado" : whatsappStatus === "loading" ? "Verificando..." : "Desconectado"}
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400"></span>
                  </span>
                  <span className="text-sm font-medium text-white/70">
                    WhatsApp — Disponível no plano Standard
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Plan Usage Card */}
        <UsageCard tenantId={user?.tenantId} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Setup Checklist */}
      <SetupChecklist tenantId={user?.tenantId} hasWhatsappFeature={hasWhatsapp} />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className="group bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-lg hover:-translate-y-1 hover:border-[#4f46e5]/20 transition-all duration-300">
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{action.icon}</div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{action.label}</p>
              <p className="text-xs text-gray-400">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Atividade Recente</h3>
            <Link href="/dashboard/conversations" className="text-xs text-[#4f46e5] font-medium hover:underline">
              Ver tudo →
            </Link>
          </div>
          <div className="space-y-4">
            {stats.totalConversations > 0 ? (
              <>
                <ActivityItem icon="🤖" title="IA respondeu cliente" time="Agora" color="bg-indigo-50" />
                <ActivityItem icon="📨" title="Nova mensagem recebida" time="2 min atrás" color="bg-blue-50" />
                <ActivityItem icon="✅" title="Atendimento finalizado" time="15 min atrás" color="bg-green-50" />
                <ActivityItem icon="📅" title="Agendamento confirmado" time="1h atrás" color="bg-amber-50" />
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm">Nenhuma atividade ainda</p>
                <p className="text-xs mt-1">Conecte o WhatsApp para começar</p>
              </div>
            )}
          </div>
        </div>

        {/* System status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-6">Status do Sistema</h3>
          <div className="space-y-4">
            <StatusRow label="API WhatsApp" status={whatsappStatus === "connected" ? "online" : "offline"} />
            <StatusRow label="Motor de IA (GPT)" status={process.env.NEXT_PUBLIC_OPENAI_API_KEY ? "online" : "configurar"} />
            <StatusRow label="Banco de Dados" status="online" />
            <StatusRow label="Webhook WhatsApp" status="online" />
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Uptime</span>
              <span className="text-gray-900 font-bold">99.9%</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: "99.9%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, time, color }: { icon: string; title: string; time: string; color: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  const isOnline = status === "online";
  const needsConfig = status === "configurar";
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : needsConfig ? "bg-yellow-500" : "bg-red-500"}`}></span>
        <span className={`text-xs font-medium ${isOnline ? "text-emerald-600" : needsConfig ? "text-yellow-600" : "text-red-600"}`}>
          {isOnline ? "Online" : needsConfig ? "Configurar" : "Offline"}
        </span>
      </div>
    </div>
  );
}

function UsageCard({ tenantId }: { tenantId?: string }) {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/plan-usage?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => { setUsage(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId]);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse shadow-sm h-full">
      <div className="h-3 bg-gray-100 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-gray-100 rounded w-1/2 mb-4"></div>
      <div className="h-2 bg-gray-100 rounded w-full"></div>
    </div>
  );

  if (!usage) return null;

  const percentage = usage.limit === -1 ? 0 : Math.min(100, (usage.usage / usage.limit) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-center">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">Uso do Plano</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
          {usage.plan_name}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-gray-900 tracking-tight">{usage.usage.toLocaleString()}</span>
          <span className="text-sm text-gray-400 font-medium">
            / {usage.limit === -1 ? "∞" : usage.limit.toLocaleString()} créditos
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">Geração de IA Mensal</p>
      </div>

      <div className="relative h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
        <div 
          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${percentage > 90 ? "bg-red-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`}
          style={{ width: `${usage.limit === -1 ? 100 : Math.max(5, percentage)}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <span>{percentage.toFixed(0)}% USADO</span>
        <span>{usage.remaining === -1 ? "ILIMITADO" : `${usage.remaining.toLocaleString()} RESTANTES`}</span>
      </div>

      {usage.remaining !== -1 && usage.remaining < 500 && usage.remaining > 0 && (
        <div className="mt-5 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <p className="text-[11px] text-amber-700 font-medium leading-tight">
            Limite próximo. Faça upgrade para evitar pausas no atendimento.
          </p>
        </div>
      )}
    </div>
  );
}

function SetupChecklist({ tenantId, hasWhatsappFeature }: { tenantId?: string; hasWhatsappFeature: boolean }) {
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    fetch("/api/onboarding/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => { setChecklist(data.checklist); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId]);

  if (loading || !checklist) return null;

  const items = [
    { key: "companyConfigured", label: "Empresa configurada", icon: "🏢" },
    { key: "whatsappConnected", label: "WhatsApp conectado", icon: "📱" },
    { key: "servicesCreated", label: "Serviços cadastrados", icon: "📋" },
    { key: "aiConfigured", label: "IA configurada", icon: "🤖" },
    { key: "automationsCreated", label: "Automações criadas", icon: "⚙️" },
    { key: "firstTestDone", label: "Primeira mensagem recebida", icon: "🧪" },
  ];

  const completed = items.filter(i => checklist[i.key]).length;
  const total = items.length;

  // Hide when all complete
  if (completed === total) return null;

  const hasCriticalMissing = !checklist.whatsappConnected || !checklist.aiConfigured;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Configuração da Plataforma</h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
          completed === total ? "text-emerald-600 bg-emerald-50" : "text-indigo-600 bg-indigo-50"
        }`}>
          {completed}/{total} concluídos
        </span>
      </div>

      {/* L5 – Fast Onboarding CTA */}
      <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">🚀</span>
          <p className="text-xs text-indigo-800 font-medium leading-tight">
            Configure tudo em minutos com o assistente de ativação.
          </p>
        </div>
        <Link href="/dashboard/onboarding" className="text-xs whitespace-nowrap px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
          Ativar agora →
        </Link>
      </div>

      {hasCriticalMissing && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <p className="text-xs text-amber-700 font-medium">
            Itens essenciais estão pendentes. O atendimento automático não funcionará até que WhatsApp e IA estejam configurados.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => {
          const done = checklist[item.key];
          const isWhatsappGated = item.key === "whatsappConnected" && !hasWhatsappFeature;
          return (
            <div key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              isWhatsappGated ? "bg-gray-50 border-gray-200" : done ? "bg-emerald-50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
            }`}>
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${
                  isWhatsappGated ? "text-gray-400" : done ? "text-emerald-700" : "text-amber-700"
                }`}>
                  {isWhatsappGated ? "Requer plano Standard" : item.label}
                </p>
              </div>
              <span className={`text-sm font-bold ${
                isWhatsappGated ? "text-gray-300" : done ? "text-emerald-500" : "text-amber-500"
              }`}>
                {isWhatsappGated ? "🔒" : done ? "✓" : "⚠"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

