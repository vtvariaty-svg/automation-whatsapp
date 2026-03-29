import Link from "next/link";

const WHATSAPP_DEMO_URL =
  "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20testar%20a%20IA%20da%20Variaty.";

export function ComoFuncionaSection() {
  const etapas = [
    {
      num: "1",
      titulo: "Conecte seus canais",
      desc: "Vincule o WhatsApp Business Oficial, Instagram e Facebook com autenticação Meta.",
      cor: "blue",
    },
    {
      num: "2",
      titulo: "Ensine por chat",
      desc: "Responda perguntas simples. Sem escrever prompt — a IA aprende a personalidade do seu negócio.",
      cor: "indigo",
    },
    {
      num: "3",
      titulo: "Atendimento Autônomo",
      desc: "A IA qualifica leads, agenda reuniões e processa vendas com as suas regras em tempo real.",
      cor: "violet",
    },
    {
      num: "4",
      titulo: "Gestão Híbrida",
      desc: "Para exceções ou fechamentos estratégicos, o atendente assume com todo o histórico visível.",
      cor: "blue",
    },
  ];

  return (
    <section id="como-funciona" className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Do zero ao atendimento com IA em minutos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ensine sua IA conversando. Ela atende, agenda e vende com as regras do seu negócio — sem depender de equipe técnica.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {etapas.map((e, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 font-bold text-xl group-hover:scale-110 transition-transform">
                  {e.num}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{e.titulo}</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-14 flex flex-col items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-base font-bold bg-blue-600 text-white px-8 py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
          >
            Teste grátis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <a
            href={WHATSAPP_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#25D366] transition-colors"
          >
            Ou assista uma demo no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
