import Link from "next/link";

export function FAQSection() {
  const faqs = [
    {
      q: "Qual a diferença para um chatbot genérico com respostas fixas?",
      a: "A Variaty usa modelos de linguagem avançados (como GPT-4) que entendem contexto e intenção real — não árvores de decisão. Você configura as regras de vendas e a IA responde naturalidade, focando em conversão.",
    },
    {
      q: "Preciso de um número de WhatsApp específico ou posso usar o meu atual?",
      a: "Você pode usar seu número atual ou alocar um número exclusivo. A conexão é feita via API Oficial da Meta, conferindo segurança total, selo de verificação e zero risco de banimentos indevidos.",
    },
    {
      q: "A IA entende o calendário da minha equipe para agendamentos?",
      a: "Absolutamente. O módulo de agendamentos consulta disponibilidades reais. A IA oferece os slots livres, registra no sistema assim que o cliente aceita e envia lembretes para evitar no-shows.",
    },
    {
      q: "Minha equipe humana pode intervir ou desligar o robô no meio do chat?",
      a: "Sim. A intervenção humana pausa a IA imediatamente. O atendente assume no mesmo chat, com o histórico inteiro visível. Após concluir, reativar a IA leva literalmente um clique.",
    },
  ];

  return (
    <section id="faq" className="py-24 lg:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          <div className="flex-1">
            <div className="mb-12 text-left">
              <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-100">
                Transparência
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] mb-6 tracking-tight">Perguntas frequentes</h2>
              <p className="text-lg text-slate-500 font-medium">
                Tudo o que líderes de operação perguntam antes de integrar a infraestrutura.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-[#f8fafc] rounded-2xl border border-slate-200/60 overflow-hidden [&_summary::-webkit-details-marker]:hidden hover:border-indigo-300 transition-colors"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg text-[#0f172a] group-open:text-indigo-600 transition-colors">
                    {faq.q}
                    <span className="text-slate-400 group-open:rotate-45 transition-transform text-2xl flex-shrink-0 ml-4 font-normal">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-slate-500 leading-relaxed font-medium -mt-2">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="lg:w-[400px] shrink-0" id="contato">
            <div className="sticky top-32 bg-[#080d19] rounded-[2rem] p-10 border border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.3)] text-white overflow-hidden relative group">
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
              
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/30">
                <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              <h3 className="text-3xl font-extrabold mb-4 tracking-tight">Fale conosco</h3>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
                Alta volumetria ou requisitos de conformidade complexos? Nossa equipe corporativa desenha o escopo ideal para a sua necessidade.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 border border-[#25D366]/20 transition-all hover:bg-[#25D366] hover:text-white cursor-pointer">
                    <svg className="w-6 h-6 fill-currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/>
                    </svg>
                  </div>
                  <div className="pt-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">WhatsApp Oficial</p>
                    <a href="https://wa.me/5519995993220" target="_blank" rel="noopener noreferrer" className="text-white font-extrabold text-xl hover:text-[#25D366] transition-colors">
                      (19) 99599-3220
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20 transition-all hover:bg-blue-500 hover:text-white cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="pt-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">E-mail Corporativo</p>
                    <a href="mailto:comercial@vtvariatysecretary.com.br" className="text-white font-bold hover:text-blue-400 transition-colors break-all">
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
