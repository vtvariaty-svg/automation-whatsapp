import Link from "next/link";
import { Navbar } from "@/components/marketing/landing/Navbar";
import { Footer } from "@/components/marketing/landing/Footer";
import MetaPixel from "@/components/marketing/MetaPixel";

export const metadata = {
  title: "WhatsApp com IA — Atenda, Agende e Venda Automaticamente | Variaty",
  description:
    "Transforme seu WhatsApp em uma operação comercial com IA. Responda mais rápido, qualifique leads e feche mais vendas — 24 horas por dia, sem aumentar o time.",
};

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20ver%20uma%20demonstra%C3%A7%C3%A3o%20da%20Variaty%20para%20WhatsApp.";

const WA_ICON = (
  <svg className="w-full h-full fill-[#25D366]" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" />
  </svg>
);

export default function WhatsAppPage() {
  const steps = [
    {
      num: "01",
      title: "Conecte seu número",
      impact: "Via API Oficial da Meta — sem risco de banimento",
      desc: "Seu WhatsApp atual ou um número novo. Verificado, seguro, pronto em minutos.",
    },
    {
      num: "02",
      title: "Configure sua IA",
      impact: "Seu tom, suas regras, zero código",
      desc: "Defina como a IA fala, o que pode responder e quais fluxos acionar. Simples como preencher um formulário.",
    },
    {
      num: "03",
      title: "Atenda, qualifique e venda",
      impact: "Operação rodando 24h, 7 dias por semana",
      desc: "A IA responde leads, agenda compromissos e qualifica oportunidades. Você acompanha no painel e intervém quando quiser.",
    },
  ];

  const benefits = [
    {
      icon: "⚡",
      title: "Responde antes do concorrente",
      desc: "A IA entra em ação em segundos. Sem fila, sem delay, sem lead esfriando enquanto você está em outra conversa.",
    },
    {
      icon: "📅",
      title: "Agenda que se preenche sozinha",
      desc: "Oferta horários, confirma e envia lembrete automático. Sua semana cheia sem você mover um dedo.",
    },
    {
      icon: "🎯",
      title: "Qualificação automática de leads",
      desc: "A IA identifica intenção, coleta dados e prioriza quem está pronto para comprar.",
    },
    {
      icon: "👤",
      title: "Controle humano total",
      desc: "Um clique pausa a IA. Você assume a conversa com histórico completo e retoma com outro clique.",
    },
    {
      icon: "📊",
      title: "Visibilidade da operação",
      desc: "Painel com taxa de resposta, funil de atendimento e volume diário em tempo real.",
    },
    {
      icon: "🔒",
      title: "API Oficial — zero risco",
      desc: "Conexão pelo canal corporativo homologado pelo WhatsApp. Sem apps paralelos, sem banimento.",
    },
  ];

  const useCases = [
    { emoji: "🏥", setor: "Clínicas e saúde", exemplo: "Agendamento de consultas automático via WhatsApp, com confirmação e lembrete." },
    { emoji: "🏠", setor: "Imobiliárias", exemplo: "IA qualifica leads de imóveis, agenda visitas e envia materiais do portfólio." },
    { emoji: "🛍️", setor: "E-commerce e varejo", exemplo: "Responde dúvidas, rastreia pedidos e ativa upsell sem operador." },
    { emoji: "📚", setor: "Educação e cursos", exemplo: "Captura leads de campanhas e converte em matrículas com fluxo automatizado." },
  ];

  return (
    <main className="bg-white min-h-screen selection:bg-indigo-200 selection:text-indigo-900 font-sans">
      <MetaPixel />
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-32 overflow-hidden bg-[#080d19]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_-10%,rgba(37,211,102,0.08),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Channel badge */}
          <div className="inline-flex items-center gap-2.5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-full px-5 py-2 mb-10">
            <span className="w-5 h-5">{WA_ICON}</span>
            <span className="text-sm font-bold text-[#25D366] uppercase tracking-widest">WhatsApp · API Oficial Meta</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            Seu WhatsApp vendendo{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] via-emerald-400 to-indigo-400">
              enquanto você dorme.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            IA + automação + controle humano para responder mais rápido, qualificar cada lead e fechar mais vendas — sem precisar aumentar o time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-[#25D366] text-white px-8 py-4 rounded-xl shadow-[0_0_35px_rgba(37,211,102,0.35)] hover:bg-emerald-400 transition-all hover:-translate-y-1"
            >
              Teste grátis com WhatsApp
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <a
              href={WHATSAPP_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-200 font-semibold transition-all backdrop-blur-sm hover:-translate-y-0.5 text-sm"
            >
              <span className="w-4 h-4">{WA_ICON}</span>
              Ver demonstração
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500 font-medium">
            {["Sem cartão de crédito", "Setup em minutos", "+5.000 empresas ativas"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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
            <span className="inline-block text-[#25D366] font-extrabold tracking-widest text-xs uppercase bg-emerald-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-emerald-100">Em 3 passos</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-5">
              Do zero ao primeiro atendimento{" "}
              <span className="text-[#25D366]">automático hoje.</span>
            </h2>
            <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto font-medium">Sem desenvolvedor. Você configura sozinho e a IA começa a trabalhar.</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="hidden lg:block absolute top-[3rem] left-[calc(16.66%+2.5rem)] right-[calc(16.66%+2.5rem)] h-[2px] bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-100" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="relative w-[4.5rem] h-[4.5rem] rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center mb-6 text-[#25D366] group-hover:-translate-y-2 group-hover:shadow-xl transition-all duration-500 z-10">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {i === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
                      {i === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
                      {i === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
                    </svg>
                    <div className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#0f172a] text-white font-extrabold text-xs rounded-full flex items-center justify-center shadow-md ring-2 ring-white">{s.num}</div>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0f172a] mb-1 group-hover:text-[#25D366] transition-colors">{s.title}</h3>
                  <p className="text-xs font-extrabold text-[#25D366]/80 uppercase tracking-widest mb-3">{s.impact}</p>
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
            <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-indigo-100">Resultados reais</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight mb-4">O que muda na sua operação</h2>
            <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">Menos trabalho manual. Mais velocidade. Mais vendas.</p>
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
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] mb-3">Quem já usa no WhatsApp</h2>
            <p className="text-base text-slate-500 font-medium">A Variaty funciona para qualquer negócio que usa WhatsApp para vender ou atender.</p>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(37,211,102,0.06),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Pronto para começar</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-[1.06] tracking-tight">
            Seu WhatsApp pode estar{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-indigo-400">
              vendendo hoje.
            </span>
          </h2>
          <p className="text-lg text-slate-400 font-medium mb-4">Configure sua IA, conecte seu número e veja a operação rodar — em minutos.</p>
          <p className="text-sm text-slate-500 font-semibold mb-10">Sem cartão de crédito · Sem contrato · Cancele quando quiser</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 text-base font-extrabold bg-[#25D366] text-white px-9 py-4 rounded-xl shadow-[0_0_35px_rgba(37,211,102,0.3)] hover:bg-emerald-400 transition-all hover:-translate-y-1">
              Começar grátis com WhatsApp
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <a href={WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl text-slate-200 font-semibold transition-all text-sm">
              <span className="w-4 h-4">{WA_ICON}</span>
              Ver demonstração
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
