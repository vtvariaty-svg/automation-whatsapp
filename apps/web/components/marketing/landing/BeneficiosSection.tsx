export function BeneficiosSection() {
  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      title: "Atendimento 24/7",
      description: "A IA responde instantaneamente a qualquer hora. Sem fila, sem silêncio, sem lead esfriando.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      ),
      title: "Mais produtividade",
      description: "Seu time foca em negociações complexas. O volume repetitivo fica com a IA.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      ),
      title: "Mais agendamentos e conversões",
      description: "A IA oferta, negocia, bloqueia agenda e envia confirmação — tudo sem intervenção manual.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      ),
      title: "Controle humano",
      description: "Intervenha a qualquer momento. A IA pausa, o humano assume, e você retoma com um clique.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      ),
      title: "Menos gargalo operacional",
      description: "WhatsApp, Instagram e Facebook em uma caixa unificada. Mensagem nenhuma se perde.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      title: "Operação previsível",
      description: "Dashboard com métricas reais: taxa de resposta, funil de vendas e qualificação de leads.",
    },
  ];

  return (
    <section id="recursos" className="py-24 lg:py-32 bg-[#f8fafc] border-t border-slate-100 relative overflow-hidden">
      <div className="absolute -left-[400px] top-40 w-[900px] h-[900px] bg-indigo-100/30 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-200/50">
            Resultados de negócio
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f172a] mb-6 tracking-tight">
            O que muda na sua operação
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Não é sobre tecnologia. É sobre o que acontece com o seu negócio quando a operação para de depender do esforço manual.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/60 rounded-2xl p-8 hover:bg-[#0f172a] hover:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.18)] hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="text-indigo-600 mb-6 bg-indigo-50 group-hover:bg-slate-800 group-hover:text-indigo-400 w-14 h-14 rounded-xl flex items-center justify-center border border-indigo-100/50 group-hover:border-slate-700 transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-lg font-extrabold text-[#0f172a] group-hover:text-white mb-3 transition-colors duration-300">{feature.title}</h3>
              <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed font-medium text-sm transition-colors duration-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
