'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChannelStatus {
  connected: boolean;
  label: string;
  icon: string;
  connectHref: string;
}

interface NicheOption {
  key: string;
  label: string;
  emoji: string;
  description: string;
  automationCount: number;
}

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href?: string;
}

// ─── Static config ────────────────────────────────────────────────────────────

const NICHES: NicheOption[] = [
  { key: 'estética',       label: 'Estética & Beleza',  emoji: '✨', description: 'Studio, clínica de estética, nail designer', automationCount: 4 },
  { key: 'clínica',        label: 'Clínica & Saúde',    emoji: '🏥', description: 'Médico, dentista, psicólogo, fisioterapeuta', automationCount: 4 },
  { key: 'restaurante',    label: 'Restaurante',         emoji: '🍽️', description: 'Restaurante, lanchonete, delivery', automationCount: 4 },
  { key: 'serviços locais',label: 'Serviços Locais',     emoji: '🔧', description: 'Encanador, eletricista, mecânico, marido de aluguel', automationCount: 4 },
  { key: 'infoproduto',    label: 'Infoproduto',         emoji: '🚀', description: 'Curso online, mentoria, ebook, coaching', automationCount: 4 },
  { key: 'outro',          label: 'Outro negócio',       emoji: '💼', description: 'Comércio, prestador de serviços ou qualquer outro', automationCount: 2 },
];

