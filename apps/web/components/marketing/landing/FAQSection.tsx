import Link from "next/link";

export function FAQSection() {
  const faqs = [
    {
      q: "Qual a diferença para um chatbot genérico com respostas fixas?",
      a: "A Variaty usa modelos de linguagem avançados (como GPT) que entendem contexto e intenção — não árvores de decisão fixas. Você configura as regras e a IA responde com naturalidade dentro dos limites que você definiu.",
    },
    {
      q: "Preciso de um número de WhatsApp específico ou posso usar o meu atual?",
      a: "Você pode usar seu número atual (desde que não esteja sendo usado no aplicativo do celular) ou criar um número novo. A conexão é feita via API Oficial da Meta — o processo mais seguro, sem risco de banimento.",
    },
    {
      q: "A IA pode entender a agenda dos meus profissionais e bloquear horários?",
      a: "Sim. No módulo de agendamentos, você vincula profissionais aos serviços e configura horários disponíveis. A IA só oferece os slots livres, bloqueia o horário automaticamente e envia confirmação com lembretes.",
    },
    {
      q: "Minha equipe pode intervir nas conversas quando quiser?",
      a: "Sim, a qualquer momento. O modo humano pausa a IA para aquela conversa específica. Quando o atendimento manual terminar, você reativa a IA com um clique. O histórico completo fica visível para o atendente.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          <div className="flex-1">
            <div className="mb-12 text-left">
              <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
                Dúvidas
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Perguntas frequentes</h2>
              <p className="text-lg text-gray-600">
                Tudo que você precisa saber antes de começar.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-base text-gray-900 hover:text-blue-600 transition-colors">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-45 transition-transform text-2xl flex-shrink-0 ml-4">
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed font-medium -mt-2 text-sm">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="lg:w-96" id="contato">
            <div className="sticky top-32 bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl shadow-gray-900/20 text-white">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-extrabold mb-3">Fale conosco</h3>
              <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                Ainda tem dúvidas ou prefere falar com um humano? Nossa equipe comercial está pronta para entender o seu negócio.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] shrink-0 border border-[#25D366]/20 transition-all group-hover:bg-[#25D366] group-hover:text-white">
                    <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.623-1.467A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.597-5.924-1.634l-.425-.252-2.74.87.883-2.665-.278-.443A9.748 9.748 0 012.182 12c0-5.417 4.401-9.818 9.818-9.818S21.818 6.583 21.818 12s-4.401 9.818-9.818 9.818z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">WhatsApp</p>
                    <a href="https://wa.me/5519995993220" target="_blank" rel="noopener noreferrer" className="text-gray-100 font-extrabold text-lg transition-colors group-hover:text-[#25D366]">
                      (19) 99599-3220
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start group">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20 transition-all group-hover:bg-blue-500 group-hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">E-mail Comercial</p>
                    <a href="mailto:comercial@vtvariatysecretary.com.br" className="text-gray-100 font-bold transition-colors group-hover:text-blue-400 break-all">
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
