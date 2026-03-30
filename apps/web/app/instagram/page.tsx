import Link from "next/link";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { Footer } from "@/components/marketing/landing/Footer";
import MetaPixel from "@/components/marketing/MetaPixel";

export const metadata = {
  title: "Instagram com IA — Responda DMs e Converta Seguidores em Clientes | Variaty",
  description:
    "Automatize o atendimento via Instagram DM e comentários com IA. Responda mais rápido, qualifique leads direto do Instagram e converta engajamento em vendas.",
};

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20ver%20uma%20demonstra%C3%A7%C3%A3o%20da%20Variaty%20para%20Instagram.";

const IG_SVG = (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
    <rect width="20" height="20" x="2" y="2" rx="5" stroke="url(#ig-p)" strokeWidth="2" />
    <circle cx="12" cy="12" r="4" stroke="url(#ig-p)" strokeWidth="2" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-p)" />
    <defs>
      <linearGradient id="ig-p" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316" />
        <stop offset="0.5" stopColor="#EC4899" />
        <stop offset="1" stopColor="#8B5CF6" />
      </linearGradient>
    </defs>
  </svg>
);

export default function InstagramPage() {
  const steps = [
    {
      num: "01",
      title: "Conecte sua conta do Instagram",
      impact: "Via API Oficial da Meta — seguro e verificado",
      desc: "Conecte sua conta em minutos. A IA passa a monitorar DMs e comentários automaticamente.",
    },
    {
      num: "02",
      title: "Configure as respostas e fluxos",
      impact: "Seu tom, seus produtos, zero código",
      desc: "Defina o que a IA faz com cada tipo de mensagem: DM, comentário, menção. Tudo em linguagem natural.",
    },
    {
      num: "03",
      title: "Engajamento vira oportunidade",
      impact: "Cada DM qualificado e respondido na hora",
      desc: "A IA captura, qualifica e converte leads que chegam pelo Instagram — enquanto você foca em criar conteúdo.",
    },
  ];

  const benefits = [
    {
      icon: "💬",
      title: "DMs respondidas na hora",
      desc: "A IA entra em cada conversa em segundos. O seguidor sente que sua marca está presente e disponível.",
    },
    {
      icon: "🗨️",
      title: "Comentários que geram vendas",
      desc: "A IA detecta intenção de compra em comentários e move a conversa para o DM — onde a venda acontece.",
    },
    {
      icon: "🎯",
      title: "Lead qualificado antes de você responder",
      desc: "A IA coleta nome, interesse e intenção. Quando você entrar na conversa, ela já está aquecida.",
    },
    {
      icon: "🔁",
      title: "Fluxos automáticos por campanha",
      desc: "Cada post, story ou ad pode ter um fluxo específico. Resposta automática alinhada com o contexto do conteúdo.",
    },
    {
      icon: "👁️",
      title: "Visibilidade total das conversas",
      desc: "Painel com todas as DMs organizadas, histórico completo e status de cada lead em tempo real.",
    },
    {
      icon: "🤝",
      title: "Controle humano com um clique",
      desc: "Assuma qualquer conversa quando quiser. A IA pausa, você entra, retoma quando terminar.",
    },
  ];

  const useCases = [
    { emoji: "👗", setor: "Moda e lifestyle", exemplo: "IA responde DMs de interesse em peças, envia tabela de preços e direciona para checkout." },
    { emoji: "🍽️", setor: "Restaurantes e gastronomia", exemplo: "Responde perguntas sobre cardápio, aceita reservas e envia confirmação automática." },
    { emoji: "💆", setor: "Beleza e estética", exemplo: "Captura leads de stories, agenda procedimentos e envia lembrete antes da sessão." },
    { emoji: "🎓", setor: "Infoprodutores e cursos", exemplo: "Qualifica seguidores interessados no curso e leva para checkout sem perder o lead no calor do momento." },
  ];

  return (
    <main className="bg-white min-h-screen selection:bg-pink-100 selection:text-pink-900 font-sans">
      <MetaPixel />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-32 overflow-hidden bg-[#080d19]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_-10%,rgba(236,72,153,0.08),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Channel badge */}
          <div className="inline-flex items-center gap-2.5 bg-pink-500/10 border border-pink-500/20 rounded-full px-5 py-2 mb-10">
            <span className="w-5 h-5">{IG_SVG}</span>
            <span className="text-sm font-bold text-pink-300 uppercase tracking-widest">Instagram · API Oficial Meta</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            Transforme cada DM em{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
              uma oportunidade de venda.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            A Variaty conecta IA ao seu Instagram para responder DMs, qualificar leads de comentários e converter seguidores em clientes — automaticamente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-8 py-4 rounded-xl shadow-[0_0_35px_rgba(236,72,153,0.3)] hover:opacity-90 transition-all hover:-translate-y-1"
            >
              Teste grátis com Instagram
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <a
              href={WHATSAPP_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-200 font-semibold transition-all backdrop-blur-sm hover:-translate-y-0.5 text-sm"
            >
              <span className="w-4 h-4">{IG_SVG}</span>
              Ver demonstração
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500 font-medium">
            {["Sem cartão de crédito", "Setup em minutos", "+5.000 empresas ativas"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <img src="/landing-v4/backgrounds/wave-top.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[100px] object-cover object-bottom" />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-pink-500 font-extrabold tracking-widest text-xs uppercase bg-pink-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-pink-100">Em 3 passos</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-5">
              Do seguidor ao cliente{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">de forma automática.</span>
            </h2>
            <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto font-medium">Sem desenvolvedor. Sem fluxograma complexo. A IA começa a trabalhar no mesmo dia.</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="hidden lg:block absolute top-[3rem] left-[calc(16.66%+2.5rem)] right-[calc(16.66%+2.5rem)] h-[2px] bg-gradient-to-r from-pink-100 via-pink-200 to-pink-100" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="relative w-[4.5rem] h-[4.5rem] rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center mb-6 group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-500 z-10 text-pink-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
                      {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
                      {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                    </svg>
                    <div className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#0f172a] text-white font-extrabold text-xs rounded-full flex items-center justify-center shadow-md ring-2 ring-white">{s.num}</div>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0f172a] mb-1 group-hover:text-pink-500 transition-colors">{s.title}</h3>
                  <p className="text-xs font-extrabold text-pink-500/80 uppercase tracking-widest mb-3">{s.impact}</p>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-[240px]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 text-base font-extrabold bg-blue-600 text-white px-9 py-4 rounded-xl shadow-[0_8px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all hover:-translate-y-1">
              Começar agora
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="py-20 lg:py-28 bg-[#f8fafc] border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-pink-500 font-extrabold tracking-widest text-xs uppercase bg-pink-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-pink-100">O que muda</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">Seu Instagram não é só vitrine. É canal de vendas.</h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">Cada DM, comentário e menção é uma oportunidade que a IA não deixa escapar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                <div className="text-2xl mb-4">{b.icon}</div>
                <h3 className="font-extrabold text-[#0f172a] mb-2 text-base">{b.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] mb-3">Quem usa no Instagram</h2>
            <p className="text-base text-slate-500 font-medium">Qualquer negócio que gera leads via Instagram pode automatizar com a Variaty.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {useCases.map((u, i) => (
              <div key={i} className="flex items-start gap-4 bg-[#f8fafc] rounded-2xl p-6 border border-slate-200/60">
                <span className="text-3xl shrink-0">{u.emoji}</span>
                <div>
                  <p className="font-extrabold text-[#0f172a] mb-1">{u.setor}</p>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{u.exemplo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative bg-[#080d19] py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(236,72,153,0.06),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" /></span>
            <span className="text-xs font-bold text-pink-300 uppercase tracking-widest">Pronto para começar</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-[1.06] tracking-tight">
            Seu Instagram pode estar{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
              convertendo agora.
            </span>
          </h2>
          <p className="text-lg text-slate-400 font-medium mb-4">Configure sua IA, conecte o Instagram e veja o engajamento virar cliente.</p>
          <p className="text-sm text-slate-500 font-semibold mb-10">Sem cartão de crédito · Sem contrato · Cancele quando quiser</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white px-9 py-4 rounded-xl shadow-[0_0_35px_rgba(236,72,153,0.3)] hover:opacity-90 transition-all hover:-translate-y-1">
              Começar grátis com Instagram
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <a href={WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-200 font-semibold transition-all text-sm">
              Ver demonstração
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
