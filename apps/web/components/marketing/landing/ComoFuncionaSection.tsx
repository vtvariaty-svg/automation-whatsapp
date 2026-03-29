import Link from "next/link";

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20testar%20a%20IA%20da%20Variaty.";

export function ComoFuncionaSection() {
  const etapas = [
    {
      num: "01",
      titulo: "Conecte seus Canais",
      desc: "Integração segura via API Oficial. Vincule WhatsApp, Instagram e Facebook em 2 minutos.",
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    {
      num: "02",
      titulo: "Treine em Segundos",
      desc: "Zero código. Envie as perguntas frequentes e preços. A IA incorpora a identidade da sua marca instantaneamente.",
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      num: "03",
      titulo: "Atendimento Autônomo",
      desc: "Pronto! Ela já está trabalhando. Respondendo dúvidas, contornando objeções e marcando agendamentos.",
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
  ];

  return (
    <section id="como-funciona" className="py-24 lg:py-32 bg-white relative overflow-hidden text-center">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-50/50 rounded-full mix-blend-multiply blur-3xl opacity-70" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block text-blue-600 font-extrabold tracking-widest text-xs uppercase bg-blue-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-blue-100">
            Fluxo de Configuração
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Do zero ao primeiro <br className="hidden md:block"/> cliente atendido por IA
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium text-balance">
            Você não precisa de desenvolvedores ou fluxogramas complexos. A arquitetura foi pensada para você focar no faturamento.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting Line Desktop */}
          <div className="hidden lg:block absolute top-[4.5rem] left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {etapas.map((e, i) => (
              <div key={i} className="relative flex flex-col items-center group text-center px-6">
                <div className="relative w-24 h-24 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center justify-center mb-8 group-hover:-translate-y-2 transition-transform duration-500 z-10">
                  {e.icon}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white font-bold text-sm rounded-full flex items-center justify-center shadow-lg">
                    {e.num}
                  </div>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">{e.titulo}</h3>
                <p className="text-base text-gray-500 leading-relaxed font-medium">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 text-base font-extrabold bg-blue-600 text-white px-10 py-4 lg:py-5 rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:shadow-[0_10px_40px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1 ring-2 ring-blue-500/20"
          >
            Quero automação no WhatsApp
          </Link>
          <a
            href={WHATSAPP_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-[#25D366] transition-colors"
          >
            Ou chame nossa IA de demonstração
          </a>
        </div>
      </div>
    </section>
  );
}
