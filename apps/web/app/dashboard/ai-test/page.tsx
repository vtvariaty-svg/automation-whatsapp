'use client';

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { authApi } from "@/lib/api/client";

export default function AITestPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const data = await authApi.testAI(message);
      setResponse(data);
    } catch (error) {
      alert("Erro ao testar IA. Verifique sua chave da OpenAI no backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Teste do Motor de IA</CardTitle>
          <CardDescription>
            Envie uma mensagem para simular o atendimento de um cliente e veja como a IA responde com base nos dados da sua empresa.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem do Cliente</label>
            <Textarea
              rows={3}
              placeholder="Ex: Qual o horário de funcionamento? / Quais produtos vocês vendem?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processando..." : "Enviar Mensagem"}
          </Button>
        </form>
      </Card>

      {response && (
        <Card className="space-y-6">
          <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Resposta da IA</h3>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{response.response}</p>
          </div>

          <div className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Intenção Classificada</h3>
            <Badge variant="default" className="text-sm px-3 py-1">
              {response.intent}
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
