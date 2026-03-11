"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AISettingsPage() {
  const { user } = useAuth();
  const [aiPrompt, setAiPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant/settings?tenantId=${user.tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setAiPrompt(data.ai_prompt || "");
        setWelcomeMessage(data.welcome_message || "");
        setBusinessHours(data.business_hours || "");
      }
    } catch {
      setMessage("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tenantId) loadSettings();
  }, [user?.tenantId]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/tenant/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: user.tenantId,
          ai_prompt: aiPrompt,
          welcome_message: welcomeMessage,
          business_hours: businessHours,
        }),
      });
      setMessage(res.ok ? "✅ Configuração salva com sucesso!" : "❌ Erro ao salvar.");
    } catch {
      setMessage("❌ Erro ao salvar.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuração da IA</h1>
        <p className="text-sm text-gray-500 mt-1">Personalize o comportamento da secretária inteligente</p>
      </div>

      {/* Success/Error toast */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.includes("✅")
            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
            : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        {/* AI Prompt */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] rounded-xl flex items-center justify-center text-white text-lg">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Prompt Base da IA</h3>
                <p className="text-xs text-gray-500">Define a personalidade e conhecimento da IA</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              rows={6}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Você é Maria, assistente virtual da loja Boutique Fashion. Seja educada, simpática e ajude os clientes com informações sobre produtos, preços e disponibilidade. Quando não souber algo, ofereça conectar com um atendente humano."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-2">💡 Dica: Quanto mais detalhado o prompt, melhor será o atendimento da IA.</p>
          </div>
        </div>

        {/* Welcome message */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg">
                👋
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Mensagem de Boas-Vindas</h3>
                <p className="text-xs text-gray-500">Enviada automaticamente na primeira interação</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              rows={4}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Ex: Olá! 👋 Sou a secretária virtual da Boutique Fashion. Posso te ajudar com informações sobre nossos produtos, preços e horários. Como posso te ajudar?"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
            {/* Preview */}
            {welcomeMessage && (
              <div className="mt-4 p-4 bg-gradient-to-r from-[#4f46e5] to-[#5b51e0] rounded-xl text-white text-sm leading-relaxed">
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-1">Prévia da mensagem</p>
                {welcomeMessage}
              </div>
            )}
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                🕐
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Horários e Regras</h3>
                <p className="text-xs text-gray-500">Informações que a IA usará para responder clientes</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <textarea
              rows={4}
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="Ex: Funcionamos de segunda a sexta das 08:00 às 18:00 e sábados das 09:00 às 13:00. Endereço: Rua das Flores, 123 - Centro. Formas de pagamento: PIX, Cartão e Boleto."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 transition-all placeholder:text-gray-400 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !user?.tenantId}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