const STEPS = [
  { n: 1, label: 'Canal'      },
  { n: 2, label: 'Nicho'      },
  { n: 3, label: 'Template'   },
  { n: 4, label: 'Mensagem'   },
  { n: 5, label: 'Publicar'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('auth_token') ?? (localStorage.getItem('auth_token') ?? localStorage.getItem('token')) ?? '')
    : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex flex-col items-center`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
              ${current === s.n ? 'bg-indigo-600 text-white' : current > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {current > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${current === s.n ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 sm:w-16 h-0.5 mx-1 mb-4 ${current > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(true);

  // Step 2
  const [selectedNiche, setSelectedNiche] = useState('');

  // Step 4
  const [companyName, setCompanyName] = useState('');
  const [businessHours, setBusinessHours] = useState('Seg–Sex: 9h–18h, Sáb: 9h–13h');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Step 5
  const [result, setResult] = useState<{ automationCount: number; serviceCount: number } | null>(null);

  const nicheConfig = NICHES.find((n) => n.key === selectedNiche);
  const anyChannelConnected = channels.some((c) => c.connected);

  // Load channel statuses
  const loadChannels = useCallback(async () => {
    setChannelsLoading(true);
    const h = authHeaders();
    const [waRes, igRes, fbRes] = await Promise.all([
      fetch('/api/integrations/whatsapp/status', { headers: h }).catch(() => null),
      fetch('/api/integrations/instagram/status', { headers: h }).catch(() => null),
      fetch('/api/integrations/facebook/status', { headers: h }).catch(() => null),
    ]);
    const [wa, ig, fb] = await Promise.all([
      waRes?.json().catch(() => ({})),
      igRes?.json().catch(() => ({})),
      fbRes?.json().catch(() => ({})),
    ]);
    setChannels([
      { connected: !!wa?.connected, label: 'WhatsApp', icon: '💬', connectHref: '/dashboard/integrations' },
      { connected: !!ig?.connected, label: 'Instagram', icon: '📸', connectHref: '/api/integrations/instagram/connect' },
      { connected: !!fb?.connected, label: 'Facebook', icon: '📘', connectHref: '/api/integrations/facebook/connect' },
    ]);
    setChannelsLoading(false);
  }, []);

  useEffect(() => { loadChannels(); }, [loadChannels]);

  // Pre-fill welcome message when niche changes
  useEffect(() => {
    const defaultMessages: Record<string, string> = {
      estética:        'Olá! ✨ Bem-vindo(a)! Sou a assistente do studio. Posso ajudar com agendamentos e procedimentos. Como posso te ajudar?',
      clínica:         'Olá! 👋 Bem-vindo(a)! Sou a assistente virtual da clínica. Posso ajudar com agendamentos e dúvidas. Como posso te ajudar?',
      restaurante:     'Olá! 🍽️ Bem-vindo(a)! Sou o assistente do restaurante. Posso ajudar com reservas, pedidos e cardápio. Como posso te ajudar?',
      'serviços locais': 'Olá! 🔧 Bem-vindo(a)! Posso ajudar com orçamentos e agendamento de visitas. Como posso te ajudar?',
      infoproduto:     'Olá! 🚀 Bem-vindo(a)! Sou a assistente do curso. Posso tirar suas dúvidas e ajudar na sua jornada. Como posso te ajudar?',
      outro:           'Olá! 👋 Bem-vindo(a)! Sou o assistente virtual. Como posso te ajudar hoje?',
    };
    if (selectedNiche) setWelcomeMessage(defaultMessages[selectedNiche] ?? defaultMessages['outro']);
  }, [selectedNiche]);

  // ── Publish ──────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setLoading(true);
    const res = await fetch('/api/onboarding/fast', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ niche: selectedNiche, companyName, businessHours, welcomeMessage }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(data);
      setStep(5);
    } else {
      alert(data.error ?? 'Erro ao publicar. Tente novamente.');
    }
    setLoading(false);
  };

  // ── Checklist (step 5) ────────────────────────────────────────────────────
  const checklist: ChecklistItem[] = [
    { key: 'channel',   label: 'Canal conectado',              done: anyChannelConnected },
    { key: 'niche',     label: 'Nicho escolhido',              done: !!selectedNiche },
    { key: 'template',  label: 'Template importado',           done: !!result },
    { key: 'message',   label: 'Mensagem de boas-vindas definida', done: !!welcomeMessage },
    { key: 'published', label: 'Automações publicadas',        done: !!result, href: '/dashboard/automations' },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Ativar automação em minutos</h1>
        <p className="text-gray-500 text-sm mt-1">Configure seu atendimento automático em 5 passos simples.</p>
      </div>

      <StepIndicator current={step} />

      {/* ── Step 1: Canal ── */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">1. Conectar canal</h2>
            <p className="text-gray-500 text-sm mt-0.5">Escolha por onde seus clientes vão te contatar.</p>
          </div>

          {channelsLoading ? (
            <p className="text-sm text-gray-400 animate-pulse">Verificando conexões...</p>
          ) : (
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.label} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ch.icon}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{ch.label}</p>
                      <p className={`text-xs ${ch.connected ? 'text-green-600' : 'text-gray-400'}`}>
                        {ch.connected ? 'Conectado ✓' : 'Não conectado'}
                      </p>
                    </div>
                  </div>
                  {!ch.connected && (
                    <a href={ch.connectHref} className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      Conectar
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {!anyChannelConnected && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Conecte ao menos um canal para continuar. Você pode avançar e conectar depois também.
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors">
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Nicho ── */}
      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">2. Qual é o seu negócio?</h2>
            <p className="text-gray-500 text-sm mt-0.5">Vamos importar automações prontas para o seu nicho.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {NICHES.map((n) => (
              <button
                key={n.key}
                onClick={() => setSelectedNiche(n.key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedNiche === n.key
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{n.emoji}</div>
                <div className="font-semibold text-gray-900 text-sm">{n.label}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-tight">{n.description}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">← Voltar</button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedNiche}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Template Preview ── */}
      {step === 3 && nicheConfig && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">3. Template incluído</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              Para <strong>{nicheConfig.label}</strong> vamos criar automaticamente:
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <span className="text-green-500 mt-0.5 font-bold">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Mensagem de boas-vindas</p>
                <p className="text-xs text-gray-500 mt-0.5">Enviada automaticamente para novos contatos</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <span className="text-green-500 mt-0.5 font-bold">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{nicheConfig.automationCount} automações por palavra-chave</p>
                <p className="text-xs text-gray-500 mt-0.5">Respostas automáticas para perguntas frequentes do nicho</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <span className="text-green-500 mt-0.5 font-bold">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Prompt de IA personalizado</p>
                <p className="text-xs text-gray-500 mt-0.5">Configurado com o contexto e comportamento ideal para {nicheConfig.label}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <span className="text-green-500 mt-0.5 font-bold">✓</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Serviços padrão do nicho</p>
                <p className="text-xs text-gray-500 mt-0.5">Prontos para agendamento e cotação</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">← Voltar</button>
            <button onClick={() => setStep(4)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors">
              Personalizar →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Personalizar ── */}
      {step === 4 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">4. Personalizar</h2>
            <p className="text-gray-500 text-sm mt-0.5">Ajuste os dados do seu negócio e a mensagem de boas-vindas.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do negócio <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Studio Bella, Clínica Saúde Plena..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário de atendimento</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="Ex: Seg–Sex 9h–18h, Sáb 9h–13h"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de boas-vindas</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                placeholder="Mensagem enviada quando um novo cliente entrar em contato..."
              />
              <p className="text-xs text-gray-400 mt-1">{welcomeMessage.length}/200 caracteres</p>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep(3)} className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">← Voltar</button>
            <button
              onClick={handlePublish}
              disabled={!companyName.trim() || loading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm disabled:opacity-40 hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Publicando...</>
              ) : (
                '🚀 Publicar automação'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Sucesso + CTA ── */}
      {step === 5 && result && (
        <div className="space-y-5">
          {/* Success banner */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-green-900">Automação ativada!</h2>
            <p className="text-green-700 text-sm">
              <strong>{result.automationCount} automações</strong> e <strong>{result.serviceCount} serviços</strong> foram criados para o seu negócio.
            </p>
          </div>

          {/* Checklist */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Checklist de ativação</h3>
            {checklist.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {item.done ? '✓' : '○'}
                </div>
                {item.href ? (
                  <Link href={item.href} className="text-sm text-indigo-600 hover:underline">{item.label}</Link>
                ) : (
                  <span className={`text-sm ${item.done ? 'text-gray-700' : 'text-gray-400'}`}>{item.label}</span>
                )}
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/dashboard/conversations"
              className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors"
            >
              💬 Ver conversas
            </Link>
            <Link
              href="/dashboard/automations"
              className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              ⚡ Gerenciar automações
            </Link>
            <Link
              href="/dashboard/sandbox"
              className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              🧪 Testar automação
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              📊 Ver dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
