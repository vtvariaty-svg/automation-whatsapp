"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

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
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card>
        <CardHeader className="mb-6">
          <CardTitle className="text-2xl">Configuração da IA</CardTitle>
        </CardHeader>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tenant ID</label>
          <div className="flex gap-3">
            <Input 
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Cole o ID do seu tenant para carregar"
            />
            <Button 
              variant="secondary"
              onClick={loadSettings}
              type="button"
            >
              Carregar
            </Button>
          </div>
        </div>

        <form onSubmit={saveSettings} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Prompt</label>
            <Textarea 
              rows={4}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Instruções para a inteligência artificial..."
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Horário de atendimento</label>
            <Textarea 
              rows={3}
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="Defina os dias e horários..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className={`text-sm font-medium ${message.includes("Erro") || message.includes("não encontrado") ? "text-red-500" : "text-green-500"}`}>
              {message}
            </p>
            <Button 
              type="submit"
              disabled={loading || !tenantId}
            >
              {loading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
