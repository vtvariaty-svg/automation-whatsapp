"use client";

import { useState } from "react";

export default function ConversasPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchHistory() {
    if (!phoneNumber) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/conversations/${phoneNumber}`);
      const data = await resp.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Histórico de Conversas</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Digite o número (ex: 55...)"
            className="flex-1 border border-gray-300 rounded-md px-4 py-2"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button
            onClick={fetchHistory}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[400px]">
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-blue-50 ml-auto border border-blue-100"
                    : "bg-gray-50 mr-auto border border-gray-100"
                }`}
              >
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {msg.sender === "user" ? "Cliente" : "IA"} - {new Date(msg.timestamp).toLocaleString()}
                </p>
                <p className="text-gray-800">{msg.message_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            Nenhuma conversa encontrada ou número não pesquisado.
          </div>
        )}
      </div>
    </div>
  );
}
