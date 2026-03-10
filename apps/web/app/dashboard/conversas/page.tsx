"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ConversasPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchHistory() {
    if (!phoneNumber || !tenantId) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/conversations/${phoneNumber}?tenantId=${tenantId}`);
      const data = await resp.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Histórico de Conversas</h2>
        <p className="text-sm text-gray-500 mt-1">Pesquise conversas por número de telefone.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Tenant ID (UUID)"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="sm:w-1/3"
          />
          <Input
            placeholder="Número (ex: 5511...)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={fetchHistory}
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </Card>

      <Card className="p-6 min-h-[400px]">
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((msg: any, i: number) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                      isUser
                        ? "bg-white border border-gray-100 rounded-tl-sm"
                        : "bg-indigo-600 text-white rounded-tr-sm"
                    }`}
                  >
                    <p className={`text-xs mb-1.5 tracking-wide font-medium ${isUser ? 'text-gray-400' : 'text-indigo-200'}`}>
                      {isUser ? "CLIENTE" : "IA"} — {new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </p>
                    <p className={`text-[15px] leading-relaxed ${isUser ? 'text-gray-800' : 'text-white'}`}>{msg.message_text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-sm text-gray-500">Nenhuma conversa encontrada. Insira um Tenant ID e número de telefone para buscar.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
