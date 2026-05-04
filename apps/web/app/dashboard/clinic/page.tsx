"use client";

import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import ClinicProfile from "./components/ClinicProfile";
import ClinicServices from "./components/ClinicServices";
import ClinicProfessionals from "./components/ClinicProfessionals";
import ClinicAvailability from "./components/ClinicAvailability";
import ClinicAppointments from "./components/ClinicAppointments";

type Tab = "perfil" | "servicos" | "profissionais" | "disponibilidade" | "agendamentos";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "perfil", label: "Perfil & Página", icon: "🏥" },
  { id: "servicos", label: "Serviços", icon: "📋" },
  { id: "profissionais", label: "Profissionais", icon: "👤" },
  { id: "disponibilidade", label: "Disponibilidade", icon: "🗓️" },
  { id: "agendamentos", label: "Solicitações", icon: "📬" },
];

export default function ClinicDashboardPage() {
  const { isSuperAdmin } = useAuth();
  const ent = useEntitlements();
  const [tab, setTab] = useState<Tab>("perfil");

  // Show spinner while plan is loading
  if (ent.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Plan guard: only consultorio or superadmin
  const hasAccess = isSuperAdmin || ent.plan === "consultorio";
  if (!hasAccess) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center px-4">
        <p className="text-5xl mb-4">🏥</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Consultório não disponível</h1>
        <p className="text-sm text-gray-500 mb-6">
          Este espaço de trabalho é exclusivo do Plano Consultório.
          {ent.plan ? ` Você está no plano ${ent.plan}.` : ""}
        </p>
        <a
          href="/dashboard/billing"
          className="inline-flex items-center gap-2 bg-teal-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-teal-700 transition-colors"
        >
          Ver planos disponíveis
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏥 Consultório</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure os dados públicos da sua clínica. Essa base será usada na página pública de agendamento.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Uso administrativo:</strong> a IA e a página pública não realizam diagnóstico, prescrição ou interpretação de exames.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === "perfil" && <ClinicProfile />}
        {tab === "servicos" && <ClinicServices />}
        {tab === "profissionais" && <ClinicProfessionals />}
        {tab === "disponibilidade" && <ClinicAvailability />}
        {tab === "agendamentos" && <ClinicAppointments />}
      </div>
    </div>
  );
}
