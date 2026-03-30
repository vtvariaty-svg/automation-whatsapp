export function TeseMercadoSection() {
  const pontos = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      titulo: "Resposta imediata",
      desc: "Quem responde primeiro fecha mais. A IA responde em segundos, 24h por dia.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      titulo: "Menos lead perdido",
      desc: "Sem silêncio no chat. Sem lead esfriando enquanto você dorme ou está em reunião.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      titulo: "Mais agendamentos",
      desc: "A IA bloqueia horários e confirma agendamentos sem interferência manual.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      titulo: "Mais produtividade",
      desc: "Sua equipe foca em vendas complexas. A IA resolve o volume operacional.",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-200/60 to-transparent" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-100">
            O mercado já decidiu
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight leading-tight mb-6">
            Seu cliente já está no WhatsApp.{" "}
            <span className="text-indigo-600">Sua operação precisa funcionar lá com velocidade.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">
            Quem demora para responder perde o lead, perde a agenda e perde a venda. A Variaty transforma o WhatsApp em um canal operacional de atendimento, qualificação e conversão.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pontos.map((p, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-7 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                {p.icon}
              </div>
              <h3 className="text-lg font-extrabold text-[#0f172a] mb-2 group-hover:text-indigo-600 transition-colors">{p.titulo}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
