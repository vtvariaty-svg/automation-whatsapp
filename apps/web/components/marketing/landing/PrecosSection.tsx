import Link from "next/link";
import { WHATSAPP_BUSINESS_URL } from "@/lib/config/plans";

const WA_DEMO = "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20ver%20uma%20demonstra%C3%A7%C3%A3o%20da%20Variaty.";

export function PrecosSection() {
  const planos = [
    {
      nome: "Gratuito",
      tag: "Comece sem riscos",
      preco: null,
      nota: "Sem cartão de crédito",
      desc: "Teste a plataforma e sinta a IA em ação. Sem compromisso.",
      features: [
        "1 canal conectado (Instagram DM)",
        "Até 200 conversas/mês",
        "500 mensagens de IA/mês",
        "Até 1.000 contatos no CRM",
        "Até 5 automações",
        "Suporte via documentação",
      ],
      ausentes: ["WhatsApp Oficial API", "Analytics Avançado", "Prospecção Ativa"],
      cta: "Criar conta grátis",
      href: "/register?plan=free",
      highlight: false,
      ctaClass: "bg-slate-100 text-[#0f172a] hover:bg-slate-200 border border-slate-200 font-bold",
    },
    {
      nome: "Pro",
      tag: "Mais popular",
      promo: true,
      preco: "49,90",
      precoAntigo: "139,00",
      nota: "Sem contrato · Cancele quando quiser",
      desc: "O plano completo para quem quer crescer sem travar no volume.",
      features: [
        "WhatsApp Oficial + Instagram + Facebook",
        "10.000 mensagens de IA/mês",
        "Até 20.000 contatos no CRM",
        "Agendamentos automáticos",
        "Respostas em comentários Instagram",
        "Analytics Avançado e AI Copilot",
        "Até 5 agentes na mesma operação",
      ],
      ausentes: ["Prospecção Ativa", "White-label"],
      cta: "Assinar agora",
      href: "/register?plan=pro",
      highlight: true,
      ctaClass: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 font-extrabold",
    },
    {
      nome: "Business",
      tag: "Consultivo",
      preco: "Sob consulta",
      nota: "Infraestrutura sob medida",
      desc: "Alto volume, white-label ou configuração especial? A gente desenha junto.",
      features: [
        "Tudo do Pro sem limites",
        "Mensagens e contatos ilimitados",
        "Prospecção Ativa (listas frias)",
        "White-label completo na sua marca",
        "Multi-contas (agências e franquias)",
        "Onboarding dedicado + SLA 1h",
        "IA personalizada exclusiva",
      ],
      ausentes: [],
      cta: "Falar com consultor",
      href: WHATSAPP_BUSINESS_URL,
      isExternal: true,
      highlight: false,
      ctaClass: "bg-[#0f172a] text-white hover:bg-slate-800 font-bold",
    },
  ];

  const faqs = [
    {
      q: "Posso mudar de plano a qualquer momento?",
      a: "Sim. Você faz upgrade ou downgrade quando quiser, sem burocracia.",
    },
    {
      q: "O plano Pro tem contrato de fidelidade?",
      a: "Não. É mensal, sem contrato. Cancele a qualquer momento.",
    },
    {
      q: "O que inclui o suporte do plano Business?",
      a: "Onboarding dedicado com nossa equipe e SLA de resposta de 1 hora.",
    },
    {
      q: "O plano Free tem limite de tempo?",
      a: "Não. Você pode usar gratuitamente pelo tempo que quiser.",
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero da página */}
      <section className="bg-[#080d19] pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(79,70,229,0.2),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Pro com 64% de desconto</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.06] mb-5">
            Comece grátis.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Escale quando precisar.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl mx-auto mb-8">
            Três planos desenhados para onde você está agora — e para onde vai crescer.
          </p>
          <p className="text-sm text-slate-500 font-semibold">
            Sem cartão de crédito · Sem contrato · Cancele quando quiser
          </p>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
          <img src="/landing-v4/backgrounds/wave-top.svg" alt="" className="w-full min-w-[1440px] h-[60px] md:h-[100px] object-cover object-bottom" />
        </div>
      </section>

      {/* Cards de Planos */}
      <section className="py-20 lg:py-28 bg-[#f8fafc] relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {planos.map((plano, i) => (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                  plano.highlight
                    ? "bg-[#0f172a] border border-indigo-600/50 shadow-[0_20px_60px_rgba(79,70,229,0.2)] ring-1 ring-indigo-500/30 lg:-mt-4 lg:-mb-4 z-10"
                    : "bg-white border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)]"
                }`}
              >
                {plano.promo && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap ring-2 ring-white">
                    🔥 Preço promocional por tempo limitado
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-extrabold uppercase tracking-widest ${plano.highlight ? "text-indigo-400" : "text-slate-400"}`}>
                      {plano.tag}
                    </span>
                  </div>
                  <h2 className={`text-2xl font-extrabold ${plano.highlight ? "text-white" : "text-[#0f172a]"}`}>{plano.nome}</h2>
                  <p className={`text-sm mt-1.5 font-medium leading-snug ${plano.highlight ? "text-slate-400" : "text-slate-500"}`}>{plano.desc}</p>
                </div>

                {/* Price */}
                <div className="mb-7">
                  {plano.preco === null ? (
                    <div>
                      <span className={`text-5xl font-black tracking-tight ${plano.highlight ? "text-white" : "text-[#0f172a]"}`}>Grátis</span>
                    </div>
                  ) : plano.preco === "Sob consulta" ? (
                    <div>
                      <span className={`text-3xl font-extrabold ${plano.highlight ? "text-white" : "text-[#0f172a]"}`}>Sob consulta</span>
                    </div>
                  ) : (
                    <div>
                      {plano.precoAntigo && (
                        <p className="text-sm text-slate-400 line-through mb-1">de R$ {plano.precoAntigo}/mês</p>
                      )}
                      <div className="flex items-end gap-1">
                        <span className={`text-lg font-bold ${plano.highlight ? "text-slate-400" : "text-slate-500"}`}>R$</span>
                        <span className={`text-5xl font-black tracking-tight ${plano.highlight ? "text-white" : "text-[#0f172a]"}`}>{plano.preco}</span>
                        <span className={`text-sm font-medium mb-1 ${plano.highlight ? "text-slate-400" : "text-slate-500"}`}>/mês</span>
                      </div>
                      {plano.precoAntigo && (
                        <p className="inline-block text-[11px] font-extrabold text-emerald-600 uppercase tracking-wide bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md mt-2">
                          Garanta agora — desconto por tempo limitado
                        </p>
                      )}
                    </div>
                  )}
                  <p className={`text-xs font-semibold mt-2 ${plano.highlight ? "text-slate-500" : "text-slate-400"}`}>{plano.nota}</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plano.features.map((f, fi) => (
                    <li key={fi} className={`flex items-start gap-2.5 text-sm font-medium ${plano.highlight ? "text-slate-300" : "text-slate-600"}`}>
                      <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plano.highlight ? "text-indigo-400" : "text-indigo-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                  {plano.ausentes.map((f, fi) => (
                    <li key={`a-${fi}`} className={`flex items-start gap-2.5 text-sm font-medium opacity-35 ${plano.highlight ? "text-slate-400" : "text-slate-500"}`}>
                      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                      <span className="line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plano.isExternal ? (
                  <a href={plano.href} target="_blank" rel="noopener noreferrer" className={`block text-center w-full py-3.5 rounded-xl text-sm transition-all ${plano.ctaClass}`}>
                    {plano.cta}
                  </a>
                ) : (
                  <Link href={plano.href} className={`block text-center w-full py-3.5 rounded-xl text-sm transition-all ${plano.ctaClass}`}>
                    {plano.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é cada plano */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] mb-3">Para quem é cada plano?</h2>
            <p className="text-base text-slate-500 font-medium">Escolha pelo seu momento, não pela complexidade da descrição.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                nome: "Gratuito",
                cor: "border-slate-200 bg-slate-50",
                icone: "🚀",
                perfeito: ["Autônomos que querem testar antes de investir", "Quem ainda está validando o modelo de atendimento", "Negócios no início com volume baixo"],
              },
              {
                nome: "Pro",
                cor: "border-indigo-200 bg-indigo-50",
                icone: "⚡",
                perfeito: ["Negócios com atendimento ativo no WhatsApp", "Equipes de 1 a 5 pessoas respondendo diariamente", "Quem quer IA + agendamento + controle humano"],
              },
              {
                nome: "Business",
                cor: "border-slate-200 bg-slate-50",
                icone: "🏢",
                perfeito: ["Agências que gerenciam múltiplos clientes", "Franquias e redes com alto volume", "Empresas que precisam de marca própria (white-label)"],
              },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border p-6 ${p.cor}`}>
                <div className="text-2xl mb-3">{p.icone}</div>
                <h3 className="font-extrabold text-[#0f172a] mb-4">{p.nome} é perfeito para:</h3>
                <ul className="space-y-2.5">
                  {p.perfeito.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ de planos */}
      <section className="py-16 lg:py-20 bg-[#f8fafc] border-t border-slate-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] mb-2">Dúvidas sobre os planos?</h2>
            <p className="text-base text-slate-500 font-medium">Respostas rápidas antes de decidir.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-200/60 overflow-hidden [&_summary::-webkit-details-marker]:hidden hover:border-indigo-200 transition-colors">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-bold text-sm text-[#0f172a] group-open:text-indigo-600 transition-colors">
                  {faq.q}
                  <span className="text-slate-300 group-open:rotate-45 transition-transform text-xl flex-shrink-0 ml-4 font-light">+</span>
                </summary>
                <div className="px-6 pb-4 text-slate-500 text-sm leading-relaxed font-medium -mt-1">{faq.a}</div>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Ainda tem dúvida?{" "}
              <a href={WA_DEMO} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">
                Fala com a gente no WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
