export function BeneficiosSection() {
  const features = [
    {
      icon: "💬",
      title: "Omnichannel Centralizado",
      description:
        "WhatsApp Oficial, Instagram (Comentários e DMs) e Facebook Messenger em uma única caixa de entrada. Sem perder nenhuma mensagem.",
    },
    {
      icon: "📅",
      title: "Agendamentos Automatizados",
      description:
        "A IA consulta a agenda disponível, bloqueia o horário, envia confirmação e lembra o cliente automaticamente. Sem planilha, sem erro.",
    },
    {
      icon: "🛒",
      title: "Catálogo, Pedidos e Pagamentos",
      description:
        "Cadastre produtos com preço e estoque. A IA oferece, gera pedido e envia link de pagamento via Stripe ou Asaas — tudo dentro da conversa.",
    },
    {
      icon: "🧠",
      title: "IA com Personalidade do Seu Negócio",
      description:
        "Configure tom de voz, regras, FAQs e limitações. A IA respeita o que você definir e nunca inventa informações que não existem no sistema.",
    },
    {
      icon: "📊",
      title: "CRM, Pipeline e Métricas",
      description:
        "Acompanhe oportunidades, taxa de resposta, funil de vendas e agendamentos. Tenha visibilidade real sobre o que acontece no atendimento.",
    },
    {
      icon: "⚙️",
      title: "Automações e Gatilhos",
      description:
        "Respostas por palavra-chave, mensagens de ausência, templates aprovados pela Meta e envios em lote para sua base de contatos.",
    },
  ];

  return (
    <section id="recursos" className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
      <div className="absolute -left-[500px] top-40 w-[1000px] h-[1000px] bg-indigo-100/30 rounded-full blur-[120px] mix-blend-multiply opacity-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="inline-block text-indigo-600 font-extrabold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1.5 rounded-md mb-6 ring-1 ring-indigo-200/50">
            Arquitetura de Vendas
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Ferramentas premium para <br className="hidden md:block"/> Operações que escalam
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            Substitua CRM improvisado e dezenas de zaps por uma plataforma centralizada e inteligente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-3xl p-8 hover:bg-gray-900 hover:border-gray-800 shadow-xl shadow-gray-200/30 hover:shadow-2xl hover:shadow-indigo-900/40 hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="text-4xl mb-6 bg-gray-50 group-hover:bg-gray-800 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:border-gray-700 shadow-sm transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-white mb-3 transition-colors">{feature.title}</h3>
              <p className="text-gray-500 group-hover:text-gray-400 leading-relaxed font-medium transition-colors">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
