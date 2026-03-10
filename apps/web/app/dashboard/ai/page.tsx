"use client";

import { useState } from "react";

export default function AISettingsPage() {
  const [tenantId, setTenantId] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    if (!tenantId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/tenant/settings?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setAiPrompt(data.ai_prompt || "");
        setWelcomeMessage(data.welcome_message || "");
        setBusinessHours(data.business_hours || "");
      } else {
        setMessage("Tenant não encontrado.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/tenant/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          ai_prompt: aiPrompt,
          welcome_message: welcomeMessage,
          business_hours: businessHours
        })
      });

      if (res.ok) {
        setMessage("Configuração salva.");
      } else {
        setMessage("Erro ao salvar.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuração da IA</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenant ID</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Cole o ID do seu tenant para carregar"
            />
            <button 
              onClick={loadSettings}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md transition font-medium"
              type="button"
            >
              Carregar
            </button>
          </div>
        </div>

        <form onSubmit={saveSettings} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Prompt</label>
            <textarea 
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Instruções para a inteligência artificial..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de boas-vindas</label>
            <textarea 
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Mensagem inicial enviada ao cliente..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de atendimento</label>
            <textarea 
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="Defina os dias e horários..."
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className={`text-sm font-medium ${message.includes("Erro") || message.includes("não encontrado") ? "text-red-500" : "text-green-500"}`}>
              {message}
            </p>
            <button 
              type="submit"
              disabled={loading || !tenantId}
              className="bg-blue-600 text-white font-medium px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
