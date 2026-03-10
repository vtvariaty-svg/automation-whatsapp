"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export default function AISettingsPage() {
  const { user } = useAuth();
  const [aiPrompt, setAiPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    if (!user?.tenantId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/tenant/settings?tenantId=${user.tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setAiPrompt(data.ai_prompt || "");
        setWelcomeMessage(data.welcome_message || "");
        setBusinessHours(data.business_hours || "");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tenantId) {
      loadSettings();
    }
  }, [user?.tenantId]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.tenantId) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/tenant/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: user.tenantId,
          ai_prompt: aiPrompt,
          welcome_message: welcomeMessage,
          business_hours: businessHours
        })
      });

      if (res.ok) {
        setMessage("Configuração salva com sucesso.");
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
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader className="mb-6">
          <CardTitle className="text-2xl">Configuração da IA</CardTitle>
        </CardHeader>

        <form onSubmit={saveSettings} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Prompt Base</label>
            <Textarea 
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Você é um assistente da loja X..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem de boas-vindas</label>
            <Textarea 
              rows={3}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Mensagem inicial enviada ao cliente..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horários e Regras da Loja</label>
            <Textarea 
              rows={3}
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="Defina os dias de funcionamento, endereço, etc."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
             <p className={`text-sm font-medium ${message.includes("Erro") ? "text-red-500" : "text-green-500"}`}>
               {message}
             </p>
             <Button 
               type="submit"
               disabled={loading || !user?.tenantId}
             >
               {loading ? "Salvando..." : "Salvar Configurações"}
             </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
