import Link from "next/link";

const WHATSAPP_DEMO_URL = "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20testar%20a%20IA%20da%20Variaty.";

export function MecanismoSection() {
  const etapas = [
    { num: "01", titulo: "Conecte seu canal", desc: "WhatsApp Business Oficial, Instagram ou Facebook — ative com autenticação oficial Meta em poucos cliques.", cor: "blue" },
    { num: "02", titulo: "Ensine sua IA", desc: "Responda perguntas simples sobre seu negócio: tom, ofertas, horários e diferenciais. Sem escrever prompt — a IA aprende sozinha.", cor: "indigo" },
    { num: "03", titulo: "IA atende com as suas regras", desc: "Sua IA responde clientes com o tom e as regras que você definiu — não um script engessado, mas uma assistente inteligente.", cor: "violet" },
    { num: "04", titulo: "Qualifica, agenda ou vende", desc: "A IA oferece produtos, agenda horários, gera links de pagamento e coleta dados de leads — tudo dentro da conversa.", cor: "blue" },
    { num: "05", titulo: "Time intervém quando faz sentido", desc: "Para exceções ou fechamentos estratégicos, o atendente assume com todo o histórico na tela.", cor: "indigo" },
  ];

  return (
    <section className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Mecanismo
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Do zero ao atendimento com IA configurada para você
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ensine sua IA em minutos. Ela atende, agenda e vende com as regras do seu negócio — sem script engessado, sem depender de equipe técnica.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {etapas.map((e, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-blue-100 flex flex-col items-center justify-center mb-5 shadow-sm group-hover:border-blue-300 group-hover:shadow-md transition-all duration-300">
                  <span className="text-xs font-bold text-blue-400 tracking-widest">{e.num}</span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-2 leading-snug">{e.titulo}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-14 flex flex-col items-center gap-3">
          <Link href="/register" className="inline-flex items-center gap-2 text-base font-bold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5">
            Teste grátis
          </Link>
          <a href={WHATSAPP_DEMO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#25D366] transition-colors">
            Ou teste a IA agora no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
