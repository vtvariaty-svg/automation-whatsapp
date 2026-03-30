export function ObjecoesSection() {
  const objecoes = [
    {
      mito: "Preciso de uma equipe grande para responder tudo",
      realidade: "A IA assume o volume. Seu time foca nas negociações que realmente importam.",
    },
    {
      mito: "Setup técnico complexo para começar",
      realidade: "Sem código. Sem desenvolvedor. Você configura a IA como preenche um formulário.",
    },
    {
      mito: "Vou perder o controle das conversas",
      realidade: "O controle humano é total. Você interrompe, assume e reativa a IA com um clique.",
    },
    {
      mito: "Preciso de várias ferramentas diferentes",
      realidade: "Atendimento, agendamento, CRM e automações ficam em um único painel integrado.",
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 lg:mb-20">
          <span className="inline-block text-slate-500 font-extrabold tracking-widest text-xs uppercase bg-slate-100 px-3 py-1.5 rounded-md mb-6 ring-1 ring-slate-200">
            Sem complicação
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight mb-6">
            Sem complexidade desnecessária
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            As principais razões que impedem empresas de automatizar — e como a Variaty elimina cada uma delas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {objecoes.map((o, i) => (
            <div
              key={i}
              className="group relative bg-[#f8fafc] border border-slate-200/60 rounded-2xl p-7 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Before (myth) */}
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <p className="text-slate-400 text-sm font-medium line-through">{o.mito}</p>
              </div>

              {/* After (reality) */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5 group-hover:bg-indigo-600 transition-colors duration-300">
                  <svg className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-[#0f172a] text-base font-semibold leading-snug">{o.realidade}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
