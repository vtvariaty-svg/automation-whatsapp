import Link from "next/link";
import { WHATSAPP_BUSINESS_URL } from "@/lib/config/plans";

export function PrecosSection() {
  const planos = [
    {
      nome: "Gratuito",
      slug: "free",
      preco: null,
      descricao: "Para explorar a interface sem compromisso",
      nota: "1 usuário · Canais limitados",
      features: [
        "Caixa de entrada: Apenas Instagram DM",
        "Até 1.000 contatos no CRM",
        "500 mensagens de IA por mês",
        "Até 200 conversas por mês",
        "Até 5 automações dinâmicas",
        "Suporte da comunidade e documentação",
      ],
      ausentes: [
        "WhatsApp Oficial API",
        "Analytics Avançado e Copilot",
        "Prospecção Inteligente Ativa",
      ],
      botaoTexto: "Explorar sem compromisso",
      botaoEstilo: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
      popular: false,
      href: "/register?plan=free",
    },
    {
      nome: "Pro",
      slug: "pro",
      preco: "49,90",
      precoAntigo: "139,00",
      descricao: "A inteligência de vendas para crescer rápido",
      nota: "7 dias grátis · Sem taxas ocultas",
      features: [
        "WhatsApp Oficial, Instagram e Facebook",
        "10.000 mensagens de IA por mês",
        "Até 20.000 contatos no seu CRM IA",
        "Respostas em comentários do Instagram",
        "Criação de Segmentos e Sequências (Drips)",
        "Analytics Avançado e AI Copilot",
        "Até 5 agentes na mesma operação",
      ],
      ausentes: [
        "Prospecção Inteligente Ativa",
        "Painel White-label de agência",
      ],
      botaoTexto: "Começar 7 dias grátis",
      botaoEstilo: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25",
      popular: true,
      href: "/register?plan=pro",
    },
    {
      nome: "Business",
      slug: "business",
      preco: "Custom",
      descricao: "Arquitetura sob medida e revenda",
      nota: "Desenho da infraestrutura em consultoria",
      features: [
        "Tudo do plano Pro operando sem limites",
        "Mensagens e contatos ilimitados",
        "Prospecção Ativa (Listas frias no painel)",
        "White-label: Plataforma completa na sua marca",
        "Gestão de múltiplas contas (Agency/Franquias)",
        "Onboarding Enterprise e Suporte SLA de 1 hora",
        "Personalização exclusiva das IAs",
      ],
      ausentes: [],
      botaoTexto: "Falar com consultor",
      botaoEstilo: "bg-gray-900 text-white hover:bg-gray-800",
      popular: false,
      href: WHATSAPP_BUSINESS_URL,
    },
  ];

  return (
    <section className="py-24 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-600 font-bold tracking-wide text-sm uppercase bg-blue-100 px-3 py-1 rounded-full mb-4">
            Planos V3
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Uma arquitetura feita para escalar o seu MRR.
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto font-medium">
            Sem contratos longos. Sem surpresas ou engessamentos estruturais. Escolha seu estágio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start max-w-6xl mx-auto">
          {planos.map((plano, i) => (
            <div
              key={i}
              className={`bg-white rounded-3xl p-8 flex flex-col relative transition-all duration-300 ${
                plano.popular
                  ? "border-2 border-blue-600 shadow-2xl shadow-blue-900/10 lg:-mt-3 lg:-mb-3 z-10"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              {plano.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-5 rounded-full whitespace-nowrap shadow-md shadow-blue-500/30">
                  Mais escolhido
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plano.nome}</h3>
                <p className={`text-sm leading-snug ${plano.popular ? "text-blue-700 font-semibold" : "text-gray-500"}`}>
                  {plano.descricao}
                </p>
              </div>

              <div className="mb-8 min-h-[48px] flex items-end">
                {plano.preco === null ? (
                  <div>
                    <span className="text-4xl font-extrabold text-gray-900">Grátis</span>
                  </div>
                ) : plano.preco === 'Custom' ? (
                  <div>
                    <span className="text-4xl font-extrabold text-gray-900">Custom</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {plano.precoAntigo && (
                      <span className="text-sm font-bold text-gray-400 line-through decoration-red-500/50 mb-1">
                        De R$ {plano.precoAntigo}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-gray-400">R$</span>
                      <span className="text-4xl font-extrabold text-gray-900">{plano.preco}</span>
                      <span className="text-gray-500 font-medium text-sm">/mês</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <ul className="space-y-3 mb-8">
                  {plano.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 font-semibold text-sm leading-snug">{feature}</span>
                    </li>
                  ))}
                  {plano.ausentes.map((feature, j) => (
                    <li key={`a-${j}`} className="flex items-start gap-2.5 opacity-40">
                      <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                      <span className="text-gray-500 font-semibold text-sm leading-snug line-through">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plano.href}
                className={`w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${plano.botaoEstilo}`}
              >
                {plano.botaoTexto}
              </Link>
              {plano.nota && (
                <p className={`text-center text-xs font-semibold mt-4 ${plano.popular ? "text-blue-700" : "text-gray-400"}`}>
                  {plano.nota}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
