import Link from "next/link";

export function PricingTeaserSection() {
  const plans = [
    {
      name: "Free",
      label: "Entrada",
      price: "R$ 0",
      period: "/mês",
      desc: "Comece sem pagar nada. Sinta a IA em ação antes de decidir.",
      cta: "Criar conta grátis",
      href: "/register",
      features: ["1 canal conectado", "IA básica", "Até 100 atendimentos/mês", "Dashboard de métricas"],
      highlight: false,
    },
    {
      name: "Pro",
      label: "Mais popular",
      promo: true,
      priceFull: "R$ 139,00",
      price: "R$ 49,90",
      period: "/mês",
      badge: "Preço promocional por tempo limitado",
      desc: "O plano ideal para quem quer crescer com IA sem travar no volume.",
      cta: "Começar no Pro",
      href: "/register",
      features: ["3 canais conectados", "IA avançada com personalidade", "Agendamentos automáticos", "CRM e pipeline", "Suporte prioritário"],
      highlight: true,
    },
    {
      name: "Business",
      label: "Consultivo",
      price: "Sob consulta",
      period: "",
      desc: "Alto volume, white-label ou integração especial? A gente desenha junto.",
      cta: "Falar com especialista",
      href: "https://wa.me/5519995993220?text=Quero%20conhecer%20o%20plano%20Business%20da%20Variaty",
      isExternal: true,
      features: ["Canais ilimitados", "White-label disponível", "Integração com CRMs externos", "Onboarding dedicado", "SLA garantido"],
      highlight: false,
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#f8fafc] border-t border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-100/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-100">
            Planos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-5">
            Comece grátis. Escale quando precisar.
          </h2>
          <p className="text-base md:text-lg text-slate-500 font-medium max-w-lg mx-auto">
            Três planos desenhados para onde você está agora — e para onde vai crescer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7 mb-10">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                plan.highlight
                  ? "bg-[#0f172a] border-indigo-600/60 shadow-[0_20px_60px_rgba(79,70,229,0.25)] ring-1 ring-indigo-500/40 scale-[1.02]"
                  : "bg-white border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.09)] hover:-translate-y-1"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold uppercase tracking-widest px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  ⭐ Mais popular
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-extrabold uppercase tracking-widest ${plan.highlight ? "text-indigo-400" : "text-slate-400"}`}>
                    {plan.label}
                  </span>
                  {plan.promo && (
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Promo
                    </span>
                  )}
                </div>
                <p className={`text-xl font-extrabold mb-1 ${plan.highlight ? "text-white" : "text-[#0f172a]"}`}>{plan.name}</p>
              </div>

              <div className="mb-6">
                {plan.priceFull && (
                  <p className="text-sm text-slate-500 line-through mb-1">{plan.priceFull}/mês</p>
                )}
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-black tracking-tight ${plan.highlight ? "text-white" : "text-[#0f172a]"}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm font-medium mb-1 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.period}</span>}
                </div>
                {plan.badge && (
                  <p className="text-xs text-orange-500 font-bold mt-2 uppercase tracking-wide">{plan.badge}</p>
                )}
              </div>

              <p className={`text-sm leading-relaxed mb-7 ${plan.highlight ? "text-slate-400" : "text-slate-500"}`}>{plan.desc}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className={`flex items-start gap-2.5 text-sm font-medium ${plan.highlight ? "text-slate-300" : "text-slate-600"}`}>
                    <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-indigo-400" : "text-indigo-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>

              {plan.isExternal ? (
                <a
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center w-full font-extrabold py-3.5 rounded-xl transition-all text-sm ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {plan.cta}
                </a>
              ) : (
                <Link
                  href={plan.href}
                  className={`block text-center w-full font-extrabold py-3.5 rounded-xl transition-all text-sm ${
                    plan.highlight
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/precos"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Ver todos os recursos e comparar planos →
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
