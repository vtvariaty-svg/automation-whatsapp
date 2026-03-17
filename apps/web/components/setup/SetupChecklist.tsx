"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StepStatus = "completed" | "next" | "pending";

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  href: string;
  cta: string;
  priority: number;
}

interface ChecklistData {
  plan: string;
  trialEnd: string | null;
  isTrialing: boolean;
  progress: { completed: number; total: number; percent: number };
  steps: ChecklistStep[];
  analytics: {
    firstAutomationAt: string | null;
    firstConversationAt: string | null;
    totalActiveAutomations: number;
    totalConversations: number;
  };
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  pro: "Pro",
  business: "Business",
  starter: "Starter",
};

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "completed")
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  if (status === "next")
    return (
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0">
      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
    </div>
  );
}

export default function SetupChecklist() {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchChecklist = async () => {
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "";
    if (!token) return;
    try {
      setLoading(true);
      setError(false);
      const res = await fetch("/api/setup/checklist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-10 text-center">
        <p className="text-sm text-gray-500 mb-3">Erro ao carregar checklist</p>
        <button
          onClick={fetchChecklist}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const { progress, steps, plan, trialEnd, isTrialing, analytics } = data;
  const allDone = progress.completed === progress.total;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Plano {PLAN_LABELS[plan] ?? plan}
              </span>
              {isTrialing && trialEnd && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Trial até {new Date(trialEnd).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {allDone ? "Setup concluído!" : "Checklist de Ativação"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {allDone
                ? "Todos os passos foram concluídos. Sua plataforma está ativa."
                : `${progress.completed} de ${progress.total} etapas concluídas`}
            </p>
          </div>
          {/* Progress circle */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#f3f4f6" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26"
                fill="none"
                stroke={allDone ? "#10b981" : "#4f46e5"}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress.percent / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
              {progress.percent}%
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${allDone ? "bg-emerald-500" : "bg-indigo-600"}`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div
              key={step.id}
              className={`flex items-start gap-4 px-6 py-4 ${!isLast ? "border-b border-gray-100" : ""} ${
                step.status === "next" ? "bg-indigo-50/40" : ""
              }`}
            >
              {/* Connector line */}
              <div className="flex flex-col items-center pt-0.5">
                <StatusIcon status={step.status} />
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 mt-1.5 min-h-[20px] ${
                      step.status === "completed" ? "bg-emerald-200" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      step.status === "completed"
                        ? "text-gray-500 line-through decoration-gray-300"
                        : step.status === "next"
                        ? "text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    {step.title}
                    {step.status === "next" && (
                      <span className="ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider not-italic no-underline" style={{ textDecoration: 'none' }}>
                        Próximo
                      </span>
                    )}
                  </p>
                  {step.status !== "completed" && (
                    <Link
                      href={step.href}
                      className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                        step.status === "next"
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                      }`}
                    >
                      {step.cta}
                    </Link>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics card */}
      {(analytics.totalActiveAutomations > 0 || analytics.totalConversations > 0) && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Progresso da ativação</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xl font-extrabold text-gray-900">{analytics.totalActiveAutomations}</p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Automações ativas</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xl font-extrabold text-gray-900">{analytics.totalConversations}</p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Conversas totais</p>
            </div>
            {analytics.firstAutomationAt && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-bold text-gray-900">
                  {new Date(analytics.firstAutomationAt).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">1ª automação criada</p>
              </div>
            )}
            {analytics.firstConversationAt && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-bold text-gray-900">
                  {new Date(analytics.firstConversationAt).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">1ª conversa recebida</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* All done CTA */}
      {allDone && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/60 rounded-2xl p-6 text-center">
          <p className="text-lg font-extrabold text-emerald-800 mb-1">Setup completo!</p>
          <p className="text-sm text-emerald-700 mb-4">Sua plataforma está configurada e pronta para operar.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
          >
            Ir para o Dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}
