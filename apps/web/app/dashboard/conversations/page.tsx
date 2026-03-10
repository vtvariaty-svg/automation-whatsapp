"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("ai");
  const [replyText, setReplyText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    if (tenantId) {
      loadConversations();
      const interval = setInterval(loadConversations, 10000); // Atualiza a lista a cada 10s
      return () => clearInterval(interval);
    }
  }, [tenantId]);

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
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">

      {/* Main Inbox UI */}
      <div className="flex flex-1 overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm mt-4">
        {/* Sidebar */}
        <div className="w-1/3 max-w-sm bg-gray-50/50 border-r border-gray-100 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <h2 className="font-semibold text-gray-900 text-lg">Conversas</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-1">
            {loadingList && conversations.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">Carregando...</p>
            ) : conversations.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">Nenhuma conversa encontrada.</p>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.phone_number} 
                  onClick={() => loadMessages(conv.phone_number, conv.status)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedPhone === conv.phone_number ? 'border-primary/30 bg-[#4f46e5]/5 shadow-sm' : 'border-transparent hover:bg-white hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <span className="font-semibold text-gray-900 truncate">{conv.phone_number}</span>
                    <Badge variant={conv.status === 'human' ? 'warning' : 'success'} className="shrink-0 text-[10px] px-2 py-0.5">
                      {conv.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message || 'Sem texto.'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white flex flex-col relative overflow-hidden">
          {selectedPhone ? (
            <>
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0 z-10 sticky top-0">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedPhone}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatus === 'human' ? 'bg-orange-400' : 'bg-green-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatus === 'human' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                    </span>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">
                      ATENDIMENTO {currentStatus === 'human' ? 'HUMANO' : 'IA'}
                    </p>
                  </div>
                </div>
                {currentStatus !== 'human' && (
                  <Button 
                    variant="warning"
                    onClick={handleTakeover}
                    className="shadow-sm"
                  >
                    Assumir Atendimento
                  </Button>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col bg-slate-50/50">
                {loadingChat && messages.length === 0 ? (
                  <p className="text-gray-500 text-center text-sm m-auto">Carregando histórico...</p>
                ) : (
                  messages.map(msg => {
                    const isUser = msg.sender === 'user';
                    const isSystemAI = msg.sender === 'ai';
                    const text = msg.message_text || msg.ai_response || '';
                    
                    return (
                      <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                        <div 
                          className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                            isUser 
                              ? 'bg-white border border-gray-100 rounded-tl-sm' 
                              : isSystemAI 
                                ? 'bg-indigo-600 text-white rounded-tr-sm'
                                : 'bg-gray-800 text-white rounded-tr-sm'
                          }`}
                        >
                          <p className={`text-xs mb-1.5 tracking-wide ${isUser ? 'text-gray-400 font-medium' : 'text-indigo-200 font-medium'}`}>
                            {isUser ? 'CLIENTE' : msg.sender.toUpperCase()}
                          </p>
                          <p className={`text-[15px] leading-relaxed ${isUser ? 'text-gray-800' : 'text-white'}`}>
                            {text}
                          </p>
                          <span className={`text-[10px] block mt-2 text-right ${isUser ? 'text-gray-400' : 'text-indigo-200/80'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              {currentStatus === 'human' ? (
                <form onSubmit={handleSendMessage} className="bg-white p-4 sm:p-5 border-t border-gray-100 flex gap-3 shrink-0">
                  <Input 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Digite sua mensagem para o cliente..."
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={sending || !replyText.trim()}
                    className="px-8"
                  >
                    {sending ? 'Enviando...' : 'Enviar'}
                  </Button>
                </form>
              ) : (
                <div className="bg-slate-50 p-6 border-t border-gray-100 text-center shrink-0">
                  <p className="text-sm text-gray-500">
                    A inteligência artificial está atendendo este cliente. Clique em <strong className="text-gray-700">Assumir atendimento</strong> para enviar mensagens manualmente.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-sm">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Caixa de Entrada</h3>
              <p className="text-sm text-gray-500 max-w-sm">Selecione uma conversa ao lado para visualizar o histórico ou iniciar o atendimento manual.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
