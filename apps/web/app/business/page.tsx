import Link from "next/link";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { Footer } from "@/components/marketing/landing/Footer";
import MetaPixel from "@/components/marketing/MetaPixel";
import { WHATSAPP_BUSINESS_URL } from "@/lib/config/plans";

export const metadata = {
  title: "Business — Operação sob medida para o seu negócio | Variaty",
  description:
    "A Variaty Business é a camada consultiva para empresas que precisam de automação, integrações e fluxos adaptados à sua operação real. Orçamento personalizado e implementação sob medida.",
};

// ──────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────
const WA_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20ver%20uma%20demonstra%C3%A7%C3%A3o%20da%20Variaty.";

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────
export default function BusinessPage() {

  const deliverables = [
    { icon: "⚙️", title: "Implementação personalizada", desc: "Configuramos a plataforma conforme o modelo de negócio, os canais e os processos comerciais da sua empresa." },
    { icon: "🔗", title: "Integrações com plataformas de vendas", desc: "Conectamos a Variaty às ferramentas que você já usa — CRM, ERP, plataformas de e-commerce ou sistemas internos." },
    { icon: "🛒", title: "Integrações com APIs de marketplaces", desc: "Integração com marketplaces e sistemas de gestão de pedidos, conforme a necessidade operacional do cliente." },
    { icon: "🗂️", title: "Fluxos operacionais sob medida", desc: "Mapeamos e desenhamos automações que se encaixam exatamente no seu processo — sem adaptação forçada ao sistema." },
    { icon: "🎯", title: "Serviços de prospecção de clientes", desc: "Estruturamos fluxos de prospecção ativa, qualificação e abordagem comercial alinhados ao seu funil." },
    { icon: "🕐", title: "Suporte 24 horas", desc: "Atendimento prioritário e suporte contínuo para que a operação nunca pare." },
    { icon: "📈", title: "Acompanhamento mais próximo", desc: "Reuniões estratégicas, análise de resultados e ajustes recorrentes ao longo do projeto." },
    { icon: "🤖", title: "Automações avançadas", desc: "Fluxos mais complexos, sequências de follow-up e regras de IA personalizadas para o contexto da empresa." },
    { icon: "🧠", title: "Personalização da IA", desc: "Tom, personalidade, restrições e regras de resposta da IA configurados para refletir o posicionamento do seu negócio." },
    { icon: "🏢", title: "White-label disponível", desc: "Para agências e franquias: plataforma completa com a sua marca, identidade e painel de clientes." },
  ];

  const steps = [
    {
      num: "01",
      title: "Entendimento da operação",
      desc: "Mapeamos sua rotina, gargalos, canais, processos e objetivos comerciais para entender onde a Variaty pode encaixar com mais precisão.",
    },
    {
      num: "02",
      title: "Definição das funcionalidades e integrações",
      desc: "Estruturamos o que precisa ser conectado, automatizado e personalizado — sem impor o que não faz sentido para o seu contexto.",
    },
    {
      num: "03",
      title: "Proposta sob medida",
      desc: "O orçamento é montado conforme o escopo, integrações e nível de personalização necessários. Sem pacotes fechados.",
    },
    {
      num: "04",
      title: "Implementação alinhada ao seu negócio",
      desc: "A solução é desenhada para se encaixar de forma prática na operação da sua empresa — com acompanhamento real durante a implantação.",
    },
  ];

  const forWho = [
    "Operações com múltiplos canais de atendimento e venda",
    "Empresas com processos comerciais mais complexos",
    "Negócios que precisam conectar plataformas próprias ou ferramentas já utilizadas",
    "Operações com marketplaces, CRM, ERP ou fluxos específicos",
    "Empresas que exigem prospecção mais estruturada",
    "Times que precisam de suporte mais próximo e estratégico",
    "Agências que gerenciam múltiplas contas de clientes",
    "Franquias e redes com alto volume e operação distribuída",
  ];

  const notGeneric = [
    { isNot: true, text: "Não é só acesso à plataforma" },
    { isNot: true, text: "Não é pacote fechado sem flexibilidade" },
    { isNot: true, text: "Não é adaptação forçada ao sistema" },
    { isNot: false, text: "É uma solução consultiva e técnica" },
    { isNot: false, text: "É uma estrutura moldada ao seu processo" },
    { isNot: false, text: "É uma camada de integração, automação e acompanhamento mais profunda" },
  ];

  const integrations = [
    { icon: "🛍️", label: "Plataformas de vendas", desc: "Escolhidas pelo cliente conforme o ecossistema comercial" },
    { icon: "📦", label: "APIs de marketplaces", desc: "Integração com gestão de pedidos e catálogos" },
    { icon: "🖥️", label: "Sistemas internos", desc: "ERP, CRM e ferramentas proprietárias da empresa" },
    { icon: "🔄", label: "Fluxos específicos", desc: "Sequências e processos adaptados à rotina operacional" },
    { icon: "📋", label: "Processos comerciais", desc: "Funis, qualificação e abordagem sob medida" },
  ];

  const support = [
    { icon: "🕐", text: "Suporte 24 horas" },
    { icon: "🤝", text: "Acompanhamento mais próximo" },
    { icon: "🔭", text: "Visão mais estratégica" },
    { icon: "🔒", text: "Mais segurança operacional" },
    { icon: "📊", text: "Evolução conforme a necessidade do negócio" },
  ];

  return (
    <main className="bg-white min-h-screen selection:bg-indigo-200 selection:text-indigo-900 font-sans">
      <MetaPixel />
      <Navbar />

      {/* ── 1. HERO ──────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-28 lg:pt-44 lg:pb-36 overflow-hidden bg-[#080d19]">
        {/* Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_-10%,rgba(79,70,229,0.18),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        {/* Grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.12] pointer-events-none [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-5 py-2 mb-10">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <span className="text-sm font-bold text-indigo-300 uppercase tracking-widest">Solução consultiva e personalizada</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4rem] font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            Uma operação{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">
              sob medida
            </span>{" "}
            para o seu negócio
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            A Variaty Business é pensada para empresas que precisam de automação, integrações e fluxos adaptados à sua operação real — com desenho técnico e comercial conforme a necessidade do cliente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a
              href={WHATSAPP_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-white text-[#080d19] px-8 py-4 rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.12)] hover:bg-slate-100 transition-all hover:-translate-y-1"
            >
              Solicitar orçamento personalizado
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
            <a
              href={WA_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-200 font-semibold transition-all backdrop-blur-sm hover:-translate-y-0.5 text-sm"
            >
              Ver demonstração
            </a>
          </div>

          {/* Trust anchors */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium">
            {["Orçamento personalizado", "Sem pacote fechado", "Implementação técnica acompanhada"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckIcon className="w-3.5 h-3.5 text-indigo-400" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <img src="/landing-v4/backgrounds/wave-top.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[100px] object-cover object-bottom" />
        </div>
      </section>

      {/* ── 2. PARA QUEM ─────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-50/50 rounded-full blur-[80px] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            {/* Left */}
            <div>
              <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-100">
                Para quem é
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-5 leading-tight">
                Quando o padrão não é suficiente,{" "}
                <span className="text-indigo-600">o Business entra.</span>
              </h2>
              <p className="text-base text-slate-500 leading-relaxed font-medium max-w-md">
                O Business é ideal para empresas que precisam que a operação se encaixe no seu processo, canais, plataformas e modelo comercial — sem improviso e sem adaptação forçada.
              </p>
            </div>

            {/* Right — checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {forWho.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#f8fafc] rounded-xl p-4 border border-slate-200/60">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-indigo-600" />
                  </span>
                  <p className="text-sm font-semibold text-slate-700 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. O QUE ESTÁ INCLUÍDO ───────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#f8fafc] border-t border-slate-100 relative overflow-hidden">
        <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-indigo-100">
              O que está incluído
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">
              O que a Variaty Business entrega
            </h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">
              Mais do que acesso à plataforma, o Business entrega uma estrutura adaptada ao seu cenário real.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {deliverables.map((d, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="text-2xl mb-4">{d.icon}</div>
                <h3 className="font-extrabold text-[#0f172a] mb-2 text-sm group-hover:text-indigo-600 transition-colors">{d.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. COMO FUNCIONA O PROJETO ───────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-indigo-100">
              Processo de trabalho
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">
              Como funciona o projeto Business
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto font-medium">
              Um processo consultivo, do diagnóstico à implementação.
            </p>
          </div>

          <div className="relative">
            {/* Vertical connector (desktop) */}
            <div className="hidden lg:block absolute left-[2.25rem] top-[3.5rem] bottom-[3.5rem] w-[2px] bg-gradient-to-b from-indigo-200 via-indigo-300 to-indigo-200" />

            <div className="flex flex-col gap-6 lg:gap-5">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-6 lg:gap-8 items-start group">
                  {/* Step number circle */}
                  <div className="shrink-0 w-[4.5rem] h-[4.5rem] rounded-2xl bg-white border border-indigo-100 shadow-md flex flex-col items-center justify-center relative z-10 group-hover:border-indigo-300 group-hover:shadow-indigo-100/60 transition-all duration-300">
                    <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest leading-none">{s.num}</span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 bg-[#f8fafc] rounded-2xl border border-slate-200/60 p-6 group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all duration-300">
                    <h3 className="text-base font-extrabold text-[#0f172a] mb-2 group-hover:text-indigo-700 transition-colors">{s.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <a
              href={WHATSAPP_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-base font-extrabold bg-indigo-600 text-white px-9 py-4 rounded-xl shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all hover:-translate-y-1"
            >
              Solicitar orçamento personalizado
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── 5. NÃO É GENÉRICO ────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#080d19] relative overflow-hidden">
        {/* Wave top */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden pointer-events-none rotate-180">
          <img src="/landing-v4/backgrounds/wave-mid.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[80px] object-cover object-top" />
        </div>
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-10">
          <div className="text-center mb-14">
            <span className="inline-block text-indigo-300 font-extrabold tracking-widest text-xs uppercase bg-white/5 border border-white/10 px-3 py-1.5 rounded-md mb-5">
              Diferencial
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight max-w-2xl mx-auto">
              Não é um plano genérico.{" "}
              <span className="text-indigo-400">É uma operação desenhada para a sua realidade.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notGeneric.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-4 rounded-2xl px-6 py-5 border ${
                  item.isNot
                    ? "bg-white/[0.02] border-slate-700/40 opacity-70"
                    : "bg-indigo-500/10 border-indigo-500/30"
                }`}
              >
                <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${item.isNot ? "bg-slate-700/50" : "bg-indigo-500/20"}`}>
                  {item.isNot
                    ? <XIcon className="w-4 h-4 text-slate-500" />
                    : <CheckIcon className="w-4 h-4 text-indigo-400" />
                  }
                </span>
                <p className={`text-sm font-semibold leading-snug ${item.isNot ? "text-slate-500 line-through" : "text-slate-200"}`}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <img src="/landing-v4/backgrounds/wave-mid.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[80px] object-cover object-bottom" />
        </div>
      </section>

      {/* ── 6. INTEGRAÇÕES ───────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {/* Left copy */}
            <div>
              <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-100">
                Integrações
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-5 leading-tight">
                Integrações feitas para o seu ecossistema comercial
              </h2>
              <p className="text-base text-slate-500 leading-relaxed font-medium mb-8">
                A Variaty Business pode se conectar às plataformas de vendas, sistemas internos, APIs de marketplaces e fluxos operacionais que fazem sentido para o seu negócio — sem obrigar sua empresa a mudar tudo para caber em uma ferramenta.
              </p>
              <a
                href={WHATSAPP_BUSINESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-extrabold bg-indigo-600 text-white px-7 py-3.5 rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:bg-indigo-500 transition-all hover:-translate-y-0.5"
              >
                Falar sobre integrações
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
            </div>

            {/* Right — integration cards */}
            <div className="grid grid-cols-1 gap-3">
              {integrations.map((integ, i) => (
                <div key={i} className="flex items-center gap-4 bg-[#f8fafc] rounded-xl border border-slate-200/60 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                  <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shrink-0 shadow-sm">{integ.icon}</span>
                  <div>
                    <p className="font-extrabold text-[#0f172a] text-sm">{integ.label}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{integ.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. SUPORTE e OPERAÇÃO ────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-[#f8fafc] border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#080d19] rounded-[2rem] p-10 md:p-14 border border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.35)] relative overflow-hidden">
            {/* Glows */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-[60px] mix-blend-screen pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-block text-indigo-300 font-extrabold tracking-widest text-xs uppercase bg-white/5 border border-white/10 px-3 py-1.5 rounded-md mb-6">
                  Suporte e acompanhamento
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                  Suporte mais próximo para operações mais exigentes
                </h2>
                <p className="text-base text-slate-400 leading-relaxed font-medium">
                  No Business, sua operação conta com uma camada mais próxima de suporte, acompanhamento e evolução contínua — para que a solução funcione de forma consistente no contexto real da empresa.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {support.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5">
                    <span className="text-xl">{s.icon}</span>
                    <p className="font-semibold text-slate-200 text-sm">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. ORÇAMENTO PERSONALIZADO ───────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-100">
            Orçamento
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-5">
            Orçamento definido conforme o que sua operação precisa
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-5 max-w-2xl mx-auto">
            O valor do Business não é fixo, porque o escopo depende das funcionalidades, integrações, fluxos e nível de personalização necessários para a sua empresa.
          </p>
          <p className="text-base text-slate-400 font-medium leading-relaxed max-w-xl mx-auto mb-10">
            Nosso objetivo é desenhar uma proposta que se encaixe perfeitamente no modelo de negócio do cliente — sem excesso e sem falta de estrutura.
          </p>

          {/* Pricing cues */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 bg-[#f8fafc] border border-slate-200 rounded-2xl px-8 py-6 mb-12">
            <div className="text-center">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Modelo</p>
              <p className="text-xl font-extrabold text-[#0f172a]">Consultivo</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Escopo</p>
              <p className="text-xl font-extrabold text-[#0f172a]">Sob medida</p>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-200" />
            <div className="text-center">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Contrato</p>
              <p className="text-xl font-extrabold text-[#0f172a]">Conforme proposta</p>
            </div>
          </div>

          <a
            href={WHATSAPP_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-base font-extrabold bg-indigo-600 text-white px-10 py-4.5 rounded-xl shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all hover:-translate-y-1 py-[1.125rem]"
          >
            Solicitar orçamento personalizado
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
        </div>
      </section>

      {/* ── 9. CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="relative bg-[#080d19] overflow-hidden pt-28 pb-40">
        {/* Wave top */}
        <div className="absolute top-0 left-0 right-0 overflow-hidden pointer-events-none rotate-180">
          <img src="/landing-v4/backgrounds/wave-mid.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[120px] object-cover object-top" />
        </div>
        {/* Atmosphere */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        <div className="relative max-w-2xl mx-auto px-4 text-center z-10 pt-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-10">
            <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Solução consultiva Business</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-[1.06] tracking-tight">
            Fale com a Variaty e desenhe uma operação{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">
              realmente adaptada ao seu negócio.
            </span>
          </h2>

          <p className="text-lg text-slate-400 font-medium mb-4 max-w-xl mx-auto leading-relaxed">
            Explique seu cenário, suas necessidades e os canais que fazem parte da sua operação. A partir disso, montamos a proposta ideal para o seu contexto.
          </p>

          <p className="text-sm text-slate-500 font-semibold mb-10">
            Sem pacote fechado · Proposta sob medida · Implementação acompanhada
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WHATSAPP_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-3 text-base font-extrabold bg-white text-[#080d19] px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.10)] hover:bg-slate-100 transition-all hover:-translate-y-1 group"
            >
              Solicitar orçamento personalizado
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            <a
              href={WA_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-5 rounded-2xl text-slate-300 font-semibold transition-all text-sm"
            >
              Ver demonstração
            </a>
          </div>
        </div>

        {/* Wave bottom → Footer */}
        <div className="absolute bottom-[-1px] left-0 right-0 overflow-hidden pointer-events-none">
          <img src="/landing-v4/backgrounds/wave-bottom.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[120px] object-cover object-bottom" />
        </div>
      </section>

      <Footer />
    </main>
  );
}
