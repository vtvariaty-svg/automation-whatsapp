export function BeneficiosSection() {
  const features = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      title: "Responde antes do concorrente",
      description: "A IA entra em ação em segundos. Sem fila, sem silêncio, sem lead esfriando às 23h.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      ),
      title: "Time focado no que fecha",
      description: "Volume e triagem ficam com a IA. Seu time entra só onde precisa — nas negociações que valem.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      ),
      title: "Agenda que se preenche sozinha",
      description: "Oferta horários, confirma e manda lembrete. Zero intervenção manual para preencher sua semana.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      ),
      title: "Controle total, quando quiser",
      description: "A IA cuida do volume. Você assume a conversa com um clique e retorna com outro.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      ),
      title: "Nenhuma mensagem perdida",
      description: "WhatsApp, Instagram e Facebook em uma caixa unificada. Tudo centralizado, nada escapa.",
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      ),
      title: "Operação visível e previsível",
      description: "Dashboard com taxa de resposta, funil de vendas e qualificação. Você sabe exatamente o que está acontecendo.",
    },
  ];

  return (
    <section id="recursos" className="py-20 lg:py-28 bg-[#f8fafc] border-t border-slate-100 relative overflow-hidden">
      <div className="absolute -left-[300px] top-40 w-[700px] h-[700px] bg-indigo-100/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-indigo-200/50">
            O que muda
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-5 tracking-tight">
            Menos trabalho manual.
            <br className="hidden md:block" />{" "}
            <span className="text-indigo-600">Mais resultado.</span>
          </h2>
          <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto font-medium">
            A Variaty não substitui sua equipe. Ela tira o trabalho pesado do caminho para que seu time foque em fechar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/60 rounded-2xl p-7 hover:bg-[#0f172a] hover:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.18)] hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="text-indigo-600 mb-5 bg-indigo-50 group-hover:bg-slate-800 group-hover:text-indigo-400 w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-100/50 group-hover:border-slate-700 transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="text-base font-extrabold text-[#0f172a] group-hover:text-white mb-2.5 transition-colors duration-300">{feature.title}</h3>
              <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed font-medium text-sm transition-colors duration-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
