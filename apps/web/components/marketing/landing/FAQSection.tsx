import Link from "next/link";

export function FAQSection() {
  const faqs = [
    {
      q: "O Variaty funciona pelo WhatsApp?",
      a: "Sim. O foco público atual da Variaty é atendimento via WhatsApp — usando a API Oficial para garantir estabilidade e segurança do número.",
    },
    {
      q: "Serve para clínicas e consultórios?",
      a: "Sim. A Variaty ajuda clínicas e consultórios a responder pacientes fora do horário, confirmar consultas, reduzir faltas e encaminhar para atendimento humano quando necessário.",
    },
    {
      q: "Serve para restaurantes e delivery?",
      a: "Sim. Restaurantes e deliveries usam a Variaty para responder perguntas sobre cardápio, organizar a entrada de pedidos e reduzir mensagens perdidas no horário de pico.",
    },
    {
      q: "A IA substitui o atendimento humano?",
      a: "Não. A IA cuida do volume e das etapas previsíveis. Quando o cliente precisa de atenção humana, a conversa é encaminhada com o histórico completo visível.",
    },
    {
      q: "A IA faz diagnóstico médico ou orienta tratamentos?",
      a: "Não. A Variaty não diagnostica, não prescreve e não interpreta exames. O uso para clínicas é restrito ao atendimento administrativo — agendamento, confirmação e comunicação.",
    },
    {
      q: "O sistema processa pagamento online?",
      a: "Não. A Variaty organiza o atendimento e o fluxo de pedidos pelo WhatsApp. O pagamento e a confirmação final continuam sendo gerenciados por você, no seu fluxo atual.",
    },
    {
      q: "Posso começar com uma operação simples?",
      a: "Sim. Você pode começar com um único fluxo — responder dúvidas frequentes, por exemplo — e expandir conforme se sentir confortável. Não é tudo ou nada.",
    },
  ];

  return (
    <section id="faq" className="py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          {/* Left — FAQ */}
          <div className="flex-1">
            <div className="mb-10">
              <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-5 ring-1 ring-indigo-100">
                Dúvidas rápidas
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] mb-4 tracking-tight">Perguntas frequentes</h2>
              <p className="text-base text-slate-500 font-medium max-w-md">
                O que os líderes de operação sempre perguntam antes de começar.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-[#f8fafc] rounded-xl border border-slate-200/60 overflow-hidden [&_summary::-webkit-details-marker]:hidden hover:border-indigo-200 transition-colors"
                >
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer font-bold text-base text-[#0f172a] group-open:text-indigo-600 transition-colors">
                    {faq.q}
                    <span className="text-slate-300 group-open:rotate-45 transition-transform text-2xl flex-shrink-0 ml-4 font-light leading-none">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-slate-500 leading-relaxed text-sm font-medium -mt-1">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Right — Contact Card */}
          <div className="lg:w-[360px] shrink-0" id="contato">
            <div className="sticky top-28 bg-[#080d19] rounded-2xl p-8 border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] text-white overflow-hidden relative">

              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <h3 className="text-2xl font-extrabold mb-3 tracking-tight">Ainda tem dúvidas?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Fale direto com nossa equipe. Volume alto, white-label ou configurações especiais — a gente resolve.
              </p>

              <div className="space-y-6">
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0 border border-[#25D366]/20">
                    <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">WhatsApp Oficial</p>
                    <a href="https://wa.me/5519995993220" target="_blank" rel="noopener noreferrer" className="text-white font-extrabold text-lg hover:text-[#25D366] transition-colors">
                      (19) 99599-3220
                    </a>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">E-mail Corporativo</p>
                    <a href="mailto:comercial@vtvariatysecretary.com.br" className="text-white font-semibold text-sm hover:text-blue-400 transition-colors break-all">
                      comercial@vtvariatysecretary.com.br
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
