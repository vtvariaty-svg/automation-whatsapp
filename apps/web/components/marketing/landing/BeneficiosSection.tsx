export function BeneficiosSection() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      ),
      title: "Omnichannel Centralizado",
      description:
        "WhatsApp Oficial, Instagram (DMs) e Facebook Messenger em uma única caixa de entrada. Sem perder NENHUMA mensagem.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
      ),
      title: "Agendamentos Autônomos",
      description:
        "A IA consulta a agenda, bloqueia o horário, envia confirmação e lembra o prospect. Completamente automático.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      ),
      title: "Vendas e Catálogo no Chat",
      description:
        "A IA oferece produtos e gera o link de pagamento integrando com Stripe ou Asaas diretamente na conversa do cliente.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
      ),
      title: "IA com sua Personalidade",
      description:
        "Tom de voz, FAQs e limitações personalizadas. A inteligência artificial blinda sua operação contra alucinações.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
      ),
      title: "CRM, Pipeline e Métricas",
      description:
        "Acompanhe oportunidades, taxa de conversão, funil de vendas e qualificação. Visibilidade total do atendimento.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
      ),
      title: "Automações e Gatilhos",
      description:
        "Respostas por palavra-chave e fluxo ativo com envio de mensagens de disparo. Acorde contatos inativos instantaneamente.",
    },
  ];

  return (
    <section id="recursos" className="py-24 lg:py-32 bg-[#f8fafc] border-t border-slate-100 relative overflow-hidden">
      <div className="absolute -left-[500px] top-40 w-[1000px] h-[1000px] bg-indigo-100/40 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-200/50">
            Arquitetura de Vendas
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-extrabold text-[#0f172a] mb-6 tracking-tight">
            Ferramentas premium para <br className="hidden md:block"/> Operações que escalam
          </h2>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            Substitua CRM improvisado e dezenas de sessões web por uma plataforma verdadeiramente centralizada.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/60 rounded-3xl p-8 hover:bg-[#0f172a] hover:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_25px_50px_rgb(0,0,0,0.2)] hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="text-indigo-600 mb-8 bg-indigo-50 group-hover:bg-slate-800 group-hover:text-indigo-400 w-16 h-16 rounded-2xl flex items-center justify-center border border-indigo-100/50 group-hover:border-slate-700 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-extrabold text-[#0f172a] group-hover:text-white mb-3 transition-colors">{feature.title}</h3>
              <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed font-medium transition-colors">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
