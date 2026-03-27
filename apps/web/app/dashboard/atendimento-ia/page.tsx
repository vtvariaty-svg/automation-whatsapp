"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import GuidedAiSetupChat from "@/components/ai/GuidedAiSetupChat";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import {
  marketplaceBots,
  Blueprint,
  Module,
  MODULE_LABELS,
} from "@/lib/marketplace/bots";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

// ── Types ────────────────────────────────────────────────────────────────────

interface HandoffConfig {
  enabled: boolean;
  alertPhone: string;
  clientMessage: string;
  operatorMessage: string;
  cooldownMinutes: number;
  maxAlertsPerConversation: number;
  autoSetHuman: boolean;
  triggerOnLowConfidence: boolean;
  triggerOnExplicitRequest: boolean;
  triggerOnRepetition: boolean;
  triggerOnCheckoutError: boolean;
  triggerOnNoProduct: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  triggerValue: string;
  matchType: string;
  responseType: string;
  response: string;
  active: boolean;
}

interface ServiceItem {
  id: string;
  name: string;
  duration: number;
  active: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  active: boolean;
  category: string | null;
}

interface OperationalConfig {
  openingHours: string;
  templateBookingConfirmed: string;
  templateReminder24h: string;
}

interface ControlCenterData {
  businessContext: { companyName: string; businessType: string; contactPhone: string; address: string };
  aiIdentity: { aiPrompt: string; businessHours: string };
  welcome: { message: string };
  session: { timeoutHours: number };
  botPreset: { activeBotKey: string | null; botName: string | null; niche: string | null; tone: string | null; description: string | null; blueprint: string | null; emoji: string | null };
  operationalConfig: OperationalConfig;
  commercialBehavior: { products: ProductItem[] };
  automations: AutomationRule[];
  schedulingBehavior: { enabled: boolean; mode: "com_profissionais" | "disponibilidade_global"; servicesCount: number; professionalsCount: number; services: ServiceItem[] };
  handoff: HandoffConfig;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BLUEPRINT_DISPLAY: Record<Blueprint, { color: string; tagColor: string }> = {
  "agenda-servicos": { color: "from-emerald-500 to-teal-500", tagColor: "bg-emerald-100 text-emerald-700" },
  "catalogo-vendas": { color: "from-violet-500 to-purple-600", tagColor: "bg-violet-100 text-violet-700" },
  "consulta-leads":  { color: "from-amber-500 to-orange-500",  tagColor: "bg-amber-100 text-amber-700"   },
  hibrido:           { color: "from-sky-500 to-blue-600",      tagColor: "bg-sky-100 text-sky-700"       },
};


const ORDER_STATUS_OPTIONS = [
  { value: "draft",           label: "Pedido criado"         },
  { value: "pending_payment", label: "Aguardando pagamento"  },
  { value: "paid",            label: "Pedido pago"           },
  { value: "processing",      label: "Em processamento"      },
  { value: "completed",       label: "Pedido concluído"      },
  { value: "cancelled",       label: "Pedido cancelado"      },
  { value: "refunded",        label: "Pedido reembolsado"    },
];

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

// ── Shared UI ──────────────────────────────────────────────────────────────────

function SectionCard({ id, icon, title, subtitle, children }: {
  id?: string; icon: string; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden scroll-mt-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-xl flex items-center justify-center text-lg shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SaveBtn({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
      {saved && <span className="text-sm text-emerald-600 font-medium">Salvo!</span>}
      <button
        onClick={onClick}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50"
      >
        {saving
          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</>
          : "Salvar"}
      </button>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? "bg-[#4f46e5]" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AtendimentoIAPage() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Section states
  const [businessCtx, setBusinessCtx] = useState({ companyName: "", businessType: "", contactPhone: "", address: "" });
  const [aiIdentity, setAiIdentity] = useState({ aiPrompt: "", businessHours: "" });
  const [welcome, setWelcome] = useState({ message: "" });
  const [sessionConfig, setSessionConfig] = useState({ timeoutHours: 24 });
  const [handoff, setHandoff] = useState<HandoffConfig>({
    enabled: false, alertPhone: "", clientMessage: "", operatorMessage: "",
    cooldownMinutes: 60, maxAlertsPerConversation: 3, autoSetHuman: true,
    triggerOnLowConfidence: true, triggerOnExplicitRequest: true,
    triggerOnRepetition: false, triggerOnCheckoutError: false, triggerOnNoProduct: false,
  });
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [schedulingMeta, setSchedulingMeta] = useState({ enabled: false, mode: "disponibilidade_global" as "com_profissionais" | "disponibilidade_global", servicesCount: 0, professionalsCount: 0 });
  const [operationalConfig, setOperationalConfig] = useState<OperationalConfig>({ openingHours: "", templateBookingConfirmed: "", templateReminder24h: "" });

  // Guided setup — initialGuidedSetup is set ONCE from the API load and never updated from onChange.
  // This breaks the circular: onChange → setGuidedSetup → new prop ref → re-sync loop in GuidedAiSetupChat.
  const [initialGuidedSetup, setInitialGuidedSetup] = useState<Record<string, unknown>>({});
  const latestGuidedAnswers = useRef<Record<string, unknown>>({});

  // Autosave status
  type AutoSaveStatus = 'idle' | 'saving' | 'saved';
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bot
  const [activeBotKey, setActiveBotKey] = useState<string | null>(null);
  const [showBotGrid, setShowBotGrid] = useState(false);
  const [activatingBot, setActivatingBot] = useState<string | null>(null);
  const [botMsg, setBotMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [resettingPreset, setResettingPreset] = useState(false);

  // Save state per section key
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved,  setSaved]  = useState<Record<string, boolean>>({});

  // Automation modal
  const [autoModal, setAutoModal]     = useState(false);
  const [editingAuto, setEditingAuto] = useState<AutomationRule | null>(null);
  const [autoForm, setAutoForm] = useState({ name: "", triggerType: "keyword", triggerValue: "", matchType: "exact", responseType: "text", responseText: "" });
  const [autoSaving, setAutoSaving]   = useState(false);
  const [autoToast, setAutoToast]     = useState("");

  // Simulation
  const [simMsg, setSimMsg]                 = useState("");
  const [simFirstContact, setSimFirstContact] = useState(false);
  const [simLoading, setSimLoading]         = useState(false);
  const [simResult, setSimResult]           = useState<any>(null);

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [res, gsRes] = await Promise.all([
          fetch("/api/ai-control-center", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/ai-guided-setup",   { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        ]);
        if (!res.ok) throw new Error("Erro ao carregar configurações");
        const d: ControlCenterData = await res.json();

        if (gsRes?.ok) {
          const gs = await gsRes.json();
          const setup = gs.setup ?? {};
          setInitialGuidedSetup(setup);
          latestGuidedAnswers.current = setup;
        }

        setBusinessCtx(d.businessContext);
        setAiIdentity(d.aiIdentity);
        setWelcome(d.welcome);
        setSessionConfig(d.session || { timeoutHours: 24 });
        setHandoff(d.handoff);
        setServices(d.schedulingBehavior.services);
        setProducts(d.commercialBehavior.products);
        setAutomations(d.automations);
        setActiveBotKey(d.botPreset.activeBotKey);
        setSchedulingMeta({
          enabled: d.schedulingBehavior.enabled,
          mode: d.schedulingBehavior.mode,
          servicesCount: d.schedulingBehavior.servicesCount,
          professionalsCount: d.schedulingBehavior.professionalsCount,
        });
        setOperationalConfig(d.operationalConfig || { openingHours: "", templateBookingConfirmed: "", templateReminder24h: "" });
      } catch (e: any) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  async function putSection(key: string, payload: Record<string, any>) {
    setSaving((s) => ({ ...s, [key]: true }));
    setSaved((s) => ({ ...s, [key]: false }));
    try {
      const res = await fetch("/api/ai-control-center", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setSaved((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  }

  // autoSaveGuidedSetup — debounced, no full page reload, patches state from response
  const autoSaveGuidedSetup = useCallback(async (answers: Record<string, unknown>) => {
    latestGuidedAnswers.current = answers;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('saving');

    autoSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai-guided-setup", {
          method:  "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ setup: answers }),
        });
        if (!res.ok) return;
        const data = await res.json();
        // Patch local state silently — no full control-center reload needed
        if (data.newPrompt)  setAiIdentity((p) => ({ ...p, aiPrompt: data.newPrompt }));
        if (data.newWelcome) setWelcome({ message: data.newWelcome });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2500);
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 800);
  }, [token]);

  // saveGuidedSetup — manual fallback (keeps the Save button working)
  async function saveGuidedSetup() {
    setSaving((s) => ({ ...s, guidedSetup: true }));
    setSaved((s)  => ({ ...s, guidedSetup: false }));
    try {
      const res = await fetch("/api/ai-guided-setup", {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ setup: latestGuidedAnswers.current }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const data = await res.json();
      // Patch silently from response — no second fetch needed
      if (data.newPrompt)  setAiIdentity((p) => ({ ...p, aiPrompt: data.newPrompt }));
      if (data.newWelcome) setWelcome({ message: data.newWelcome });
      setSaved((s) => ({ ...s, guidedSetup: true }));
      setTimeout(() => setSaved((s) => ({ ...s, guidedSetup: false })), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving((s) => ({ ...s, guidedSetup: false }));
    }
  }

  async function activateBot(botId: string) {
    setActivatingBot(botId);
    setBotMsg(null);
    try {
      const res = await fetch("/api/marketplace/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ botId }),
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setActiveBotKey(botId);
        setShowBotGrid(false);
        setBotMsg({ type: "ok", text: "Bot ativado com sucesso!" });
        setTimeout(() => setBotMsg(null), 3000);
        // Reload AI identity after activation (bot overwrites prompt/welcome)
        const r2 = await fetch("/api/ai-control-center", { headers: { Authorization: `Bearer ${token}` } });
        if (r2.ok) {
          const d2: ControlCenterData = await r2.json();
          setAiIdentity(d2.aiIdentity);
          setWelcome(d2.welcome);
          setAutomations(d2.automations);
        }
      } else {
        setBotMsg({ type: "err", text: d.error || "Erro ao ativar bot" });
      }
    } catch {
      setBotMsg({ type: "err", text: "Erro ao conectar com o servidor" });
    } finally {
      setActivatingBot(null);
    }
  }


  async function resetPreset() {
    if (!window.confirm(
      "Tem certeza? Isso vai remover o bot ativo, o prompt derivado e todas as automações e serviços semeados pelo preset.\n\nAutomações e serviços criados manualmente são preservados."
    )) return;

    setResettingPreset(true);
    setBotMsg(null);
    try {
      const res = await fetch("/api/marketplace/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setActiveBotKey(null);
        setAiIdentity((p) => ({ ...p, aiPrompt: "" }));
        setBotMsg({ type: "ok", text: "Preset resetado. Automações e serviços do sistema removidos." });
        // Reload automations list
        const r2 = await fetch("/api/ai-control-center", { headers: { Authorization: `Bearer ${token}` } });
        if (r2.ok) {
          const d2: ControlCenterData = await r2.json();
          setAutomations(d2.automations);
        }
        setTimeout(() => setBotMsg(null), 4000);
      } else {
        setBotMsg({ type: "err", text: d.error || "Erro ao resetar preset" });
      }
    } catch {
      setBotMsg({ type: "err", text: "Erro ao conectar com o servidor" });
    } finally {
      setResettingPreset(false);
    }
  }

  async function toggleService(serviceId: string, active: boolean) {
    setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, active } : s)));
    await fetch(`/api/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: user?.tenantId, active }),
    });
  }

  async function toggleProduct(productId: string, active: boolean) {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, active } : p)));
    await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active }),
    });
  }

  function showAutoToast(msg: string) {
    setAutoToast(msg);
    setTimeout(() => setAutoToast(""), 3000);
  }

  async function reloadAutomations() {
    const r = await fetch("/api/automations", { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) {
      const list = await r.json();
      setAutomations(list.map((a: any) => ({ ...a, response: a.responseText })));
    }
  }

  async function handleAutoSave(e: React.FormEvent) {
    e.preventDefault();
    setAutoSaving(true);
    try {
      const url    = editingAuto ? `/api/automations/${editingAuto.id}` : `/api/automations`;
      const method = editingAuto ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...autoForm, active: editingAuto ? editingAuto.active : true }),
      });
      if (res.ok) {
        setAutoModal(false);
        setEditingAuto(null);
        setAutoForm({ name: "", triggerType: "keyword", triggerValue: "", matchType: "exact", responseType: "text", responseText: "" });
        await reloadAutomations();
        showAutoToast(editingAuto ? "Automação atualizada" : "Automação criada");
      } else {
        showAutoToast("Erro ao salvar automação");
      }
    } catch {
      showAutoToast("Erro ao salvar automação");
    } finally {
      setAutoSaving(false);
    }
  }

  async function handleAutoDelete(id: string) {
    if (!confirm("Remover esta automação?")) return;
    await fetch(`/api/automations/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    showAutoToast("Automação removida");
  }

  async function toggleAutoActive(a: AutomationRule) {
    const res = await fetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !a.active }),
    });
    if (res.ok) setAutomations((prev) => prev.map((x) => (x.id === a.id ? { ...x, active: !x.active } : x)));
  }

  async function runSimulation(e: React.FormEvent) {
    e.preventDefault();
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/ai-control-center/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: simMsg, isFirstContact: simFirstContact }),
      });
      setSimResult(await res.json());
    } catch (e: any) {
      setSimResult({ error: e.message });
    } finally {
      setSimLoading(false);
    }
  }

  // ── Render guards ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-red-600 font-medium">{loadError}</p>
      </div>
    );
  }

  const activeBot = activeBotKey ? marketplaceBots.find((b) => b.id === activeBotKey) : null;
  const hasPremiumTemplates = ent.loading || ent.features.premiumTemplates;
  const activeAutomations = automations.filter((a) => a.active).length;
  const activeProducts    = products.filter((p) => p.active).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          🧠 Atendimento IA
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure todo o comportamento do atendimento automatizado em um só lugar.
        </p>
      </div>

      {/* ── 1. Contexto do Negócio ────────────────────────────────────────────── */}
      <SectionCard id="contexto" icon="🏢" title="Contexto do Negócio" subtitle="Informações que a IA usa para contextualizar as respostas">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome da Empresa</label>
              <input
                type="text"
                value={businessCtx.companyName}
                onChange={(e) => setBusinessCtx((p) => ({ ...p, companyName: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
                placeholder="Nome do seu negócio"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefone Comercial</label>
              <input
                type="text"
                value={businessCtx.contactPhone}
                onChange={(e) => setBusinessCtx((p) => ({ ...p, contactPhone: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Endereço</label>
            <input
              type="text"
              value={businessCtx.address}
              onChange={(e) => setBusinessCtx((p) => ({ ...p, address: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </div>
          <SaveBtn saving={saving.businessCtx} saved={saved.businessCtx} onClick={() => putSection("businessCtx", { businessContext: businessCtx })} />
        </div>
      </SectionCard>

      {/* ── 2. Bot Ativo / Preset ─────────────────────────────────────────────── */}
      <SectionCard id="bot-preset" icon="🤖" title="Bot Ativo / Preset" subtitle="Personalidade base da IA e preset de nicho — fonte primária de configuração">
        <div className="space-y-5">

          {/* Active bot card */}
          {activeBot ? (
            <div className={`rounded-xl p-4 bg-gradient-to-r ${BLUEPRINT_DISPLAY[activeBot.blueprint as Blueprint]?.color ?? "from-gray-400 to-gray-500"} relative overflow-hidden`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeBot.emoji}</span>
                  <div>
                    <p className="text-white font-bold">{activeBot.name}</p>
                    <p className="text-white/70 text-xs">{activeBot.nicheLabel} · {activeBot.toneOfVoice}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">ativo</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
              <p className="text-sm text-gray-500">Nenhum bot ativo. Selecione um abaixo.</p>
            </div>
          )}

          {botMsg && (
            <p className={`text-sm font-medium ${botMsg.type === "ok" ? "text-emerald-600" : "text-red-600"}`}>{botMsg.text}</p>
          )}

          <button
            type="button"
            onClick={() => setShowBotGrid((v) => !v)}
            className="text-sm font-semibold text-[#4f46e5] hover:text-[#4338ca] transition-colors"
          >
            {showBotGrid ? "Fechar seletor ↑" : activeBot ? "Trocar bot →" : "Escolher bot →"}
          </button>

          {showBotGrid && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {marketplaceBots.map((bot) => {
                const isActive    = activeBotKey === bot.id;
                const isActivating = activatingBot === bot.id;
                const display     = BLUEPRINT_DISPLAY[bot.blueprint as Blueprint];
                return (
                  <div key={bot.id} className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${isActive ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200 bg-white"}`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${display.color} flex items-center justify-center text-xl shrink-0`}>
                      {bot.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{bot.name}</p>
                      <p className="text-xs text-gray-500 truncate">{bot.nicheLabel} · {bot.automations.length} automações</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bot.modules.slice(0, 3).map((m) => (
                          <span key={m} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${display.tagColor}`}>{MODULE_LABELS[m as Module]}</span>
                        ))}
                      </div>
                    </div>
                    {hasPremiumTemplates ? (
                      isActive ? (
                        <span className="text-xs text-indigo-600 font-bold shrink-0 mt-1">Ativo</span>
                      ) : (
                        <button
                          onClick={() => activateBot(bot.id)}
                          disabled={!!activatingBot}
                          className={`shrink-0 px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r ${display.color} disabled:opacity-60 transition-all`}
                        >
                          {isActivating ? "..." : "Ativar"}
                        </button>
                      )
                    ) : (
                      <Link href="/dashboard/billing" className="shrink-0 text-xs text-gray-400 font-medium mt-1">Pro →</Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Preset aplicado automaticamente — sem seleção manual separada */}
          <div className="pt-4 border-t border-gray-100 flex items-start justify-between gap-4">
            <p className="text-xs text-gray-400">
              💡 Ao ativar um bot, a configuração base do seu tipo de negócio — serviços padrão e automações — é aplicada automaticamente.
            </p>
            {activeBotKey && (
              <button
                type="button"
                onClick={resetPreset}
                disabled={resettingPreset}
                className="shrink-0 text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors disabled:opacity-40"
                title="Remove o bot ativo, o prompt derivado e as automações/serviços semeados pelo preset. Dados manuais são preservados."
              >
                {resettingPreset ? "Resetando..." : "Resetar preset"}
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── 2b. Ensine sua IA ─────────────────────────────────────────────────── */}
      <SectionCard id="ensinar-ia" icon="💡" title="Ensine sua IA" subtitle="Configure o comportamento com perguntas guiadas — sem depender só de prompt manual.">
        <div className="space-y-1">
          <p className="text-xs text-gray-400 mb-4">
            Suas respostas geram um bloco estruturado que é mesclado automaticamente no prompt da IA.
            O conteúdo manual abaixo (seção Identidade da IA) é sempre preservado.
          </p>
          <GuidedAiSetupChat
            initialAnswers={initialGuidedSetup as any}
            persistKey={user?.tenantId ? `guided_ai_setup_draft:${user.tenantId}` : undefined}
            onAutoSave={(a) => autoSaveGuidedSetup(a as Record<string, unknown>)}
            onComplete={(a) => autoSaveGuidedSetup(a as Record<string, unknown>)}
          />
          {/* Autosave status indicator */}
          <div className="flex items-center justify-end gap-3 pt-3 min-h-[2.5rem]">
            {autoSaveStatus === 'saving' && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-3 h-3 border border-gray-300 border-t-[#4f46e5] rounded-full animate-spin inline-block" />
                Salvando...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Salvo
              </span>
            )}
            {/* Manual save fallback — always available */}
            <button
              onClick={saveGuidedSetup}
              disabled={saving.guidedSetup}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors disabled:opacity-40"
            >
              {saving.guidedSetup ? 'Salvando...' : 'Salvar manualmente'}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── 3. Identidade da IA ───────────────────────────────────────────────── */}
      <SectionCard id="ai-identity" icon="💬" title="Identidade da IA" subtitle="Prompt base e contexto de horários que orientam as respostas da IA">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prompt Base da IA</label>
            <textarea
              rows={6}
              value={aiIdentity.aiPrompt}
              onChange={(e) => setAiIdentity((p) => ({ ...p, aiPrompt: e.target.value }))}
              placeholder="Ex: Você é Maria, assistente virtual da Boutique Fashion. Seja educada, simpática e ajude os clientes com informações sobre produtos, preços e disponibilidade."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all resize-none leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">💡 Quanto mais detalhado o prompt, melhor o atendimento.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Horários e Regras de Contexto</label>
            <textarea
              rows={3}
              value={aiIdentity.businessHours}
              onChange={(e) => setAiIdentity((p) => ({ ...p, businessHours: e.target.value }))}
              placeholder="Ex: Seg-Sex 08:00-18:00, Sáb 09:00-13:00. Endereço: Rua das Flores, 123. PIX, Cartão e Boleto."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all resize-none leading-relaxed"
            />
          </div>
          <SaveBtn saving={saving.aiIdentity} saved={saved.aiIdentity} onClick={() => putSection("aiIdentity", { aiIdentity })} />
        </div>
      </SectionCard>

      {/* ── 4. Mensagem de Boas-Vindas ────────────────────────────────────────── */}
      <SectionCard id="welcome" icon="👋" title="Mensagem de Boas-Vindas" subtitle="Enviada automaticamente no primeiro contato do cliente">
        <div className="space-y-4">
          {!welcome.message && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-base shrink-0">🚨</span>
              <div>
                <p className="text-sm font-semibold text-red-800">Setup incompleto — boas-vindas não configuradas</p>
                <p className="text-xs text-red-600 mt-0.5">
                  O primeiro contato de cada cliente não receberá resposta automática.
                  Configure esta mensagem antes de ir para produção.
                  Bots e presets não definem mais esta mensagem automaticamente — ela é de sua responsabilidade.
                </p>
              </div>
            </div>
          )}
          <textarea
            rows={4}
            value={welcome.message}
            onChange={(e) => setWelcome({ message: e.target.value })}
            placeholder="Ex: Olá! 👋 Sou a secretária virtual. Como posso te ajudar hoje?"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all resize-none leading-relaxed"
          />
          <div className="text-[11px] text-amber-600 font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-100 flex items-start gap-2">
            <span className="text-sm shrink-0">⚠️</span>
            <p>Esta mensagem é enviada <b>exatamente como digitada</b> no primeiro contato. A IA só responde a partir da <b>segunda mensagem</b>.</p>
          </div>
          {welcome.message && (
            <div className="p-4 bg-gradient-to-r from-[#4f46e5] to-[#5b51e0] rounded-xl text-white text-sm leading-relaxed">
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">Prévia</p>
              {welcome.message}
            </div>
          )}
          <SaveBtn saving={saving.welcome} saved={saved.welcome} onClick={() => putSection("welcome", { welcome: { message: welcome.message.trim() === "" ? "__clear__" : welcome.message } })} />

          {/* ── Session timeout ─────────────────────────────────────────────── */}
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Reinício de sessão após inatividade</label>
            <p className="text-xs text-gray-500">
              Após este período sem mensagens, o próximo contato do cliente inicia uma nova sessão:
              boas-vindas são reenviadas e estados pendentes (agendamento, comercial) são limpos automaticamente.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min={1}
                max={168}
                value={sessionConfig.timeoutHours}
                onChange={(e) => setSessionConfig({ timeoutHours: Math.max(1, Math.min(168, parseInt(e.target.value, 10) || 24)) })}
                className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
              />
              <span className="text-sm text-gray-500">horas (1 – 168)</span>
              <SaveBtn saving={saving.sessionConfig} saved={saved.sessionConfig} onClick={() => putSection("sessionConfig", { session: sessionConfig })} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 5. Agendamento & Serviços ─────────────────────────────────────────── */}
      <SectionCard id="agendamento" icon="📅" title="Agendamento & Serviços" subtitle="Serviços disponíveis para o fluxo de agendamento automático pelo WhatsApp">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Status do agendamento</p>
              <p className={`text-sm font-bold ${schedulingMeta.enabled ? "text-emerald-600" : "text-gray-400"}`}>
                {schedulingMeta.enabled ? "Ativo" : "Inativo"}
              </p>
              {!schedulingMeta.enabled && <p className="text-[10px] text-gray-400 mt-0.5">Cadastre ao menos 1 serviço</p>}
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Modo de operação</p>
              <p className="text-sm font-bold text-gray-800">
                {schedulingMeta.mode === "com_profissionais" ? "Com profissionais" : "Disponibilidade global"}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Cadastros ativos</p>
              <p className="text-sm font-bold text-gray-800">
                {schedulingMeta.servicesCount} serviço{schedulingMeta.servicesCount !== 1 ? "s" : ""} · {schedulingMeta.professionalsCount} profissional{schedulingMeta.professionalsCount !== 1 ? "is" : ""}
              </p>
            </div>
          </div>

          {services.length > 0 ? (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.duration} min</p>
                  </div>
                  <Toggle value={s.active} onChange={(v) => toggleService(s.id, v)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Nenhum serviço cadastrado ainda.
            </div>
          )}

          <div className="flex gap-4 pt-1">
            <Link href="/dashboard/services" className="text-sm font-semibold text-[#4f46e5] hover:text-[#4338ca] transition-colors">
              Gerenciar serviços →
            </Link>
            <Link href="/dashboard/professionals" className="text-sm font-semibold text-[#4f46e5] hover:text-[#4338ca] transition-colors">
              Gerenciar profissionais →
            </Link>
          </div>
        </div>
      </SectionCard>

      {/* ── 5b. Configuração Operacional de Agendamento ───────────────────────── */}
      <SectionCard id="config-operacional" icon="🕐" title="Configuração Operacional de Agendamento" subtitle="Horário de funcionamento, templates de confirmação e lembrete — usados pelo motor de agendamento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Horário de Funcionamento</label>
            <input
              type="text"
              value={operationalConfig.openingHours}
              onChange={(e) => setOperationalConfig((p) => ({ ...p, openingHours: e.target.value }))}
              placeholder="Ex: Seg-Sex 08:00-18:00, Sáb 09:00-13:00"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Usado pelo motor de slots para calcular disponibilidade real de agendamentos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Template — Confirmação de Agendamento</label>
              <input
                type="text"
                value={operationalConfig.templateBookingConfirmed}
                onChange={(e) => setOperationalConfig((p) => ({ ...p, templateBookingConfirmed: e.target.value }))}
                placeholder="Ex: appointment_confirmation"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                Variáveis: <code className="bg-gray-100 px-1 rounded">{"{{1}}"}</code> Nome · <code className="bg-gray-100 px-1 rounded">{"{{2}}"}</code> Serviço · <code className="bg-gray-100 px-1 rounded">{"{{3}}"}</code> Data · <code className="bg-gray-100 px-1 rounded">{"{{4}}"}</code> Hora
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Template — Lembrete de Véspera (24h)</label>
              <input
                type="text"
                value={operationalConfig.templateReminder24h}
                onChange={(e) => setOperationalConfig((p) => ({ ...p, templateReminder24h: e.target.value }))}
                placeholder="Ex: appointment_reminder_24h"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                Variáveis: <code className="bg-gray-100 px-1 rounded">{"{{1}}"}</code> Nome · <code className="bg-gray-100 px-1 rounded">{"{{2}}"}</code> Serviço · <code className="bg-gray-100 px-1 rounded">{"{{3}}"}</code> Data · <code className="bg-gray-100 px-1 rounded">{"{{4}}"}</code> Hora
              </p>
            </div>
          </div>
          <SaveBtn saving={saving.operationalConfig} saved={saved.operationalConfig} onClick={() => putSection("operationalConfig", { operationalConfig })} />
        </div>
      </SectionCard>

      {/* ── 6. Comportamento Comercial ────────────────────────────────────────── */}
      <SectionCard id="comercial" icon="🏪" title="Comportamento Comercial" subtitle="Produtos disponíveis para catálogo e checkout automático pela IA">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{activeProducts}</span> de{" "}
            <span className="font-semibold text-gray-800">{products.length}</span> produto{products.length !== 1 ? "s" : ""} ativo{activeProducts !== 1 ? "s" : ""} no catálogo.
          </p>

          {products.length > 0 ? (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.category ? `${p.category} · ` : ""}
                      {fmtBRL(p.price)}
                    </p>
                  </div>
                  <Toggle value={p.active} onChange={(v) => toggleProduct(p.id, v)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Nenhum produto cadastrado ainda.
            </div>
          )}

          <Link href="/dashboard/vendas?tab=produtos" className="inline-block text-sm font-semibold text-[#4f46e5] hover:text-[#4338ca] transition-colors">
            Gerenciar produtos completos →
          </Link>
        </div>
      </SectionCard>

      {/* ── 7. Automações Determinísticas ─────────────────────────────────────── */}
      <SectionCard id="automacoes" icon="⚡" title="Automações Determinísticas" subtitle="Respostas fixas disparadas antes da IA — por palavra-chave ou status de pedido">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {automations.length} automação{automations.length !== 1 ? "ões" : ""} · {activeAutomations} ativa{activeAutomations !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => {
                setEditingAuto(null);
                setAutoForm({ name: "", triggerType: "keyword", triggerValue: "", matchType: "exact", responseType: "text", responseText: "" });
                setAutoModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-xl font-semibold text-sm hover:bg-[#4338ca] transition-all"
            >
              <PlusIcon className="w-4 h-4" /> Nova Automação
            </button>
          </div>

          {automations.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-2xl block mb-2">⚡</span>
              Nenhuma automação configurada ainda.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
              {automations.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/50 transition-colors">
                  <Toggle value={a.active} onChange={() => toggleAutoActive(a)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {a.triggerType === "order_status"
                        ? `Pedido: ${a.triggerValue}`
                        : `"${a.triggerValue}" (${a.matchType === "exact" ? "exata" : "contém"})`}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 truncate max-w-[140px] hidden sm:block">{a.response}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingAuto(a);
                        setAutoForm({ name: a.name, triggerType: a.triggerType, triggerValue: a.triggerValue, matchType: a.matchType, responseType: a.responseType, responseText: a.response });
                        setAutoModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleAutoDelete(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── 8. Handoff Humano ─────────────────────────────────────────────────── */}
      <SectionCard id="handoff" icon="🔔" title="Handoff Humano" subtitle="Quando e como transferir o atendimento para um operador humano">
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="font-medium text-gray-900 text-sm">Ativar escalação humana</p>
              <p className="text-xs text-gray-500">Permite transferir conversas para atendentes</p>
            </div>
            <Toggle value={handoff.enabled} onChange={(v) => setHandoff((p) => ({ ...p, enabled: v }))} />
          </div>

          {handoff.enabled && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  WhatsApp do atendente <span className="text-gray-400 font-normal">(formato internacional)</span>
                </label>
                <input
                  type="text"
                  placeholder="5511999990000"
                  value={handoff.alertPhone}
                  onChange={(e) => setHandoff((p) => ({ ...p, alertPhone: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mensagem para o cliente (ao transferir)</label>
                <textarea
                  rows={2}
                  value={handoff.clientMessage}
                  onChange={(e) => setHandoff((p) => ({ ...p, clientMessage: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Gatilhos de escalação</p>
                <div className="space-y-3">
                  {([
                    { key: "triggerOnExplicitRequest", label: "Pedido explícito do cliente" },
                    { key: "triggerOnLowConfidence",   label: "IA sem resposta segura" },
                    { key: "triggerOnRepetition",      label: "Intenção repetida sem resolução" },
                    { key: "triggerOnCheckoutError",   label: "Erro ao gerar checkout" },
                    { key: "triggerOnNoProduct",       label: "Nenhum produto encontrado" },
                  ] as { key: keyof HandoffConfig; label: string }[]).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">{label}</p>
                      <Toggle value={handoff[key] as boolean} onChange={(v) => setHandoff((p) => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cooldown entre alertas (min)</label>
                  <input
                    type="number" min={1} max={1440}
                    value={handoff.cooldownMinutes}
                    onChange={(e) => setHandoff((p) => ({ ...p, cooldownMinutes: parseInt(e.target.value) || 60 }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Máx. alertas por conversa</label>
                  <input
                    type="number" min={1} max={20}
                    value={handoff.maxAlertsPerConversation}
                    onChange={(e) => setHandoff((p) => ({ ...p, maxAlertsPerConversation: parseInt(e.target.value) || 3 }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">Pausar IA automaticamente ao escalar</p>
                <Toggle value={handoff.autoSetHuman} onChange={(v) => setHandoff((p) => ({ ...p, autoSetHuman: v }))} />
              </div>
            </>
          )}
          <SaveBtn saving={saving.handoff} saved={saved.handoff} onClick={() => putSection("handoff", { handoff })} />
        </div>
      </SectionCard>

      {/* ── 9. Ordem de Execução ──────────────────────────────────────────────── */}
      <SectionCard id="runtime" icon="🔄" title="Ordem de Execução" subtitle="Sequência exata de camadas que o sistema percorre para cada mensagem recebida">
        <div className="space-y-2">
          {[
            {
              n: 1,
              label: "Mensagem de Boas-Vindas",
              active: !!welcome.message,
              desc: welcome.message
                ? `Configurada — primeiro contato e após ${sessionConfig.timeoutHours}h de inatividade`
                : "Não configurada",
              simulatable: true,
            },
            {
              n: 2,
              label: "Pedido Explícito de Atendente",
              active: handoff.enabled,
              desc: handoff.enabled ? "Ativo — verificado antes de qualquer automação" : "Handoff desativado",
              simulatable: true,
            },
            {
              n: 3,
              label: "Estado de Agendamento Pendente",
              active: schedulingMeta.enabled,
              desc: schedulingMeta.enabled
                ? "Ativo — cliente já em fluxo de agendamento tem prioridade sobre automações"
                : "Sem serviços ativos",
              simulatable: false,
            },
            {
              n: 4,
              label: "Automações Determinísticas",
              active: activeAutomations > 0,
              desc: `${activeAutomations} ativa${activeAutomations !== 1 ? "s" : ""} — palavra-chave ou regex exata`,
              simulatable: true,
            },
            {
              n: 5,
              label: "Fluxo de Agendamento (nova intenção)",
              active: schedulingMeta.enabled,
              desc: schedulingMeta.enabled
                ? schedulingMeta.mode === "com_profissionais" ? "Com profissionais" : "Disponibilidade global"
                : "Sem serviços ativos",
              simulatable: true,
            },
            {
              n: 6,
              label: "Orquestrador Comercial",
              active: activeProducts > 0,
              desc: `${activeProducts} produto${activeProducts !== 1 ? "s" : ""} ativo${activeProducts !== 1 ? "s" : ""}`,
              simulatable: true,
            },
            {
              n: 7,
              label: "Resposta da IA (Fallback)",
              active: !!aiIdentity.aiPrompt,
              desc: aiIdentity.aiPrompt
                ? "Prompt configurado — IA responde. Baixa confiança pode acionar handoff como efeito colateral."
                : "Sem prompt — resposta genérica",
              simulatable: true,
            },
          ].map(({ n, label, active, desc, simulatable }) => (
            <div key={n} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${active ? "bg-[#4f46e5] text-white" : "bg-gray-200 text-gray-500"}`}>
                {n}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!simulatable && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">estado vivo</span>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                  {active ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          A camada de handoff humano não é uma etapa terminal — ela opera como efeito colateral: por pedido explícito (camada 2), por baixa confiança da IA (após camada 7), ou por condições configuradas. Use a simulação abaixo para testar o roteamento.
        </p>
      </SectionCard>

      {/* ── 10. Simulação ─────────────────────────────────────────────────────── */}
      <SectionCard id="simulacao" icon="🧪" title="Simulação" subtitle="Teste qual camada responderia a uma mensagem específica">
        <form onSubmit={runSimulation} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mensagem de teste</label>
            <input
              type="text"
              value={simMsg}
              onChange={(e) => setSimMsg(e.target.value)}
              placeholder="Ex: quero comprar, agendar consulta, qual o preço..."
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={simFirstContact}
              onChange={(e) => setSimFirstContact(e.target.checked)}
              className="w-4 h-4 rounded text-[#4f46e5]"
            />
            <span className="text-sm text-gray-700">Simular primeiro contato (verifica boas-vindas)</span>
          </label>
          <button
            type="submit"
            disabled={simLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
          >
            {simLoading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Simulando...</>
              : "Simular →"}
          </button>

          {simResult && !simResult.error && (
            <div className="mt-2 space-y-3">
              <div className={`p-4 rounded-xl border ${
                simResult.resolvedLayer === "ai_fallback"  ? "bg-indigo-50 border-indigo-200"  :
                simResult.resolvedLayer === "automation"   ? "bg-amber-50 border-amber-200"    :
                simResult.resolvedLayer === "commercial"   ? "bg-violet-50 border-violet-200"  :
                simResult.resolvedLayer === "scheduling"   ? "bg-emerald-50 border-emerald-200":
                simResult.resolvedLayer === "handoff"      ? "bg-red-50 border-red-200"        :
                "bg-blue-50 border-blue-200"
              }`}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Camada respondente</p>
                <p className="text-sm font-bold text-gray-900">
                  {simResult.resolvedLayer?.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{simResult.reason}</p>
                {simResult.message && (
                  <div className="mt-3 p-3 bg-white/60 rounded-lg border border-white/80">
                    <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wide">Resposta</p>
                    <p className="text-sm text-gray-700">{simResult.message}</p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                {(simResult.layerTrace as any[])?.map((l, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${l.matched ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500"}`}>
                    <span className="shrink-0 font-bold">{l.matched ? "✓" : "○"}</span>
                    <span className="font-medium shrink-0">{l.label}</span>
                    <span className="text-[11px] opacity-70 truncate">— {l.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {simResult?.error && <p className="text-sm text-red-600 mt-2">{simResult.error}</p>}
        </form>
      </SectionCard>

      {/* ── Automation Modal ──────────────────────────────────────────────────── */}
      {autoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editingAuto ? "Editar Automação" : "Nova Automação"}</h3>
              <button onClick={() => setAutoModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAutoSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Nome da Regra</label>
                <input required type="text" placeholder="Ex: Tabela de Preços" value={autoForm.name}
                  onChange={(e) => setAutoForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Tipo de Gatilho</label>
                <select
                  value={autoForm.triggerType}
                  onChange={(e) => setAutoForm((p) => ({ ...p, triggerType: e.target.value, triggerValue: "", matchType: e.target.value === "order_status" ? "exact" : p.matchType }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none"
                >
                  <option value="keyword">Palavra-chave (mensagem)</option>
                  <option value="order_status">Status de pedido</option>
                </select>
              </div>
              {autoForm.triggerType === "order_status" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">Quando o pedido mudar para</label>
                  <select required value={autoForm.triggerValue} onChange={(e) => setAutoForm((p) => ({ ...p, triggerValue: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none">
                    <option value="">Selecione o status...</option>
                    {ORDER_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Gatilho (mensagem)</label>
                    <input required type="text" placeholder="Ex: preço" value={autoForm.triggerValue}
                      onChange={(e) => setAutoForm((p) => ({ ...p, triggerValue: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Correspondência</label>
                    <select value={autoForm.matchType} onChange={(e) => setAutoForm((p) => ({ ...p, matchType: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none appearance-none">
                      <option value="exact">Exata</option>
                      <option value="contains">Contém</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Resposta</label>
                <textarea required rows={3} placeholder="Mensagem enviada quando o gatilho disparar"
                  value={autoForm.responseText} onChange={(e) => setAutoForm((p) => ({ ...p, responseText: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none transition-all" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAutoModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={autoSaving}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#4f46e5] rounded-xl hover:bg-[#4338ca] disabled:opacity-60 transition-all">
                  {autoSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {autoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
          {autoToast}
        </div>
      )}
    </div>
  );
}
