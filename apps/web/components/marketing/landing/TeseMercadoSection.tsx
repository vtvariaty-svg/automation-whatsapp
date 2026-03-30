export function TeseMercadoSection() {
  const pontos = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      titulo: "Resposta imediata",
      desc: "Quem responde primeiro fecha mais. Sem IA, você sempre perde para quem tem.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      titulo: "Zero lead no limbo",
      desc: "Toda mensagem sem retorno é um lead perdido. A IA atende enquanto você está ocupado.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      titulo: "Agenda que se preenche sozinha",
      desc: "A IA oferece horários, confirma e envia lembrete. Sua agenda cheia sem você mover um dedo.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      titulo: "Time focado em fechar",
      desc: "Volume e triagem ficam com a IA. Seu time entra na conversa só quando vale a pena.",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-100/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-14 lg:mb-16">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-indigo-100">
            A realidade do mercado
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-5">
            Demorar para responder{" "}
            <span className="text-indigo-600">custa caro.</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Lead sem retorno esfria. Agenda vazia sangra. Equipe respondendo manualmente não escala. A Variaty entra como infraestrutura operacional do seu WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pontos.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shrink-0">
                {p.icon}
              </div>
              <h3 className="text-base font-extrabold text-[#0f172a] mb-2 group-hover:text-indigo-600 transition-colors leading-snug">{p.titulo}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
