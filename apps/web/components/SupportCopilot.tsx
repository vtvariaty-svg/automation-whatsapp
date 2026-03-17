'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SuggestedLink { href: string; label: string; }
interface CopilotResponse {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  suggested_links: SuggestedLink[];
  suggested_actions: string[];
  fallback_needed: boolean;
}

const QUICK_SUGGESTIONS = [
  'Como conectar o WhatsApp?',
  'A IA não está respondendo',
  'Como criar uma automação?',
  'Como fazer upgrade de plano?',
];

export default function SupportCopilot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedLinks, setSuggestedLinks] = useState<SuggestedLink[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [lastFallback, setLastFallback] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token');
    setIsAuthenticated(Boolean(token));
  }, []);

  // Greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '0',
          role: 'assistant',
          content: 'Olá! Sou o Copiloto de Suporte. Como posso ajudar com o sistema?',
        },
      ]);
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setSuggestedLinks([]);
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token') ?? localStorage.getItem('token') ?? '';
      const res = await fetch('/api/support-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          question: userMsg.content,
          route: pathname,
          history: updatedHistory.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data: CopilotResponse = await res.json();
      const answer = data.answer ?? 'Não consegui processar sua pergunta. Tente novamente.';

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: answer },
      ]);
      setSuggestedLinks(data.suggested_links ?? []);
      setSuggestedActions(data.suggested_actions ?? []);
      setLastFallback(data.fallback_needed ?? false);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Erro de conexão. Verifique sua internet e tente novamente.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <>
      {/* ── Chat panel ── */}
      {isOpen && (
        <div
          className="fixed bottom-[72px] left-4 sm:left-6 z-50 flex flex-col w-[calc(100vw-2rem)] sm:w-[360px] max-h-[480px] rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
          role="dialog"
          aria-label="Copiloto de Suporte"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm">🤖</div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Copiloto de Suporte</p>
                <p className="text-indigo-200 text-[10px]">Baseado no seu sistema</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-indigo-200 hover:text-white text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-xl rounded-bl-sm px-3 py-2.5 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {/* Suggested links (SC8) */}
            {suggestedLinks.length > 0 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                    {link.label} →
                  </Link>
                ))}
              </div>
            )}

            {/* Suggested actions */}
            {suggestedActions.length > 0 && !loading && (
              <div className="pt-1 space-y-1">
                {suggestedActions.map((action) => (
                  <p key={action} className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                    💡 {action}
                  </p>
                ))}
              </div>
            )}

            {/* SC6: Fallback nudge */}
            {lastFallback && !loading && (
              <div className="bg-gray-100 rounded-xl px-3 py-2 text-xs text-gray-500 flex items-center justify-between gap-2">
                <span>Não encontrou a resposta?</span>
                <Link href="/dashboard/settings"
                  onClick={() => setIsOpen(false)}
                  className="text-indigo-600 font-medium hover:underline whitespace-nowrap">
                  Enviar feedback →
                </Link>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions — only shown before first user message */}
          {messages.length === 1 && !loading && (
            <div className="px-3 pb-2 bg-gray-50 shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sugestões rápidas</p>
              <div className="flex flex-col gap-1">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs text-indigo-600 bg-white border border-indigo-100 rounded-lg px-2.5 py-1.5 hover:bg-indigo-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Pergunte sobre o sistema..."
                disabled={loading}
                maxLength={400}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl disabled:opacity-40 transition-opacity hover:shadow-md hover:shadow-indigo-500/30 shrink-0"
                aria-label="Enviar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-3.5 py-2 text-sm font-medium text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Abrir copiloto de suporte"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Ajuda</span>
      </button>
    </>
  );
}
