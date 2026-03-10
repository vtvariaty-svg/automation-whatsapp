"use client";

import { useState, useEffect } from "react";

type Conversation = {
  id: string;
  phone_number: string;
  last_message: string;
  status: string;
  timestamp: string;
};

type Message = {
  id: string;
  sender: 'user' | 'ai' | 'human';
  message_text?: string;
  ai_response?: string;
  timestamp: string;
};

export default function InboxPage() {
  const [tenantId, setTenantId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("ai");
  const [replyText, setReplyText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  // Load conversations
  const loadConversations = async () => {
    if (!tenantId) return;
    setLoadingList(true);
    try {
      const res = await fetch(`/api/conversations?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // Carrega contatos se já tiver tenantId ou atualizar (polling básico opcional)
  useEffect(() => {
    if (tenantId) {
      loadConversations();
      const interval = setInterval(loadConversations, 10000); // Atualiza a lista a cada 10s
      return () => clearInterval(interval);
    }
  }, [tenantId]);

  // Load selected chat
  const loadMessages = async (phone: string, status: string) => {
    setSelectedPhone(phone);
    setCurrentStatus(status);
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/conversations/${phone}/messages?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (tenantId && selectedPhone) {
      const interval = setInterval(() => loadMessages(selectedPhone, currentStatus), 5000); // Poll msgs a cada 5s
      return () => clearInterval(interval);
    }
  }, [tenantId, selectedPhone, currentStatus]);

  const handleTakeover = async () => {
    if (!selectedPhone || !tenantId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedPhone}/takeover?tenantId=${tenantId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setCurrentStatus('human');
        loadConversations();
      }
    } catch (err) {
      console.error("Takeover error:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPhone || !tenantId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedPhone}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, message: replyText })
      });
      if (res.ok) {
        setReplyText("");
        loadMessages(selectedPhone, currentStatus);
      }
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header Tenant Setup */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center gap-4 shrink-0">
        <label className="font-medium text-gray-700">Seu Tenant ID:</label>
        <input 
          type="text" 
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          placeholder="Cole seu Tenant UUID"
          className="border border-gray-300 rounded-md px-3 py-1.5 w-80 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button 
          onClick={loadConversations}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Carregar Inbox
        </button>
      </div>

      {/* Main Inbox UI */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/3 max-w-sm bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">Conversas</div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loadingList && conversations.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">Carregando...</p>
            ) : conversations.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">Nenhuma conversa encontrada.</p>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.phone_number} 
                  onClick={() => loadMessages(conv.phone_number, conv.status)}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition ${selectedPhone === conv.phone_number ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-800">{conv.phone_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${conv.status === 'human' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {conv.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message || 'Sem texto.'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-gray-50 flex flex-col">
          {selectedPhone ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-gray-800">{selectedPhone}</h3>
                  <p className="text-sm text-gray-500">Status atual: <span className="font-medium">{currentStatus}</span></p>
                </div>
                {currentStatus !== 'human' && (
                  <button 
                    onClick={handleTakeover}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-md transition drop-shadow-sm"
                  >
                    Assumir atendimento (Pausar IA)
                  </button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                {loadingChat && messages.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm">Carregando histórico...</p>
                ) : (
                  messages.map(msg => {
                    const isUser = msg.sender === 'user';
                    const text = msg.message_text || msg.ai_response || '';
                    return (
                      <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${isUser ? 'bg-white border border-gray-200' : 'bg-blue-600 text-white'}`}>
                          <p className={`text-sm mb-1 ${isUser ? 'text-blue-600 font-semibold' : 'text-blue-100 font-semibold'}`}>{isUser ? 'Cliente' : msg.sender.toUpperCase()}</p>
                          <p className={isUser ? 'text-gray-800' : 'text-white'}>{text}</p>
                          <span className={`text-[10px] block mt-2 text-right opacity-70`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              {currentStatus === 'human' ? (
                <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-gray-200 flex gap-4 shrink-0">
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="submit" 
                    disabled={sending || !replyText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-md transition"
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              ) : (
                <div className="bg-white p-4 border-t border-gray-200 text-center shrink-0">
                  <p className="text-sm text-gray-500">A inteligência artificial está atendendo este cliente. Clique em &quot;Assumir atendimento&quot; para enviar mensagens manualmente.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500 text-lg">Selecione uma conversa para iniciar o atendimento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
