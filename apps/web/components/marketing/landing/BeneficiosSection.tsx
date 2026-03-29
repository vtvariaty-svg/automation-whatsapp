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
    <section id="recursos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Plataforma
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Tudo que sua operação precisa, em um lugar só
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Substitua CRM separado, chatbot genérico e planilha de agendamentos por uma plataforma integrada e treinada para o seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-8 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
