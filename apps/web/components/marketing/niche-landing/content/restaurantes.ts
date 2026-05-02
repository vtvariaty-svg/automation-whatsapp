import type { NicheContent, ContentVariants, VariantKey } from './types'

// ─── A/B Variant Config ───────────────────────────────────────────────────────
// Change ACTIVE_VARIANT to 'B' or 'C' to activate an alternative.
// 'A' = control (default live version).
export const ACTIVE_RESTAURANTES_VARIANT: VariantKey = 'A'

export const restaurantesVariants: ContentVariants = {
  hero: {
    headline: {
      // A — chaos-relief, direct outcome
      A: 'Pedidos pelo WhatsApp sem bagunça no atendimento',
      // B — operator-centric, kitchen angle
      B: 'Seu WhatsApp organizando pedidos enquanto você cuida da cozinha',
      // C — volume + speed angle
      C: 'Mais pedidos atendidos. Menos caos. WhatsApp trabalhando por você.',
    },
    subheadline: {
      // A — mechanism-first, outcome-balanced (control)
      A: 'A Variaty responde sobre o cardápio, organiza a entrada de pedidos e confirma delivery ou retirada pelo WhatsApp — para você focar em preparar, não em ficar no celular.',
      // B — speed + organization
      B: 'Respostas automáticas para cardápio, preços e horários. Pedidos recebidos de forma organizada. Menos mensagem perdida, mais cliente atendido.',
      // C — pico/volume focused
      C: 'No horário de pico, a Variaty responde em segundos, coleta dados do pedido e organiza o fluxo — sem você parar tudo para checar o WhatsApp.',
    },
    primaryCTA: {
      A: 'Ver demonstração gratuita',
      B: 'Ver como funciona',
      C: 'Quero ver funcionando',
    },
  },
  finalCTA: {
    headline: {
      A: 'Cada mensagem não respondida no horário de pico é um pedido que foi embora.',
      B: 'Seu WhatsApp pode receber pedidos de forma organizada — sem você no celular o tempo todo.',
      C: 'O caos no atendimento não é problema de volume. É problema de organização.',
    },
    subheadline: {
      A: 'Organize o atendimento pelo WhatsApp, reduza pedidos perdidos e libere sua equipe para o que importa: preparar e entregar.',
      B: 'Respostas automáticas, fluxo de pedidos organizado e menos tempo no celular — para você focar na operação.',
      C: 'Com a Variaty, cada cliente recebe resposta rápida, cada pedido chega organizado e sua equipe foca no que gera resultado.',
    },
  },
}

// ─── Content ──────────────────────────────────────────────────────────────────

