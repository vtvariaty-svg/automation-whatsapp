"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { planAtLeast } from "@/lib/config/plans";
import { OrderFormDialog } from "@/components/orders/OrderFormDialog";

type Conversation = {
  id: string;            // customerPhone (used as key for phone-based sub-routes)
  convId?: string;       // real conversation UUID — use for conversationId in payments
  phone_number: string;
  last_message: string;
  status: string;
  timestamp: string;
  channel?: string;
  assigned_user?: string;
  contactId?: string | null;
  contactName?: string | null;
};

type LinkedOrder = {
  id: string;
  status: string;
  price: number;
  product: string | null;
  createdAt: string;
  origin: string;
};

type LinkedPayment = {
  id: string;
  status: string;
  amount: number;
  billingType: string;
  invoiceUrl: string | null;
  dueDate: string;
  createdAt: string;
};

type Message = {
  id: string;
  sender: "user" | "ai" | "human";
  direction?: string;
  ai_generated?: boolean;
  message_text?: string;
  ai_response?: string;
  timestamp: string;
};

const ALL_CHANNELS = [
  { key: "all", label: "Todos", feature: null },
  { key: "whatsapp", label: "WhatsApp", feature: "whatsapp" as const },
  { key: "instagram", label: "Instagram", feature: null },
  { key: "facebook", label: "Facebook", feature: "facebook" as const },
];

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? (localStorage.getItem("auth_token") ?? localStorage.getItem("token") ?? "")
      : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function InboxPage() {
  const { user } = useAuth();
  const ent = useEntitlements();
  const router = useRouter();
  const tenantId = user?.tenantId;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>("open");
  const [replyText, setReplyText] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Nova conversa modal
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newConvForm, setNewConvForm] = useState({ phone: "", contactName: "", channel: "whatsapp" });
  const [startingConv, setStartingConv] = useState(false);
  const [newConvError, setNewConvError] = useState<string | null>(null);

  // Approved custom templates (for cold WA outbound)
  type ApprovedTpl = { id: string; name: string; body: string; language: string; exampleVars: string[] };
  const [approvedTemplates, setApprovedTemplates] = useState<ApprovedTpl[]>([]);
  const [selectedNewTpl, setSelectedNewTpl] = useState<ApprovedTpl | null>(null);
  const [newTplVars, setNewTplVars] = useState<string[]>([]);

  // In-chat session gate state
  const [requiresTemplate, setRequiresTemplate] = useState(false);
  const [chatTplId, setChatTplId] = useState("");
  const [chatTplVars, setChatTplVars] = useState<string[]>([]);
  const [sendingTemplate, setSendingTemplate] = useState(false);

  // Flag to open phone from query param after conversations are loaded
  const pendingPhoneRef = useRef<string | null>(null);

  // Order states
  const [linkedOrders, setLinkedOrders] = useState<LinkedOrder[]>([]);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const canCreateOrder = !ent.loading && planAtLeast(ent.plan, "standard");

  // Payment states
  const [linkedPayments, setLinkedPayments] = useState<LinkedPayment[]>([]);
  const canCreatePayment = !ent.loading && planAtLeast(ent.plan, "standard");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const loadConversations = async () => {
    if (!tenantId) return;
    setLoadingList(true);
    try {
      const res = await fetch(`/api/conversations?tenantId=${tenantId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);

        // If we have a pending phone from query param, open it now
        const pending = pendingPhoneRef.current;
        if (pending) {
          pendingPhoneRef.current = null;
          const match = data.find((c) => c.phone_number === pending);
          if (match) {
            loadMessages(match.phone_number, match.status);
          } else {
            // Conversation not in list yet — try to start/create it
            openOrCreateConversation(pending, data);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const openOrCreateConversation = async (phone: string, currentList: Conversation[]) => {
    // Check list first (may have just loaded)
    const match = currentList.find((c) => c.phone_number === phone);
    if (match) {
      loadMessages(match.phone_number, match.status);
      return;
    }
    try {
      const res = await fetch("/api/conversations/start", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        // Reload list so the new conversation appears, then open it
        const listRes = await fetch(`/api/conversations?tenantId=${tenantId}`, {
          headers: authHeaders(),
        });
        if (listRes.ok) {
          const refreshed: Conversation[] = await listRes.json();
          setConversations(refreshed);
          const found = refreshed.find((c) => c.phone_number === phone);
          if (found) loadMessages(found.phone_number, found.status);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Nova conversa ───────────────────────────────────────────────────────────

  const fetchApprovedTemplates = async () => {
    try {
      const res = await fetch("/api/whatsapp/templates/custom", { headers: authHeaders() });
      if (!res.ok) return;
      const all: ApprovedTpl[] = await res.json();
      setApprovedTemplates(all.filter((t: any) => t.status === "APPROVED"));
    } catch { /* non-fatal */ }
  };

  const handleNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = newConvForm.phone.trim();
    if (!phone) return;
    const isWhatsApp = newConvForm.channel === "whatsapp";

    // For WhatsApp cold outbound, a template must be selected
    if (isWhatsApp && !selectedNewTpl) {
      setNewConvError("Para iniciar uma conversa WhatsApp selecione um template aprovado.");
      return;
    }

    setStartingConv(true);
    setNewConvError(null);
    try {
      const startRes = await fetch("/api/conversations/start", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          phone,
          channel: newConvForm.channel,
          ...(newConvForm.contactName ? { contactName: newConvForm.contactName } : {}),
        }),
      });
      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error ?? "Falha ao criar conversa");
      }

      // WhatsApp cold outbound: send via approved template
      if (isWhatsApp && selectedNewTpl) {
        const sendRes = await fetch("/api/whatsapp/templates/send", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            to: phone,
            templateName: selectedNewTpl.name,
            language: selectedNewTpl.language,
            variables: newTplVars.filter(Boolean),
          }),
        });
        if (!sendRes.ok) {
          const err = await sendRes.json();
          throw new Error(err.error ?? "Falha ao enviar template");
        }
      }

      // Refresh list and open the conversation
      setShowNewConvModal(false);
      setNewConvForm({ phone: "", contactName: "", channel: "whatsapp" });
      setSelectedNewTpl(null);
      setNewTplVars([]);

      const listRes = await fetch(`/api/conversations?tenantId=${tenantId}`, { headers: authHeaders() });
      if (listRes.ok) {
        const refreshed: Conversation[] = await listRes.json();
        setConversations(refreshed);
        const found = refreshed.find((c) => c.phone_number === phone);
        if (found) loadMessages(found.phone_number, found.status);
      }
      showFeedback("success", "Conversa iniciada");
    } catch (err: unknown) {
      setNewConvError(err instanceof Error ? err.message : "Erro ao iniciar conversa");
    } finally {
      setStartingConv(false);
    }
  };

  // ── In-chat template send for cold/closed sessions ───────────────────────────

  const handleSendChatTemplate = async () => {
    if (!selectedPhone || !chatTplId) return;
    const tpl = approvedTemplates.find((t) => t.id === chatTplId);
    if (!tpl) return;
    setSendingTemplate(true);
    try {
      const res = await fetch("/api/whatsapp/templates/send", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          to: selectedPhone,
          templateName: tpl.name,
          language: tpl.language,
          variables: chatTplVars.filter(Boolean),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Falha ao enviar template");
      }
      setRequiresTemplate(false);
      setChatTplId("");
      setChatTplVars([]);
      loadMessages(selectedPhone, currentStatus);
      showFeedback("success", "Template enviado com sucesso");
    } catch (err: unknown) {
      showFeedback("error", err instanceof Error ? err.message : "Erro ao enviar template");
    } finally {
      setSendingTemplate(false);
    }
  };

  // Detect ?phone query param on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const phone = params.get("phone");
      if (phone) {
        pendingPhoneRef.current = phone;
        // Clean the URL without reload
        const url = new URL(window.location.href);
        url.searchParams.delete("phone");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadConversations();
      const interval = setInterval(loadConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [tenantId]);

  const loadLinkedOrders = useCallback(async (phone: string) => {
    if (!canCreateOrder) return;
    try {
      const res = await fetch(`/api/conversations/${phone}/orders`, { headers: authHeaders() });
      if (res.ok) setLinkedOrders(await res.json());
      else setLinkedOrders([]);
    } catch {
      setLinkedOrders([]);
    }
  }, [canCreateOrder]);

  const loadLinkedPayments = useCallback(async (conversationId: string) => {
    if (!canCreatePayment) return;
    try {
      const res = await fetch(`/api/payments?conversationId=${conversationId}&limit=10`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLinkedPayments(data.payments ?? []);
      } else {
        setLinkedPayments([]);
      }
    } catch {
      setLinkedPayments([]);
    }
  }, [canCreatePayment]);

  const loadMessages = async (phone: string, status: string) => {
    setSelectedPhone(phone);
    setCurrentStatus(status);
    setLoadingChat(true);
    try {
      const res = await fetch(`/api/conversations/${phone}/messages?tenantId=${tenantId}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChat(false);
    }
    // Load linked orders and payments for this conversation
    loadLinkedOrders(phone);
    const conv = conversations.find((c) => c.phone_number === phone);
    if (conv?.convId) loadLinkedPayments(conv.convId);
  };

  useEffect(() => {
    if (tenantId && selectedPhone) {
      const interval = setInterval(() => loadMessages(selectedPhone, currentStatus), 5000);
      return () => clearInterval(interval);
    }
  }, [tenantId, selectedPhone, currentStatus]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedPhone || !tenantId) return;
    try {
      const res = await fetch(`/api/conversations/${selectedPhone}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ tenantId, status: newStatus }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        loadConversations();
        const label =
          newStatus === "human" ? "Humano" : newStatus === "open" ? "IA" : "Encerrado";
        showFeedback("success", `Status alterado para ${label}`);
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
        headers: authHeaders(),
        body: JSON.stringify({ tenantId, message: replyText }),
      });
      if (res.ok) {
        setRequiresTemplate(false);
        setReplyText("");
        loadMessages(selectedPhone, currentStatus);
        showFeedback("success", "Mensagem enviada");
      } else {
        const data = await res.json();
        if (data.requiresTemplate) {
          // Session is closed — require approved template
          setRequiresTemplate(true);
          await fetchApprovedTemplates();
          setChatTplId("");
          setChatTplVars([]);
        } else {
          showFeedback("error", data.error ?? "Falha ao enviar mensagem");
        }
      }
    } catch (err) {
      console.error(err);
      showFeedback("error", "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.phone_number.includes(searchTerm) ||
      c.last_message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel =
      channelFilter === "all" ||
      (c.channel ?? "whatsapp").toLowerCase() === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const formatPhone = (phone: string) => {
    if (phone.length >= 11) {
      return `(${phone.slice(-11, -9)}) ${phone.slice(-9, -4)}-${phone.slice(-4)}`;
    }
    return phone;
  };

  const channelIcon = (channel?: string) => {
    switch ((channel ?? "whatsapp").toLowerCase()) {
      case "instagram": return "📸";
      case "facebook": return "📘";
      default: return "💬";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caixa de Entrada</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {conversations.length} conversa{conversations.length !== 1 ? "s" : ""}
            {conversations.filter((c) => c.status === "human").length > 0 && (
              <span className="text-orange-500 font-medium">
                {" "}· {conversations.filter((c) => c.status === "human").length} em atendimento humano
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setNewConvError(null); setShowNewConvModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200/50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova conversa
          </button>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-gray-500">Atualização automática</span>
          </div>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`mb-3 shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {feedback.type === "success" ? "✓ " : "✕ "}
          {feedback.text}
        </div>
      )}

      {/* Main container */}
      <div className="flex flex-1 overflow-hidden bg-white rounded-2xl border border-gray-200/60 shadow-sm">
        {/* Conversation list */}
        <div className={`w-full md:w-[340px] bg-white md:bg-gray-50/30 border-r border-gray-100 flex-col shrink-0 ${selectedPhone ? "hidden md:flex" : "flex"}`}>
          {/* Search + channel filter */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Channel filter */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {ALL_CHANNELS.map((ch) => {
                const isDisabled = !ent.loading && ch.feature && !ent.features[ch.feature];
                if (isDisabled) {
                  return (
                    <button
                      key={ch.key}
                      disabled
                      className="flex-1 py-1 text-xs font-semibold rounded-lg text-gray-300 cursor-not-allowed"
                      title={`Disponível no plano ${ch.feature === 'facebook' ? 'Pro' : 'Standard'}`}
                    >
                      {ch.label} <span className="text-[9px]">🔒</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={ch.key}
                    onClick={() => setChannelFilter(ch.key)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      channelFilter === ch.key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
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
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-4">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <span className="text-2xl">💬</span>
                </div>
                <p className="text-sm font-medium text-gray-500">Nenhuma conversa</p>
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {searchTerm || channelFilter !== "all"
                    ? "Nenhum resultado para os filtros"
                    : "Inicie uma conversa manualmente ou aguarde mensagens."}
                </p>
                {!searchTerm && channelFilter === "all" && (
                  <button
                    onClick={() => { setNewConvError(null); setShowNewConvModal(true); }}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-[#4f46e5] border border-indigo-100 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nova conversa
                  </button>
                )}
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
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          isSelected
                            ? "bg-gradient-to-br from-[#4f46e5] to-[#7c3aed]"
                            : "bg-gray-300"
                        }`}
                      >
                        {conv.phone_number.slice(-2)}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isHuman ? "bg-orange-400" : "bg-green-400"
                        }`}
                      ></span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span
                          className={`font-semibold text-sm truncate ${
                            isSelected ? "text-[#4f46e5]" : "text-gray-900"
                          }`}
                        >
                          {formatPhone(conv.phone_number)}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                          <span title={conv.channel ?? "whatsapp"}>{channelIcon(conv.channel)}</span>
                          {conv.timestamp
                            ? new Date(conv.timestamp).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.last_message || "Sem mensagem"}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isHuman ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
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
        <div className={`flex-1 flex-col bg-white overflow-hidden ${selectedPhone ? "flex" : "hidden md:flex"}`}>
          {selectedPhone ? (
            <>
              {/* Chat header */}
              <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedPhone(null)}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {selectedPhone.slice(-2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{formatPhone(selectedPhone)}</h3>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            currentStatus === "human"
                              ? "bg-orange-400"
                              : currentStatus === "closed"
                              ? "bg-gray-400"
                              : currentStatus === "waiting"
                              ? "bg-yellow-400"
                              : "bg-green-400"
                          }`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            currentStatus === "human"
                              ? "bg-orange-500"
                              : currentStatus === "closed"
                              ? "bg-gray-500"
                              : currentStatus === "waiting"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></span>
                      </span>
                      <p className="text-xs text-gray-500 font-medium">
                        {currentStatus === "human"
                          ? "Atendimento Humano"
                          : currentStatus === "closed"
                          ? "Encerrado"
                          : currentStatus === "waiting"
                          ? "Aguardando"
                          : "Atendimento IA"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {currentStatus === "open" || currentStatus === "waiting" ? (
                    <button
                      onClick={() => handleStatusChange("human")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-all border border-orange-100"
                    >
                      <span>👤</span> <span>Assumir conversa</span>
                    </button>
                  ) : null}
                  {currentStatus === "human" && (
                    <button
                      onClick={() => handleStatusChange("open")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-[#4f46e5] rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                      <span>🤖</span> <span>Voltar para IA</span>
                    </button>
                  )}
                  {currentStatus !== "closed" && (
                    <button
                      onClick={() => handleStatusChange("closed")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all border border-gray-200"
                    >
                      <span>✅</span> <span>Encerrar</span>
                    </button>
                  )}
                  {canCreateOrder && (
                    <button
                      onClick={() => setShowOrderDialog(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all border border-emerald-100"
                    >
                      <span>🛍️</span> <span>Criar Pedido</span>
                    </button>
                  )}
                  {canCreatePayment && (() => {
                    const conv = conversations.find((c) => c.phone_number === selectedPhone);
                    const params = new URLSearchParams({ newCharge: "1" });
                    if (conv?.convId)    params.set("conversationId", conv.convId);
                    if (selectedPhone)   params.set("customerPhone",  selectedPhone);
                    if (conv?.contactId) params.set("contactId",      conv.contactId);
                    return (
                      <button
                        onClick={() => router.push(`/dashboard/payments?${params}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        <span>💸</span> <span>Gerar cobrança</span>
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Linked orders bar */}
              {linkedOrders.length > 0 && (
                <div className="px-6 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 overflow-x-auto shrink-0">
                  <span className="text-xs font-semibold text-gray-500 shrink-0">Pedidos:</span>
                  {linkedOrders.map((o) => (
                    <a
                      key={o.id}
                      href={`/dashboard/orders?detail=${o.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all shrink-0"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        o.status === "paid" || o.status === "completed" ? "bg-emerald-500" :
                        o.status === "cancelled" || o.status === "refunded" ? "bg-red-400" :
                        o.status === "pending_payment" ? "bg-amber-500" : "bg-gray-400"
                      }`} />
                      <span className="text-gray-700">#{o.id.slice(0, 6)}</span>
                      <span className="text-gray-400">R$ {Number(o.price).toFixed(2).replace(".", ",")}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Linked payments bar */}
              {linkedPayments.length > 0 && (
                <div className="px-6 py-2 border-b border-gray-100 bg-indigo-50/30 flex items-center gap-2 overflow-x-auto shrink-0">
                  <span className="text-xs font-semibold text-indigo-500 shrink-0">💸 Cobranças:</span>
                  {linkedPayments.map((p) => (
                    <div key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-indigo-100 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p.status === "confirmed" ? "bg-emerald-500" :
                        p.status === "failed" || p.status === "canceled" ? "bg-red-400" :
                        p.status === "overdue" ? "bg-amber-500" : "bg-indigo-400"
                      }`} />
                      <span className="text-gray-700">
                        {p.status === "confirmed" ? "Pago" :
                         p.status === "overdue"   ? "Vencido" :
                         p.status === "failed"    ? "Falhou" :
                         p.status === "canceled"  ? "Cancelado" : "Pendente"}
                      </span>
                      <span className="text-gray-500">R$ {Number(p.amount).toFixed(2).replace(".", ",")}</span>
                      {p.invoiceUrl && p.status !== "confirmed" && (
                        <a
                          href={p.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500 hover:text-indigo-700 underline ml-0.5"
                          title="Abrir link de pagamento"
                        >
                          link
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

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
                    const isInbound = msg.direction === "inbound" || msg.sender === "user";
                    const isAI = msg.ai_generated !== false && (msg.sender === "ai" || !isInbound);
                    const text = msg.message_text || msg.ai_response || "";

                    return (
                      <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${
                            isInbound
                              ? "bg-white border border-gray-100 rounded-bl-sm"
                              : isAI
                              ? "bg-gradient-to-r from-[#4f46e5] to-[#5b51e0] text-white rounded-br-sm"
                              : "bg-gray-800 text-white rounded-br-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold tracking-wider uppercase ${
                                isInbound ? "text-gray-400" : isAI ? "text-indigo-200" : "text-gray-400"
                              }`}
                            >
                              {isInbound ? "Cliente" : isAI ? "🤖 IA" : "👤 Você"}
                            </span>
                          </div>
                          <p
                            className={`text-[14px] leading-relaxed ${
                              isInbound ? "text-gray-800" : "text-white"
                            }`}
                          >
                            {text}
                          </p>
                          <span
                            className={`text-[10px] block mt-1.5 text-right ${
                              isInbound ? "text-gray-300" : "text-white/50"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              {currentStatus !== "closed" ? (
                requiresTemplate ? (
                  <div className="p-4 border-t border-amber-100 bg-amber-50 space-y-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500 text-lg">⚠️</span>
                      <p className="text-sm font-semibold text-amber-700">
                        Esta conversa requer um template aprovado para iniciar.
                      </p>
                    </div>
                    <p className="text-xs text-amber-600">
                      A janela de atendimento do WhatsApp está encerrada. Use um template aprovado para retomar o contato.
                    </p>
                    {approvedTemplates.length === 0 ? (
                      <div className="bg-white border border-amber-200 rounded-xl p-3 text-xs text-gray-600">
                        Não há template aprovado disponível.{" "}
                        <a href="/dashboard/templates" className="text-[#4f46e5] hover:underline font-semibold">Gerenciar templates →</a>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={chatTplId}
                          onChange={(e) => {
                            setChatTplId(e.target.value);
                            const tpl = approvedTemplates.find((t) => t.id === e.target.value);
                            setChatTplVars(tpl ? tpl.exampleVars.map(() => "") : []);
                          }}
                          className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        >
                          <option value="">Selecionar template...</option>
                          {approvedTemplates.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        {chatTplId && (() => {
                          const tpl = approvedTemplates.find((t) => t.id === chatTplId);
                          const matches = tpl?.body.match(/\{\{\d+\}\}/g) || [];
                          return matches.length > 0 ? (
                            <div className="space-y-1">
                              {matches.map((ph, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  placeholder={`Variável ${i + 1} (${ph})`}
                                  value={chatTplVars[i] || ""}
                                  onChange={(e) => {
                                    const v = [...chatTplVars];
                                    v[i] = e.target.value;
                                    setChatTplVars(v);
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm text-gray-800 focus:outline-none"
                                />
                              ))}
                            </div>
                          ) : null;
                        })()}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSendChatTemplate}
                            disabled={!chatTplId || sendingTemplate}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all"
                          >
                            {sendingTemplate ? "Enviando..." : "📱 Enviar template"}
                          </button>
                          <button
                            onClick={() => setRequiresTemplate(false)}
                            className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-gray-100 bg-white flex items-center gap-3 shrink-0"
                >
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
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    <span>Enviar</span>
                  </button>
                </form>
                )
              ) : (
                <div className="p-5 border-t border-gray-100 bg-gray-50 text-center shrink-0">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium">
                    <span className="text-lg">🔒</span>
                    <p>Esta conversa foi encerrada.</p>
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
                Selecione uma conversa ao lado para visualizar o histórico de mensagens ou iniciar
                o atendimento manual.
              </p>
              <div className="mt-6 gap-4 flex-wrap flex items-center justify-center text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  IA ativo
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                  Humano
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                  Aguardando
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Encerrado
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order creation dialog from conversation */}
      {showOrderDialog && selectedPhone && (
        <OrderFormDialog
          isOpen={showOrderDialog}
          onClose={() => setShowOrderDialog(false)}
          onSuccess={() => {
            setShowOrderDialog(false);
            showFeedback("success", "Pedido criado com sucesso");
            if (selectedPhone) loadLinkedOrders(selectedPhone);
          }}
          tenantId={tenantId || ""}
          contactId={conversations.find((c) => c.phone_number === selectedPhone)?.contactId ?? undefined}
          customerPhone={selectedPhone}
          origin={
            conversations.find((c) => c.phone_number === selectedPhone)?.channel ?? "whatsapp"
          }
          conversationId={
            conversations.find((c) => c.phone_number === selectedPhone)?.convId
          }
        />
      )}

      {/* ── Nova conversa modal ──────────────────────────────────────────────── */}
      {showNewConvModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nova conversa</h3>
              <button
                onClick={() => { setShowNewConvModal(false); setSelectedNewTpl(null); setNewTplVars([]); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={handleNewConversation}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Telefone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={newConvForm.phone}
                  onChange={(e) => setNewConvForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Ex: 5511999990000"
                  required
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nome do contato (opcional)</label>
                <input
                  type="text"
                  value={newConvForm.contactName}
                  onChange={(e) => setNewConvForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="Nome para identificação"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Canal</label>
                <select
                  value={newConvForm.channel}
                  onChange={(e) => {
                    setNewConvForm((f) => ({ ...f, channel: e.target.value }));
                    if (e.target.value === "whatsapp") fetchApprovedTemplates();
                    setSelectedNewTpl(null);
                    setNewTplVars([]);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>

              {/* WhatsApp: require approved template for cold outbound */}
              {newConvForm.channel === "whatsapp" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-700">
                    📱 Para iniciar uma conversa WhatsApp com um contato que ainda não interagiu, use um template aprovado.
                  </p>
                  {approvedTemplates.length === 0 ? (
                    <div className="text-xs text-gray-600">
                      Nenhum template aprovado disponível.{" "}
                      <a href="/dashboard/templates" className="text-[#4f46e5] hover:underline font-semibold" onClick={() => setShowNewConvModal(false)}>
                        Criar/ativar templates →
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedNewTpl?.id || ""}
                        onChange={(e) => {
                          const tpl = approvedTemplates.find((t) => t.id === e.target.value) || null;
                          setSelectedNewTpl(tpl);
                          setNewTplVars(tpl ? tpl.exampleVars.map(() => "") : []);
                        }}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      >
                        <option value="">Selecionar template aprovado...</option>
                        {approvedTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      {selectedNewTpl && (() => {
                        const matches = selectedNewTpl.body.match(/\{\{\d+\}\}/g) || [];
                        return matches.length > 0 ? (
                          <div className="space-y-1">
                            {matches.map((ph, i) => (
                              <input
                                key={i}
                                type="text"
                                placeholder={`Variável ${i + 1} (${ph})`}
                                value={newTplVars[i] || ""}
                                onChange={(e) => {
                                  const v = [...newTplVars];
                                  v[i] = e.target.value;
                                  setNewTplVars(v);
                                }}
                                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm text-gray-800 focus:outline-none"
                              />
                            ))}
                          </div>
                        ) : null;
                      })()}
                      {selectedNewTpl && (
                        <p className="text-[10px] text-gray-500 bg-white rounded-lg px-2 py-1.5 border border-amber-100 line-clamp-2">
                          {selectedNewTpl.body}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {newConvError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {newConvError}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={startingConv || !newConvForm.phone.trim() || (newConvForm.channel === "whatsapp" && !selectedNewTpl)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {startingConv ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  ) : null}
                  {startingConv ? "Iniciando..." : "Iniciar conversa"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewConvModal(false); setSelectedNewTpl(null); setNewTplVars([]); }}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
