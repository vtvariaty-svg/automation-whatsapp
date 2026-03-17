"use client";

import SetupChecklist from "@/components/setup/SetupChecklist";

export default function SetupPage() {
  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Setup & Ativação</h1>
        <p className="text-sm text-gray-500 mt-1">
          Siga os passos abaixo para ativar sua plataforma e começar a atender clientes.
        </p>
      </div>
      <SetupChecklist />
    </div>
  );
}