export const restaurantesContent: NicheContent = {
  theme: 'restaurantes',
  slug: 'restaurantes-delivery',
  specialistWAText:
    'Olá, quero entender como a Variaty funciona para restaurante ou delivery.',
  crossNiche: {
    text: 'Seu negócio é clínica ou consultório? Veja a versão feita para atendimento em saúde.',
    href: '/clinicas',
    ctaLabel: 'Ver para clínicas e consultórios →',
    targetNiche: 'clinicas',
  },

  credibilityAnchors: [
    'Funciona com seu número de WhatsApp atual',
    'Ativo no horário de pico — sem você no celular',
    'Implantação orientada — sem parar a operação',
  ],

  hero: {
    badge: 'Restaurante · Delivery · Marmitaria',
    headline: restaurantesVariants.hero.headline[ACTIVE_RESTAURANTES_VARIANT],
    headlineBreak: 3,
    subheadline: restaurantesVariants.hero.subheadline[ACTIVE_RESTAURANTES_VARIANT],
    primaryCTA: restaurantesVariants.hero.primaryCTA[ACTIVE_RESTAURANTES_VARIANT],
    secondaryCTA: 'Como funciona',
    microcopy: 'Sem cartão de crédito. Implantação orientada. Funciona com seu WhatsApp atual.',
    trustBullets: [
      'Responde cardápio e preços automaticamente',
      'Pedidos organizados — menos mensagem perdida',
      'Sem trocar de ferramenta',
    ],
  },

  problem: {
    title: 'No horário de pico, o WhatsApp vira caos — e pedido perdido é receita perdida',
    bullets: [
      'No rush do almoço, chegam 10 mensagens ao mesmo tempo e uma some no meio',
      'Clientes perguntam preço, cardápio e área de entrega várias vezes por dia',
      'Pedido confirmado por mensagem mas esquecido porque chegou na hora errada',
      'Quem não responde rápido perde o pedido para quem respondeu primeiro',
      'O dono está sempre no celular — enquanto a cozinha espera direção',
    ],
  },

  solution: {
    title: 'WhatsApp organizado, pedidos recebidos, atendimento sem caos',
    description:
      'A Variaty responde perguntas sobre cardápio, preços e horários automaticamente, e organiza a entrada de pedidos pelo WhatsApp — para que sua equipe receba o que precisa de forma clara, sem depender de alguém monitorando o celular o tempo todo.',
    contrast: {
      before: 'Mensagens misturadas, pedido perdido, cliente sem resposta',
      after: 'Fluxo claro, pedido organizado, cliente respondido em segundos',
    },
  },

  scenarios: {
    title: 'Como restaurantes e deliveries usam a Variaty no dia a dia',
    items: [
      {
        label: 'Horário de pico',
        headline: 'Rush do almoço sem mensagem perdida',
        description:
          'A Variaty responde em paralelo enquanto sua equipe prepara os pedidos — sem você parar para checar cada mensagem que chega.',
        outcome: 'Mais pedidos atendidos no horário de maior movimento',
      },
      {
        label: 'Cardápio e preços',
        headline: 'Mesmas perguntas, respostas automáticas',
        description:
          'Preço do prato, área de entrega, horário de funcionamento — respondidos de forma consistente, sem ocupar nenhum atendente.',
        outcome: 'Menos tempo repetindo informações básicas',
      },
      {
        label: 'Pedido delivery',
        headline: 'Entrada de pedido organizada desde o primeiro contato',
        description:
          'Cliente inicia o pedido no WhatsApp e a Variaty coleta as informações necessárias — endereço, itens, modalidade de retirada — de forma estruturada.',
        outcome: 'Pedido chega completo, sem ir e vir de mensagens',
      },
      {
        label: 'Marmitaria',
        headline: 'Pedido antecipado sem bagunça no dia seguinte',
        description:
          'Clientes que pedem toda semana encontram um fluxo previsível — a Variaty coleta o pedido com antecedência e confirma a retirada ou entrega automaticamente.',
        outcome: 'Produção previsível, cliente fidelizado',
      },
    ],
  },

  howItWorks: {
    title: 'Do primeiro contato ao pedido organizado — sem caos no meio',
    steps: [
      {
        title: 'Cliente entra em contato pelo WhatsApp',
        description: 'Seja para perguntar o cardápio, fazer um pedido ou confirmar a entrega.',
      },
      {
        title: 'A Variaty responde e organiza o fluxo',
        description:
          'Responde perguntas frequentes e, quando é um pedido, coleta as informações necessárias de forma estruturada.',
      },
      {
        title: 'O pedido chega organizado para sua equipe',
        description:
          'Sem mensagem perdida, sem informação faltando — sua equipe recebe o que precisa para executar.',
      },
      {
        title: 'Sua equipe foca no que gera resultado',
        description:
          'Preparar, entregar, atender com qualidade — não monitorar o celular enquanto o pedido espera.',
      },
    ],
  },

  benefits: {
    title: 'O que muda na operação do seu restaurante',
    items: [
      {
        title: 'Menos pedido perdido no horário de pico',
        description:
          'Respostas automáticas garantem que cada cliente seja atendido — mesmo quando chegam 10 mensagens ao mesmo tempo.',
      },
      {
        title: 'Dúvidas sobre cardápio respondidas na hora',
        description:
          'Preço, itens do dia, área de entrega — o cliente pergunta e recebe resposta imediata, sem esperar alguém disponível para digitar.',
      },
      {
        title: 'Pedidos organizados desde a entrada',
        description:
          'Fluxo estruturado de coleta de pedido — itens, endereço, modalidade — chegam completos para sua equipe.',
      },
      {
        title: 'Menos tempo da equipe no celular',
        description:
          'Perguntas repetitivas deixam de ocupar quem deveria estar preparando ou entregando.',
      },
      {
        title: 'Atendimento consistente, mesmo em volume alto',
        description:
          'O mesmo padrão de resposta independente de quem está disponível ou do volume de mensagens no momento.',
      },
    ],
  },

  proof: {
    title: 'A Variaty é para quem quer operar com mais organização sem contratar mais atendentes',
    focusPoints: [
      'Restaurante que perde pedido por não responder rápido no horário de pico',
      'Delivery que quer organizar a entrada de pedidos sem depender de planilha manual',
      'Marmitaria com clientes fiéis que pedem toda semana pelo WhatsApp',
      'Negócio que quer atender mais rápido sem aumentar a equipe de atendimento',
    ],
  },

  objections: {
    title: 'Sua dúvida provavelmente está aqui',
    items: [
      {
        q: 'Meu restaurante é pequeno — isso serve para mim?',
        a: 'É onde faz mais diferença. Em operações menores, cada mensagem não atendida é um pedido perdido. A Variaty garante resposta rápida sem precisar contratar alguém só para ficar no WhatsApp.',
      },
      {
        q: 'Meu atendimento já funciona pelo WhatsApp.',
        a: 'Usar o WhatsApp e ter o WhatsApp organizado são coisas diferentes. A Variaty estrutura o fluxo — mensagens chegam com as informações certas, na hora certa, sem você depender de quem está disponível.',
      },
      {
        q: 'E para pedidos complexos com muitas opções?',
        a: 'A automação cuida das etapas previsíveis — cardápio, confirmação, coleta de dados básicos. Para casos que precisam de atenção humana, a conversa é encaminhada para sua equipe com o contexto já organizado.',
      },
      {
        q: 'O sistema faz pagamento online?',
        a: 'Não. A Variaty organiza o atendimento e a entrada de pedidos pelo WhatsApp. O pagamento e a confirmação final continuam sendo gerenciados por você, no seu fluxo atual.',
      },
      {
        q: 'Quanto tempo leva para funcionar?',
        a: 'A implantação é orientada e feita junto com você. Não é preciso parar a operação — o processo é estruturado para ter resultado rápido sem virar um projeto demorado.',
      },
    ],
  },

  faq: {
    items: [
      {
        q: 'Funciona para marmitaria?',
        a: 'Sim — especialmente para quem tem clientes que pedem toda semana. A Variaty organiza o fluxo de pedido antecipado, coleta as informações e confirma entrega ou retirada automaticamente.',
      },
      {
        q: 'Posso enviar meu cardápio automaticamente?',
        a: 'Sim. Você configura as informações do cardápio e a Variaty envia quando o cliente pede — preço, itens do dia, opções disponíveis — sem alguém precisar responder manualmente.',
      },
      {
        q: 'Como os pedidos chegam para mim?',
        a: 'Pelo próprio WhatsApp, de forma organizada. A Variaty coleta os dados necessários do cliente e apresenta o pedido de forma estruturada para sua equipe — sem mensagens perdidas no meio da conversa.',
      },
      {
        q: 'Preciso mudar meu WhatsApp atual?',
        a: 'Não. A Variaty funciona com seu número existente. Você não muda de ferramenta — só para de depender do esforço manual para as partes que podem ser automatizadas.',
      },
      {
        q: 'Posso começar com só um fluxo?',
        a: 'Sim. Você pode começar apenas respondendo perguntas sobre o cardápio e expandir para recepção de pedidos quando se sentir confortável. Não é tudo ou nada.',
      },
    ],
  },

  finalCTA: {
    headline: restaurantesVariants.finalCTA.headline[ACTIVE_RESTAURANTES_VARIANT],
    subheadline: restaurantesVariants.finalCTA.subheadline[ACTIVE_RESTAURANTES_VARIANT],
    primaryCTA: restaurantesVariants.hero.primaryCTA[ACTIVE_RESTAURANTES_VARIANT],
    secondaryCTA: 'Falar com especialista',
  },

  stickyMobileCTA: 'Ver demonstração',
}
