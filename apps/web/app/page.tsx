import Link from "next/link";
import Image from "next/image";
import MetaPixel from "@/components/marketing/MetaPixel";

export const metadata = {
  title: "Variaty — Atendimento no WhatsApp com IA que Vende e Agenda 24h",
  description:
    "Automatize o atendimento no WhatsApp, Instagram e Facebook com IA. Qualifique leads, feche vendas e gerencie agendamentos — 24 horas por dia, sem aumentar o time.",
  openGraph: {
    title: "Variaty — Atendimento com IA para WhatsApp, Instagram e Facebook",
    description:
      "Configure sua IA de atendimento em minutos. Venda, agende e qualifique clientes automaticamente — conectado à API Oficial da Meta.",
    url: "https://vtvariatysecretary.com.br",
    siteName: "Variaty",
    type: "website",
  },
};

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20testar%20a%20IA%20da%20Variaty.";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.webp" alt="Variaty" className="h-20 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
          <a href="#solucao" className="hover:text-blue-600 transition-colors">A Solução</a>
          <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</a>
          <a href="#planos" className="hover:text-blue-600 transition-colors">Planos</a>
          <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          <a href="#contato" className="hover:text-blue-600 transition-colors">Fale Conosco</a>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Entrar
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Testar Grátis</span>
            <span className="sm:hidden">Começar</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gray-50">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-white to-white" />
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#4f46e5] rounded-full mix-blend-multiply filter blur-[128px] opacity-8 animate-pulse" />
      <div
        className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-[128px] opacity-8 animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50/80 border border-blue-200/60 rounded-full px-4 py-1.5 mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-700 uppercase tracking-wide">
              Configuração guiada · API Oficial Meta · Motor OpenAI
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.08] mb-6">
            Ensine sua IA a atender
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {" "}do seu jeito
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
            Configure sua secretária virtual em minutos respondendo perguntas simples sobre o seu negócio —
            {" "}<strong className="text-gray-900">sem escrever uma linha de prompt</strong>.
            Sua IA aprende suas regras, atende, agenda e vende por você 24h por dia.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link
              href="/register"
              className="w-full sm:w-auto text-base font-bold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all hover:-translate-y-1"
            >
              Configurar minha IA agora
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto text-base font-bold text-gray-700 bg-white border border-gray-200 px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              Ver como funciona →
            </a>
          </div>

          {/* Demo WhatsApp — prova viva do produto */}
          <div className="flex justify-center mb-5">
            <a
              href={WHATSAPP_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-white border border-gray-200 hover:border-[#25D366]/50 hover:bg-[#f6fef9] rounded-2xl px-5 py-3.5 shadow-sm hover:shadow-md transition-all duration-200 max-w-sm w-full sm:w-auto"
            >
              {/* Live indicator + WA icon */}
              <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center">
                <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
                </svg>
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#25D366]" />
                </span>
              </div>
              {/* Copy */}
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-snug">
                  Falar com a IA agora no WhatsApp
                </p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Você conversa com a IA real — responde em segundos
                </p>
              </div>
              {/* Chevron */}
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#25D366] group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Microcopy */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Sem cartão de crédito
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Sem escrever prompt
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Atendimento ativo em minutos
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Cancele quando quiser
            </span>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto w-full px-2 sm:px-0">
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-[#4f46e5]/20 to-[#7c3aed]/20 rounded-3xl blur-xl sm:blur-2xl" />
          <div className="relative bg-gray-900 rounded-2xl shadow-2xl shadow-gray-900/30 overflow-hidden border border-gray-700/80 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
            </div>
            <div className="relative w-full aspect-[16/9] bg-gray-900">
              <Image
                src="/hero-dashboard.png"
                alt="Painel Variaty — Atendimento com IA"
                fill
                className="object-cover object-top"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Integrações ──────────────────────────────────────────────────────────────

function IntegracoesStrip() {
  return (
    <section className="py-10 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-7">
          Infraestrutura homologada e parceiros oficiais
        </p>
        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap opacity-60 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-gray-700">
            <svg className="w-8 h-8 fill-[#25D366]" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
            </svg>
            <span className="font-bold text-base">WhatsApp API</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <svg className="w-8 h-8 fill-[#E4405F]" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="font-bold text-base">Instagram</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <svg className="w-8 h-8 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="font-bold text-base">Facebook</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-extrabold text-[#635BFF] text-2xl tracking-tighter">stripe</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-2xl">🧠</span>
            <span className="font-bold text-base">OpenAI</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-2xl">🟦</span>
            <span className="font-bold text-base">Asaas</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Credibilidade ────────────────────────────────────────────────────────────

function CredibilidadeStrip() {
  const items = [
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: "API Oficial da Meta",
      sub: "Sem risco de banimento",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Atendimento 24/7",
      sub: "Sua IA nunca para",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: "Setup em minutos",
      sub: "Sem implantação demorada",
    },
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Controle humano total",
      sub: "Intervenha quando quiser",
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">{item.icon}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Problema + Solução ───────────────────────────────────────────────────────

function SolucaoSection() {
  return (
    <section id="solucao" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Dor */}
          <div>
            <span className="inline-block text-red-600 font-bold tracking-wide text-sm uppercase bg-red-50 px-3 py-1 rounded-full mb-4">
              O problema
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
              Leads esfriando enquanto seu time tenta dar conta do WhatsApp.
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Respostas demoradas custam vendas. Dúvidas repetitivas consomem tempo do time. Agendamentos perdidos em papel ou planilha. E fora do horário comercial, o concorrente atende antes.
            </p>
            <ul className="space-y-3">
              {[
                "Mensagens sem resposta fora do horário comercial",
                "Time sobrecarregado com dúvidas repetitivas",
                "Leads qualificados perdidos por demora no retorno",
                "Agendamentos e pedidos gerenciados manualmente",
                "Zero visibilidade sobre o que acontece nas conversas",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 font-medium">
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-xs font-bold">
                    ✕
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Solução */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-2xl opacity-8 translate-y-4 translate-x-4" />
            <div className="relative bg-gray-50 border border-gray-200 rounded-3xl p-8 lg:p-10 shadow-sm">
              <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-50 px-3 py-1 rounded-full mb-5">
                A solução Variaty
              </span>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4 leading-snug">
                Uma IA treinada com as regras do seu negócio — atendendo enquanto você foca no que importa.
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Não é um chatbot de respostas fixas. É uma inteligência que entende o contexto do cliente, aplica as regras do seu negócio e executa ações reais: agenda, gera cobrança, encaminha para o time.
              </p>
              <div className="space-y-3">
                {[
                  { cor: "green", titulo: "Respostas imediatas", sub: "Mesmo às 2h da manhã ou aos domingos." },
                  { cor: "blue", titulo: "Qualificação automática", sub: "A IA identifica o lead certo e aciona a ação certa." },
                  { cor: "indigo", titulo: "Controle total da equipe", sub: "Intervenha em qualquer conversa em tempo real." },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className={`w-10 h-10 bg-${item.cor}-100 rounded-lg flex items-center justify-center text-${item.cor}-600 text-base font-bold flex-shrink-0`}>
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.titulo}</p>
                      <p className="text-xs text-gray-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Como Funciona (Fluxo da IA) ─────────────────────────────────────────────

function ComoFuncionaSection() {
  const etapas = [
    {
      num: "01",
      titulo: "Conecte seu canal",
      desc: "WhatsApp Business Oficial, Instagram ou Facebook — ative com autenticação oficial Meta em poucos cliques.",
      cor: "blue",
    },
    {
      num: "02",
      titulo: "Ensine sua IA",
      desc: "Responda perguntas simples sobre seu negócio: tom, ofertas, horários e diferenciais. Sem escrever prompt — a IA aprende sozinha.",
      cor: "indigo",
    },
    {
      num: "03",
      titulo: "IA atende com as suas regras",
      desc: "Sua IA responde clientes com o tom e as regras que você definiu — não um script engessado, mas uma assistente inteligente.",
      cor: "violet",
    },
    {
      num: "04",
      titulo: "Qualifica, agenda ou vende",
      desc: "A IA oferece produtos, agenda horários, gera links de pagamento e coleta dados de leads — tudo dentro da conversa.",
      cor: "blue",
    },
    {
      num: "05",
      titulo: "Time intervém quando faz sentido",
      desc: "Para exceções ou fechamentos estratégicos, o atendente assume com todo o histórico na tela.",
      cor: "indigo",
    },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Mecanismo
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Do zero ao atendimento com IA configurada para você
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ensine sua IA em minutos. Ela atende, agenda e vende com as regras do seu negócio — sem script engessado, sem depender de equipe técnica.
          </p>
        </div>

        <div className="relative">
          {/* Linha conectora (desktop) */}
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {etapas.map((e, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                {/* Número */}
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-blue-100 flex flex-col items-center justify-center mb-5 shadow-sm group-hover:border-blue-300 group-hover:shadow-md transition-all duration-300">
                  <span className="text-xs font-bold text-blue-400 tracking-widest">{e.num}</span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-2 leading-snug">{e.titulo}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA inline */}
        <div className="text-center mt-14 flex flex-col items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-base font-bold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            Configurar minha IA agora
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href={WHATSAPP_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#25D366] transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
            </svg>
            Ou teste a IA agora no WhatsApp — sem cadastro
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Capacidades ──────────────────────────────────────────────────────────────

function CapacidadesSection() {
  const features = [
    {
      icon: "💬",
      title: "Omnichannel Centralizado",
      description:
        "WhatsApp Oficial, Instagram (Comentários e DMs) e Facebook Messenger em uma única caixa de entrada. Sem perder nenhuma mensagem.",
    },
    {
      icon: "📅",
      title: "Agendamentos Automatizados",
      description:
        "A IA consulta a agenda disponível, bloqueia o horário, envia confirmação e lembra o cliente automaticamente. Sem planilha, sem erro.",
    },
    {
      icon: "🛒",
      title: "Catálogo, Pedidos e Pagamentos",
      description:
        "Cadastre produtos com preço e estoque. A IA oferece, gera pedido e envia link de pagamento via Stripe ou Asaas — tudo dentro da conversa.",
    },
    {
      icon: "🧠",
      title: "IA com Personalidade do Seu Negócio",
      description:
        "Configure tom de voz, regras, FAQs e limitações. A IA respeita o que você definir e nunca inventa informações que não existem no sistema.",
    },
    {
      icon: "📊",
      title: "CRM, Pipeline e Métricas",
      description:
        "Acompanhe oportunidades, taxa de resposta, funil de vendas e agendamentos. Tenha visibilidade real sobre o que acontece no atendimento.",
    },
    {
      icon: "⚙️",
      title: "Automações e Gatilhos",
      description:
        "Respostas por palavra-chave, mensagens de ausência, templates aprovados pela Meta e envios em lote para sua base de contatos.",
    },
  ];

  return (
    <section id="recursos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Plataforma
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Tudo que sua operação precisa, em um lugar só
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Substitua CRM separado, chatbot genérico e planilha de agendamentos por uma plataforma integrada e treinada para o seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Casos de Uso ─────────────────────────────────────────────────────────────

function CasosDeUsoSection() {
  const casos = [
    {
      segmento: "Comércio e E-commerce",
      icone: "🛍️",
      descricao:
        "Clientes perguntam sobre produto no WhatsApp, a IA apresenta o catálogo, responde dúvidas de preço e estoque e gera o link de pagamento na mesma conversa. Seu time só aparece para confirmar pedidos grandes.",
      beneficios: ["Checkout direto no WhatsApp", "Catálogo com preço e estoque", "Pedidos rastreados automaticamente"],
    },
    {
      segmento: "Clínicas, Salões e Serviços",
      icone: "📅",
      descricao:
        "O cliente pede para agendar pelo WhatsApp, a IA verifica os horários disponíveis, bloqueia a agenda do profissional certo e envia confirmação com lembretes automáticos 24h e 2h antes.",
      beneficios: ["Agenda integrada por profissional", "Confirmações e lembretes automáticos", "Cancelamentos e reagendamentos via chat"],
    },
    {
      segmento: "Prestadores de Serviço e B2B",
      icone: "🤝",
      descricao:
        "A IA qualifica o lead, coleta informações do projeto, responde dúvidas técnicas dentro dos limites que você definiu e sinaliza quando o caso deve ser encaminhado para um consultor.",
      beneficios: ["Qualificação automática de leads", "Perguntas técnicas respondidas pela IA", "Handoff configurável para o time"],
    },
  ];

  return (
    <section className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Aplicações
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Para negócios que não podem depender de atendimento lento
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A Variaty se adapta ao modelo de negócio — não ao contrário.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {casos.map((caso, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col hover:shadow-xl hover:shadow-gray-100/80 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-4 w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                {caso.icone}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">{caso.segmento}</h3>
              <p className="text-gray-600 leading-relaxed font-medium mb-6 flex-1">{caso.descricao}</p>
              <ul className="space-y-2">
                {caso.beneficios.map((b, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Ativação (Onboarding) ────────────────────────────────────────────────────

function AtivacaoSection() {
  const steps = [
    {
      num: "1",
      titulo: "Conecte seus canais",
      desc: "Vincule o WhatsApp Business Oficial, Instagram e Facebook com autenticação Meta — em até 2 cliques.",
    },
    {
      num: "2",
      titulo: "Ensine sua IA com chat guiado",
      desc: "Responda perguntas simples: tom de voz, o que você oferece, como tratar preços e horários. Sem escrever prompt — a IA monta a configuração por você.",
    },
    {
      num: "3",
      titulo: "Ative o atendimento",
      desc: "Sua IA começa a responder clientes com as regras do seu negócio imediatamente — sem script rígido, com inteligência real.",
    },
    {
      num: "4",
      titulo: "Acompanhe e refine",
      desc: "Veja conversas em tempo real, ajuste o comportamento da IA quando quiser e intervenha nos casos que precisam de atenção humana.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Ativação
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Sua IA configurada e operando em minutos
          </h2>
          <p className="text-lg text-gray-600">
            Self-service, sem prompt manual, sem equipe técnica. Sua IA aprende o seu negócio pelo chat guiado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative p-7 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white text-xl font-bold flex items-center justify-center mb-6 shadow-md shadow-blue-500/30">
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.titulo}</h3>
              <p className="text-gray-600 font-medium text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Preços ───────────────────────────────────────────────────────────────────

function PrecosSection() {
  const planos = [
    {
      nome: "Gratuito",
      slug: "free",
      preco: null,
      descricao: "Para explorar a interface sem compromisso",
      nota: "Sem acesso ao WhatsApp Oficial",
      trial: false,
      features: [
        "Instagram DM (sem WhatsApp Oficial)",
        "Até 1.000 contatos no CRM",
        "500 mensagens de IA por mês",
        "Até 5 automações básicas",
        "Suporte via documentação",
      ],
      ausentes: [
        "WhatsApp Oficial API",
        "Agendamentos automáticos",
        "Pedidos, cobranças e pagamentos",
      ],
      botaoTexto: "Explorar sem compromisso",
      botaoEstilo: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
      popular: false,
      href: "/register?plan=free",
    },
    {
      nome: "Essencial",
      slug: "standard",
      preco: "49,90",
      descricao: "O plano completo para operar no WhatsApp com IA",
      nota: "7 dias grátis · sem cartão",
      trial: true,
      features: [
        "WhatsApp Oficial API ativada",
        "Atendimento automático 24h no WhatsApp",
        "Até 5.000 contatos com histórico completo",
        "3.000 respostas de IA por mês",
        "Agendamentos automáticos pelo WhatsApp",
        "Catálogo de produtos, pedidos e cobranças",
        "Caixa de entrada: WhatsApp + Instagram + Facebook",
      ],
      ausentes: [],
      botaoTexto: "Começar 7 dias grátis",
      botaoEstilo: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25",
      popular: true,
      href: "/register?plan=standard",
    },
    {
      nome: "Crescimento",
      slug: "pro",
      preco: "97,00",
      descricao: "Para operações que precisam de escala e controle total",
      nota: null,
      trial: false,
      features: [
        "Tudo do Essencial",
        "Até 20.000 contatos",
        "10.000 respostas de IA por mês",
        "Agendamentos por profissional com lembretes",
        "Pagamentos integrados (Stripe e Asaas)",
        "Atendentes ilimitados",
        "Automações avançadas e escalação configurável",
        "Analytics, funil de vendas e atribuição de leads",
      ],
      ausentes: ["Painel white-label"],
      botaoTexto: "Assinar Crescimento",
      botaoEstilo: "bg-gray-900 text-white hover:bg-gray-800",
      popular: false,
      href: "/register?plan=pro",
    },
    {
      nome: "Negócio",
      slug: "business",
      preco: "197,00",
      descricao: "Para agências, franquias e grandes operações",
      nota: null,
      trial: false,
      features: [
        "Tudo do Crescimento",
        "Contatos e mensagens sem limite",
        "White-label com a sua marca",
        "Painel de gestão de múltiplas contas",
        "Consultor de sucesso dedicado",
        "Suporte com SLA garantido",
      ],
      ausentes: [],
      botaoTexto: "Falar com consultor",
      botaoEstilo: "bg-gray-900 text-white hover:bg-gray-800",
      popular: false,
      href: "mailto:vtvariaty@gmail.com",
    },
  ];

  return (
    <section id="planos" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Planos
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Invista em atendimento. Reduza custo operacional.
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            A automação se paga nos primeiros dias. Sem contratos longos, sem taxas ocultas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {planos.map((plano, i) => (
            <div
              key={i}
              className={`bg-white rounded-3xl p-8 flex flex-col relative transition-all duration-300 ${
                plano.popular
                  ? "border-2 border-blue-600 shadow-2xl shadow-blue-900/10 lg:-mt-3 lg:-mb-3 z-10"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              {plano.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-5 rounded-full whitespace-nowrap shadow-md shadow-blue-500/30">
                  Mais escolhido
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plano.nome}</h3>
                <p className={`text-sm ${plano.popular ? "text-blue-700 font-semibold" : "text-gray-500"}`}>
                  {plano.descricao}
                </p>
              </div>

              <div className="mb-8">
                {plano.preco === null ? (
                  <div>
                    <span className="text-4xl font-extrabold text-gray-400">Grátis</span>
                    <p className="text-xs text-red-500 font-semibold mt-1">Sem acesso ao WhatsApp Oficial</p>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-400">R$</span>
                    <span className="text-4xl font-extrabold text-gray-900">{plano.preco}</span>
                    <span className="text-gray-500 font-medium text-sm">/mês</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  {plano.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 font-medium text-sm leading-snug">{feature}</span>
                    </li>
                  ))}
                  {plano.ausentes.map((feature, j) => (
                    <li key={`a-${j}`} className="flex items-start gap-2.5 opacity-40">
                      <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      <span className="text-gray-500 font-medium text-sm leading-snug line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plano.href}
                className={`w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${plano.botaoEstilo}`}
              >
                {plano.botaoTexto}
              </Link>
              {plano.nota && (
                <p className={`text-center text-xs font-semibold mt-3 ${plano.popular ? "text-green-600" : "text-gray-400"}`}>
                  {plano.nota}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8 font-medium">
          Todos os planos pagos incluem 7 dias de teste. Cancele antes sem cobrança.
        </p>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQSection() {
  const faqs = [
    {
      q: "Qual a diferença para um chatbot genérico com respostas fixas?",
      a: "A Variaty usa modelos de linguagem avançados (como GPT) que entendem contexto e intenção — não árvores de decisão fixas. Você configura as regras e a IA responde com naturalidade dentro dos limites que você definiu. Sem respostas robotizadas, sem loops infinitos.",
    },
    {
      q: "Preciso de um número de WhatsApp específico ou posso usar o meu atual?",
      a: "Você pode usar seu número atual (desde que não esteja sendo usado no aplicativo do celular) ou criar um número novo. A conexão é feita via API Oficial da Meta — o processo mais seguro, sem risco de banimento.",
    },
    {
      q: "A IA pode entender a agenda dos meus profissionais e bloquear horários?",
      a: "Sim. No módulo de agendamentos, você vincula profissionais aos serviços e configura horários disponíveis. A IA só oferece os slots realmente livres, bloqueia o horário automaticamente e envia confirmação com lembretes programados.",
    },
    {
      q: "Como funciona o pagamento dentro do WhatsApp?",
      a: "A IA gera um link de pagamento via Stripe ou Asaas (Pix, cartão, boleto) e envia na conversa. Quando o cliente paga, o sistema atualiza o status do pedido automaticamente e o painel registra a conversão.",
    },
    {
      q: "Minha equipe pode intervir nas conversas quando quiser?",
      a: "Sim, a qualquer momento. O modo humano pausa a IA para aquela conversa específica. Quando o atendimento manual terminar, você reativa a IA com um clique. O histórico completo fica visível para o atendente.",
    },
    {
      q: "O que acontece se a IA não souber responder algo?",
      a: "Você configura como a IA deve se comportar nesses casos: encaminhar para o time, informar que um atendente entrará em contato, ou simplesmente indicar os limites do atendimento. O sistema não inventa respostas fora do que foi configurado.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* FAQ Area */}
          <div className="flex-1">
            <div className="mb-12 text-left">
              <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
                Dúvidas
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Perguntas frequentes</h2>
              <p className="text-lg text-gray-600">
                Tudo que você precisa saber antes de começar.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-base text-gray-900 hover:text-blue-600 transition-colors">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-45 transition-transform text-2xl flex-shrink-0 ml-4">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed font-medium -mt-2 text-sm">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Fale Conosco Side Panel */}
          <div className="lg:w-96" id="contato">
            <div className="sticky top-32 bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl shadow-gray-900/20 text-white">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-extrabold mb-3">Fale conosco</h3>
              <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                Ainda tem dúvidas ou prefere falar com um humano? Nossa equipe comercial está pronta para entender o seu negócio.
              </p>
              
              <div className="space-y-8">
                {/* WhatsApp */}
                <div className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 border border-[#25D366]/20 transition-all group-hover:bg-[#25D366] group-hover:text-white">
                    <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">WhatsApp</p>
                    <a href="https://wa.me/5519995993220" target="_blank" rel="noopener noreferrer" className="text-gray-100 font-extrabold text-lg transition-colors group-hover:text-[#25D366]">
                      (19) 99599-3220
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20 transition-all group-hover:bg-blue-500 group-hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">E-mail Comercial</p>
                    <a href="mailto:comercial@vtvariatysecretary.com.br" className="text-gray-100 font-bold transition-colors group-hover:text-blue-400 break-all">
                      comercial@vtvariatysecretary.com.br
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────

function CTAFinalSection() {
  return (
    <section className="py-24 bg-[#080d19] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-5">
          Comece hoje
        </p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1]">
          Seu atendimento trabalhando
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            enquanto você faz o que importa.
          </span>
        </h2>
        <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Configure sua IA em minutos, conecte seu WhatsApp e veja o atendimento funcionando. Sem contratos. Sem complicação.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold bg-blue-600 text-white px-10 py-5 rounded-xl hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1"
          >
            Criar conta grátis
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href="mailto:vtvariaty@gmail.com"
            className="w-full sm:w-auto inline-flex items-center justify-center text-base font-bold text-slate-300 border border-slate-600 px-8 py-5 rounded-xl hover:border-slate-400 hover:text-white transition-all"
          >
            Falar com consultor
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-500 font-medium">
          Sem cartão de crédito · Setup em minutos · Suporte ativo
        </p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#050810] text-slate-400 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <img src="/logo.webp" alt="Variaty" className="h-16 w-auto grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all" />
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm text-sm font-medium">
              Plataforma de atendimento com IA para WhatsApp, Instagram e Facebook. Conectada à API Oficial da Meta. Desenvolvida para operações reais de atendimento e vendas.
            </p>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Produto</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#solucao" className="hover:text-blue-500 transition-colors">A Solução</a></li>
              <li><a href="#como-funciona" className="hover:text-blue-500 transition-colors">Como Funciona</a></li>
              <li><a href="#planos" className="hover:text-blue-500 transition-colors">Planos e Preços</a></li>
              <li><Link href="/login" className="hover:text-blue-500 transition-colors">Entrar no Painel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold mb-6 tracking-wide">Empresa</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="mailto:vtvariaty@gmail.com" className="hover:text-blue-500 transition-colors">Falar com a equipe</a></li>
              <li><Link href="/privacy" className="hover:text-blue-500 transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/terms" className="hover:text-blue-500 transition-colors">Termos de Serviço</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Variaty. Todos os direitos reservados.</p>
            <p className="text-xs text-slate-600 font-medium">
              Contamei Tecnologia e Sistemas Digitais LTDA — CNPJ 64.790.325/0001-06 — Celular: (16) 99436-7481
            </p>
          </div>
          <p className="text-xs text-slate-600 font-medium tracking-wide">
            Parceiro Oficial de Negócios · Meta Business Partner
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="bg-white min-h-screen selection:bg-blue-200 selection:text-blue-900 font-sans">
      <MetaPixel />
      <Navbar />
      <HeroSection />
      <IntegracoesStrip />
      <CredibilidadeStrip />
      <SolucaoSection />
      <ComoFuncionaSection />
      <CapacidadesSection />
      <CasosDeUsoSection />
      <AtivacaoSection />
      <PrecosSection />
      <FAQSection />
      <CTAFinalSection />
      <Footer />
    </main>
  );
}
