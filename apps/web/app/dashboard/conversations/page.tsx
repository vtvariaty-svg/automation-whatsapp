"use client";

import { useState, useEffect, useRef } from "react";
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
  sender: "user" | "ai" | "human";
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
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const interval = setInterval(loadConversations, 10000);
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
      const interval = setInterval(() => loadMessages(selectedPhone, currentStatus), 5000);
      return () => clearInterval(interval);
    }
  }, [tenantId, selectedPhone, currentStatus]);

  const handleTakeover = async () => {
    if (!selectedPhone || !tenantId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedPhone}/takeover?tenantId=${tenantId}`, { method: "POST" });
      if (res.ok) {
        setCurrentStatus("human");
        loadConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPhone || !tenantId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${selectedPhone}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, message: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        loadMessages(selectedPhone, currentStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(
    (c) => c.phone_number.includes(searchTerm) || c.last_message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPhone = (phone: string) => {
    if (phone.length >= 11) {
      return `(${phone.slice(-11, -9)}) ${phone.slice(-9, -4)}-${phone.slice(-4)}`;
    }
    return phone;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caixa de Entrada</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {conversations.length} conversa{conversations.length !== 1 ? "s" : ""} 
            {conversations.filter(c => c.status === "human").length > 0 && (
              <span className="text-orange-500 font-medium"> · {conversations.filter(c => c.status === "human").length} em atendimento humano</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-gray-500">Atualização automática</span>
        </div>
      </div>

      {/* Main container */}
      <div className="flex flex-1 overflow-hidden bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Conversation list */}
        <div className="w-[340px] bg-gray-50/30 border-r border-gray-100 flex flex-col shrink-0">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
            {loadingList && conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Carregando...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Nenhuma conversa</p>
                <p className="text-xs text-gray-400 mt-1 text-center px-4">
                  {searchTerm ? "Nenhum resultado para a busca" : "As conversas aparecerão quando clientes enviarem mensagens"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedPhone === conv.phone_number;
                const isHuman = conv.status === "human";
                return (
                  <div
                    key={conv.phone_number}
                    onClick={() => loadMessages(conv.phone_number, conv.status)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-[#4f46e5]/[0.08] border border-[#4f46e5]/15"
                        : "hover:bg-white hover:shadow-sm border border-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        isSelected ? "bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]" : "bg-gray-300"
                      }`}>
                        {conv.phone_number.slice(-2)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isHuman ? "bg-orange-400" : "bg-green-400"
                      }`}></span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`font-semibold text-sm truncate ${isSelected ? "text-[#4f46e5]" : "text-gray-900"}`}>
                          {formatPhone(conv.phone_number)}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {conv.timestamp ? new Date(conv.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message || "Sem mensagem"}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isHuman
                            ? "bg-orange-50 text-orange-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {isHuman ? "👤 Humano" : "🤖 IA"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedPhone ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-bold text-sm">
                    {selectedPhone.slice(-2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{formatPhone(selectedPhone)}</h3>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          currentStatus === "human" ? "bg-orange-400" : "bg-green-400"
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          currentStatus === "human" ? "bg-orange-500" : "bg-green-500"
                        }`}></span>
                      </span>
                      <p className="text-xs text-gray-500 font-medium">
                        {currentStatus === "human" ? "Atendimento Humano" : "Atendimento IA"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentStatus !== "human" && (
                    <button
                      onClick={handleTakeover}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-all border border-orange-100"
                    >
                      <span>👤</span> Assumir
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
                {loadingChat && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <div className="w-8 h-8 border-2 border-gray-200 border-t-[#4f46e5] rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm">Carregando histórico...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <p className="text-3xl mb-2">🕊️</p>
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.sender === "user";
                    const isAI = msg.sender === "ai";
                    const text = msg.message_text || msg.ai_response || "";

                    return (
                      <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                            isUser
                              ? "bg-white border border-gray-100 rounded-bl-sm"
                              : isAI
                              ? "bg-gradient-to-r from-[#4f46e5] to-[#5b51e0] text-white rounded-br-sm"
                              : "bg-gray-800 text-white rounded-br-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold tracking-wider uppercase ${
                              isUser ? "text-gray-400" : isAI ? "text-indigo-200" : "text-gray-400"
                            }`}>
                              {isUser ? "Cliente" : isAI ? "🤖 IA" : "👤 Você"}
                            </span>
                          </div>
                          <p className={`text-[14px] leading-relaxed ${isUser ? "text-gray-800" : "text-white"}`}>
                            {text}
                          </p>
                          <span className={`text-[10px] block mt-1.5 text-right ${
                            isUser ? "text-gray-300" : "text-white/50"
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              {currentStatus === "human" ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0">
                  <div className="flex-1 relative">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-indigo-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    Enviar
                  </button>
                </form>
              ) : (
                <div className="p-5 border-t border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 text-center shrink-0">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <span className="text-lg">🤖</span>
                    <p>
                      A <strong className="text-[#4f46e5]">IA</strong> está atendendo este cliente.{" "}
                      <button onClick={handleTakeover} className="text-[#4f46e5] font-semibold hover:underline">
                        Assumir manualmente →
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-gray-50/30 to-white">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl flex items-center justify-center mb-5 border border-indigo-100/50">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Caixa de Entrada</h3>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Selecione uma conversa ao lado para visualizar o histórico de mensagens ou iniciar o atendimento manual.
              </p>
              <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  IA ativo
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  Humano
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
