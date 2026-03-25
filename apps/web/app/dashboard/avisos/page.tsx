"use client";

import Link from "next/link";

export default function AvisosPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
      <div className="text-5xl">🔔</div>
      <h1 className="text-2xl font-bold text-gray-900">Avisos & Escalação Humana</h1>
      <p className="text-gray-500 text-sm leading-relaxed">
        As configurações de handoff e escalação humana foram unificadas na{" "}
        <strong>Central de Atendimento IA</strong>. Configure quando e como a IA deve
        transferir conversas para atendentes humanos em um único lugar.
      </p>
      <Link
        href="/dashboard/atendimento-ia#handoff"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
      >
        <span>Ir para Central de Atendimento IA</span>
        <span>→</span>
      </Link>
      <p className="text-xs text-gray-400">
        Seção: <code className="bg-gray-100 px-1 py-0.5 rounded">Handoff & Escalação</code>
      </p>
    </div>
  );
}
