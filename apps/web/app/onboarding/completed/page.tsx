"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PlanInfo {
  plan: string | null;
  status: string | null;
  trialEnd: string | null;
}

export default function OnboardingCompleted() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [planInfo, setPlanInfo] = useState<PlanInfo>({ plan: null, status: null, trialEnd: null });

  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    // Load plan info to show appropriate CTA
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    fetch("/api/billing/subscription", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setPlanInfo({ plan: d.plan, status: d.status, trialEnd: d.trialEnd }))
      .catch(() => {});
  }, []);

  return (
    <div className={`transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12 text-center">
          {/* Celebration */}
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto text-5xl shadow-lg shadow-emerald-200 mb-6">
            🎉
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Tudo pronto!
          </h1>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            Sua plataforma está configurada e pronta para funcionar. A IA já pode começar a atender seus clientes automaticamente.
          </p>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-2xl mb-1">🏢</div>
              <p className="text-xs font-semibold text-emerald-700">Empresa</p>
              <p className="text-[10px] text-emerald-500">Configurada</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-2xl mb-1">🤖</div>
              <p className="text-xs font-semibold text-emerald-700">IA</p>
              <p className="text-[10px] text-emerald-500">Ativa</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="text-2xl mb-1">📱</div>
              <p className="text-xs font-semibold text-emerald-700">WhatsApp</p>
              <p className="text-[10px] text-emerald-500">Pronto</p>
            </div>
          </div>

          {/* Plan badge */}
          {planInfo.plan && (
            <div className="flex justify-center mb-6">
              {planInfo.status === 'trialing' && planInfo.trialEnd ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-indigo-600 font-bold text-sm">Standard — Teste grátis</span>
                  <span className="text-indigo-400 text-xs">
                    até {new Date(planInfo.trialEnd).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ) : planInfo.plan === 'free' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="text-gray-600 font-bold text-sm">Plano Free</span>
                  <Link href="/dashboard/billing" className="text-indigo-500 text-xs font-medium hover:underline">
                    Fazer upgrade →
                  </Link>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-700 font-bold text-sm capitalize">Plano {planInfo.plan}</span>
                  <span className="text-emerald-500 text-xs">ativo</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base hover:shadow-xl hover:shadow-indigo-200/50 transition-all"
            >
              Ir para o Dashboard 🚀
            </Link>
            <Link
              href="/dashboard/setup"
              className="inline-flex items-center gap-2 px-6 py-4 border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition-all"
            >
              Ver checklist de setup →
            </Link>
          </div>

          {planInfo.status === 'trialing' && (
            <p className="text-xs text-indigo-500 mt-4 font-medium">
              Seu teste grátis está ativo. Acesse <Link href="/dashboard/billing" className="underline">Assinatura</Link> para continuar após o trial.
            </p>
          )}

          <p className="text-xs text-gray-400 mt-4">
            Você pode ajustar qualquer configuração a qualquer momento no painel.
          </p>
        </div>
      </div>
    </div>
  );
}
