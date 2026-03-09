'use client';

import { useState } from "react";
import Button from "@/components/Button";
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Teste do Motor de IA</h2>
        <p className="text-gray-600">
          Envie uma mensagem para simular o atendimento de um cliente e veja como a IA responde com base nos dados da sua empresa.
        </p>
      </div>

      <form onSubmit={handleSend} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem do Cliente</label>
          <textarea
            className="w-full px-3 py-2 border rounded-md"
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

      {response && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">Resposta da IA</h3>
            <p className="text-gray-800 whitespace-pre-wrap">{response.response}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Intenção Classificada</h3>
            <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium">
              {response.intent}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
