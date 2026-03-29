export function AtivacaoSection() {
  const steps = [
    {
      num: "1",
      titulo: "Conecte seus canais",
      desc: "Vincule o WhatsApp Business Oficial, Instagram e Facebook com autenticação Meta — em até 2 cliques.",
    },
    {
      num: "2",
      titulo: "Ensine sua IA com chat guiado",
      desc: "Responda perguntas simples: tom de voz, o que você oferece, como tratar preços e horários. Sem escrever prompt — a IA monta a configuração por você.",
    },
    {
      num: "3",
      titulo: "Ative o atendimento",
      desc: "Sua IA começa a responder clientes com as regras do seu negócio imediatamente — sem script rígido, com inteligência real.",
    },
    {
      num: "4",
      titulo: "Acompanhe e refine",
      desc: "Veja conversas em tempo real, ajuste o comportamento da IA quando quiser e intervenha nos casos que precisam de atenção humana.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Ativação
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Sua IA configurada e operando em minutos
          </h2>
          <p className="text-lg text-gray-600">
            Self-service, sem prompt manual, sem equipe técnica. Sua IA aprende o seu negócio pelo chat guiado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="relative p-7 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-white hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white text-xl font-bold flex items-center justify-center mb-6 shadow-md shadow-blue-500/30">
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.titulo}</h3>
              <p className="text-gray-600 font-medium text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
