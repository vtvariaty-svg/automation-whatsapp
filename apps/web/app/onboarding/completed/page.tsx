"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OnboardingCompleted() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setShow(true), 100);
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

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base hover:shadow-xl hover:shadow-indigo-200/50 transition-all"
          >
            Ir para o Dashboard 🚀
          </Link>

          <p className="text-xs text-gray-400 mt-6">
            Você pode ajustar qualquer configuração a qualquer momento no painel.
          </p>
        </div>
      </div>
    </div>
  );
}
