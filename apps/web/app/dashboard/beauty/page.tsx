"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEntitlements } from "@/hooks/useEntitlements";
import UpgradeGate from "@/components/UpgradeGate";

interface WorkspaceConfig {
  status: string;
  businessSubtype?: string;
  depositRequired?: boolean;
  defaultDepositPercent?: number;
  reengagementDays?: number;
  confirmationLeadHours?: number;
}

const SUBTYPE_LABELS: Record<string, string> = {
  salon: "Salão",
  barbershop: "Barbearia",
  aesthetics: "Estética",
  nail: "Manicure / Nail",
  lash: "Lash / Sobrancelha",
  massage: "Massagem",
  other: "Outro",
};

const QUICK_LINKS = [
  {
    href: "/dashboard/beauty/clientes",
    icon: "👤",
    label: "Clientes",
    description: "Perfis, histórico e fidelidade",
    color: "from-violet-50 to-purple-50 border-violet-100",
    iconBg: "bg-violet-100",
  },
  {
    href: "/dashboard/beauty/pacotes",
    icon: "🎁",
    label: "Pacotes",
    description: "Pacotes de sessões e resgates",
    color: "from-blue-50 to-indigo-50 border-blue-100",
    iconBg: "bg-blue-100",
  },
  {
    href: "/dashboard/beauty/campanhas",
    icon: "📣",
    label: "Campanhas",
    description: "Reengajamento e retenção automáticos",
    color: "from-pink-50 to-rose-50 border-pink-100",
    iconBg: "bg-pink-100",
  },
  {
    href: "/dashboard/appointments",
    icon: "📅",
    label: "Agenda",
    description: "Agendamentos e confirmações",
    color: "from-green-50 to-emerald-50 border-green-100",
    iconBg: "bg-green-100",
  },
];

export default function BeautyWorkspacePage() {
  const ent = useEntitlements();
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [form, setForm] = useState({ businessSubtype: "salon", reengagementDays: 30 });

  useEffect(() => {
    fetch("/api/beauty/workspace")
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (ent.loading) return null;

  if (!ent.features.beautyWorkspace) {
    return (
      <UpgradeGate
        icon="💅"
        title="Beauty Workspace"
        message="Workspace completo para salão, barbearia, estética e manicure. Disponível a partir do plano Pro."
        ctaPlan="Pro"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = config?.status === "active";

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await fetch("/api/beauty/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setConfig(data);
      setSetupMode(false);
    } finally {
      setActivating(false);
    }
  };

  if (!isActive || setupMode) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center border border-violet-200/50">
            <span className="text-4xl">💅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Beauty Workspace</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Configure o workspace especializado para seu negócio de beleza. Em segundos.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Tipo de negócio
            </label>
            <select
              value={form.businessSubtype}
              onChange={(e) => setForm((f) => ({ ...f, businessSubtype: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              {Object.entries(SUBTYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Reengajar clientes inativos após (dias)
            </label>
            <input
              type="number"
              min={7}
              max={180}
              value={form.reengagementDays}
              onChange={(e) => setForm((f) => ({ ...f, reengagementDays: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-200/50 transition-all disabled:opacity-50"
          >
            {activating ? "Ativando..." : "Ativar Beauty Workspace"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 flex items-center justify-center border border-violet-200/50">
            <span className="text-2xl">💅</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Beauty Workspace</h1>
            <p className="text-sm text-gray-500">
              {SUBTYPE_LABELS[config?.businessSubtype ?? ""] ?? "Negócio de beleza"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSetupMode(true)}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
        >
          Configurações
        </button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-2xl border bg-gradient-to-br ${link.color} p-5 hover:shadow-md transition-all group`}
          >
            <div className={`w-10 h-10 rounded-xl ${link.iconBg} flex items-center justify-center mb-3`}>
              <span className="text-xl">{link.icon}</span>
            </div>
            <div className="font-semibold text-gray-900 text-sm group-hover:text-violet-700 transition-colors">
              {link.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 leading-tight">{link.description}</div>
          </Link>
        ))}
      </div>

      {/* Config summary */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Configuração ativa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400 block text-xs mb-1">Tipo</span>
            <span className="font-medium text-gray-800">
              {SUBTYPE_LABELS[config?.businessSubtype ?? ""] ?? "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs mb-1">Reengajamento</span>
            <span className="font-medium text-gray-800">
              {config?.reengagementDays ?? 30} dias
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs mb-1">Depósito</span>
            <span className="font-medium text-gray-800">
              {config?.depositRequired ? `${config.defaultDepositPercent ?? 0}%` : "Desativado"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs mb-1">Confirmação</span>
            <span className="font-medium text-gray-800">
              {config?.confirmationLeadHours ?? 24}h antes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
