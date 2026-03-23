// ─── Tipos base ───────────────────────────────────────────────────────────────

export interface AutomationTemplate {
  name: string;
  triggerValue: string;
  matchType: 'exact' | 'contains';
  responseText: string;
}

export interface BotChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  required: boolean;
}

export interface BotTestScenario {
  userMessage: string;
  expectedBehavior: string;
}

export interface MarketplaceBot {
  id: string;
  name: string;
  emoji: string;
  niche: string;
  nicheLabel: string;
  description: string;
  tags: string[];
  // Comportamento da IA
  welcomeMessage: string;
  prompt: string;
  toneOfVoice: string;
  objective: string;
  // Automações pré-configuradas
  automations: AutomationTemplate[];
  // Ferramentas sugeridas para ativar
  suggestedTools: string[]; // 'agenda' | 'serviços' | 'produtos' | 'pagamentos'
  // Checklist de configuração pós-ativação
  setupChecklist: BotChecklistItem[];
  // Cenários de teste sugeridos
  testScenarios: BotTestScenario[];
}

// ─── Bots ─────────────────────────────────────────────────────────────────────

export const marketplaceBots: MarketplaceBot[] = [
  {
    id: 'bot-imobiliaria',
    name: 'Bot Imobiliária',
    emoji: '🏠',
    niche: 'imobiliária',
    nicheLabel: 'Imobiliária',
    description:
      'Qualifica leads automaticamente, responde dúvidas sobre imóveis disponíveis, agenda visitas e apresenta portfólio. Ideal para corretores e imobiliárias.',
    tags: ['imóveis', 'corretor', 'locação', 'venda', 'visita'],
    toneOfVoice: 'Profissional e consultivo',
    objective: 'Qualificar leads e agendar visitas',
    welcomeMessage:
      'Olá! 🏠 Seja bem-vindo(a)! Sou o assistente virtual da imobiliária. Posso te ajudar a encontrar o imóvel ideal, tirar dúvidas sobre aluguéis, compras e agendar visitas. Como posso te ajudar?',
    prompt: `Você é um assistente virtual especializado em atendimento imobiliário. Seu papel é qualificar leads, apresentar imóveis disponíveis, tirar dúvidas e agendar visitas.

COMPORTAMENTO:
- Seja cordial, profissional e consultivo
- Quando o cliente demonstrar interesse em um imóvel, colete: tipo de imóvel desejado, localização, orçamento e finalidade (morar ou investir)
- Para locação, informe os documentos normalmente exigidos: RG, CPF, comprovante de renda e referências
- Para compra, explique as etapas básicas: proposta, documentação, financiamento e escritura
- Nunca invente valores ou disponibilidade de imóveis — informe que irá verificar com o consultor
- Para agendar visita, colete: imóvel de interesse, data e horário de preferência e nome do cliente
- Sempre encerre oferecendo falar com um corretor para casos mais específicos

INTENÇÕES PRINCIPAIS:
1. Busca de imóveis para alugar ou comprar
2. Informações sobre documentação e processo
3. Agendamento de visitas
4. Dúvidas sobre valores, localização e condições
5. Encaminhamento para corretor humano`,
    automations: [
      {
        name: 'Aluguel',
        triggerValue: 'aluguel',
        matchType: 'contains',
        responseText:
          'Temos ótimas opções de aluguel! Para te indicar os melhores imóveis, me conta: qual tipo você procura (casa, apartamento, kitnet), qual região e qual o seu orçamento mensal?',
      },
      {
        name: 'Comprar Imóvel',
        triggerValue: 'comprar',
        matchType: 'contains',
        responseText:
          'Ótima decisão! Para te apresentar as melhores opções, me conta: qual tipo de imóvel (casa ou apartamento), qual localização preferida e qual o seu orçamento total?',
      },
      {
        name: 'Agendar Visita',
        triggerValue: 'visita',
        matchType: 'contains',
        responseText:
          'Claro! Vou agendar sua visita. Me informa: qual imóvel você tem interesse, qual data e horário prefere e seu nome completo.',
      },
      {
        name: 'Documentação',
        triggerValue: 'documentação',
        matchType: 'contains',
        responseText:
          'Para locação, geralmente são solicitados: RG, CPF, comprovante de renda (3x o valor do aluguel) e referências. Para compra, o processo envolve documentação pessoal, análise de crédito e matrícula do imóvel. Posso detalhar mais algum caso?',
      },
      {
        name: 'Financiamento',
        triggerValue: 'financiamento',
        matchType: 'contains',
        responseText:
          'Trabalhamos com as principais linhas de financiamento, incluindo Caixa Econômica Federal e bancos privados. Me passa seu contato que um de nossos consultores pode fazer uma simulação gratuita para você!',
      },
      {
        name: 'Localização',
        triggerValue: 'localização',
        matchType: 'contains',
        responseText:
          'Atendemos diversas regiões da cidade. Me conta qual bairro ou zona você prefere e eu verifico as opções disponíveis na sua região preferida.',
      },
    ],
    suggestedTools: [],
    setupChecklist: [
      {
        id: 'channel',
        label: 'Conectar canal de atendimento',
        description: 'WhatsApp, Instagram ou Facebook para receber mensagens',
        href: '/dashboard/integrations',
        required: true,
      },
      {
        id: 'business_hours',
        label: 'Preencher horários e endereço',
        description: 'A IA usa esses dados ao responder clientes sobre atendimento',
        href: '/dashboard/bots?tab=comportamento',
        required: true,
      },
      {
        id: 'prompt_review',
        label: 'Personalizar o prompt com o nome da imobiliária',
        description: 'Substitua os exemplos pelo nome real do seu negócio e diferenciais',
        href: '/dashboard/bots?tab=comportamento',
        required: false,
      },
      {
        id: 'welcome_review',
        label: 'Revisar a mensagem de boas-vindas',
        description: 'Inclua o nome da imobiliária e um toque personalizado',
        href: '/dashboard/bots?tab=comportamento',
        required: false,
      },
    ],
    testScenarios: [
      {
        userMessage: 'Quero alugar um apartamento de 2 quartos no centro',
        expectedBehavior: 'Solicita região, orçamento e mais detalhes para qualificar o lead',
      },
      {
        userMessage: 'Quero agendar uma visita',
        expectedBehavior: 'Pede imóvel de interesse, data, horário e nome do cliente',
      },
      {
        userMessage: 'Quais documentos preciso para alugar?',
        expectedBehavior: 'Lista os documentos (RG, CPF, renda, referências) sem inventar regras',
      },
    ],
  },

  {
    id: 'bot-clinica',
    name: 'Bot Clínica',
    emoji: '🏥',
    niche: 'clínica',
    nicheLabel: 'Clínica / Consultório',
    description:
      'Atendimento humanizado para clínicas e consultórios. Agenda consultas, responde sobre procedimentos, horários e convênios. Nunca emite diagnósticos.',
    tags: ['saúde', 'consulta', 'agendamento', 'clínica', 'dentista'],
    toneOfVoice: 'Empático e acolhedor',
    objective: 'Agendar consultas e responder dúvidas gerais sobre serviços',
    welcomeMessage:
      'Olá! 👋 Seja bem-vindo(a)! Sou o assistente virtual da clínica. Estou aqui para ajudar com agendamentos, dúvidas sobre procedimentos e horários. Como posso te ajudar hoje?',
    prompt: `Você é um assistente virtual de uma clínica médica ou odontológica. Seu papel é acolher pacientes, facilitar agendamentos e responder dúvidas gerais sobre serviços.

COMPORTAMENTO:
- Seja empático, acolhedor e profissional
- Priorize o agendamento quando o paciente demonstrar interesse
- Ao agendar, confirme sempre: serviço desejado, data, horário e nome do paciente
- Nunca forneça diagnósticos, indicações de medicamentos ou prescrições
- Para dúvidas clínicas específicas, oriente que o profissional de saúde dará a resposta adequada na consulta
- Em casos de urgência ou emergência, oriente imediatamente a ligar para o SAMU (192) ou ir ao pronto-socorro
- Informe sobre convênios de forma geral, sem confirmar cobertura sem verificação prévia

INTENÇÕES PRINCIPAIS:
1. Agendamento e reagendamento de consultas
2. Informações sobre serviços e especialidades
3. Horários de atendimento
4. Dúvidas sobre convênios e formas de pagamento
5. Confirmação e cancelamento de consultas`,
    automations: [
      {
        name: 'Agendar Consulta',
        triggerValue: 'agendar',
        matchType: 'contains',
        responseText:
          'Para agendar sua consulta, preciso de algumas informações: qual especialidade ou serviço você deseja, qual data e horário você tem preferência e seu nome completo.',
      },
      {
        name: 'Horário de Atendimento',
        triggerValue: 'horário',
        matchType: 'contains',
        responseText:
          'Quer saber nosso horário de atendimento? Pode me perguntar e eu verifico as informações para você. Também posso já te ajudar a agendar uma consulta!',
      },
      {
        name: 'Convênio / Plano de Saúde',
        triggerValue: 'convênio',
        matchType: 'contains',
        responseText:
          'Trabalhamos com convênios e planos de saúde. Entre em contato com nossa recepção para confirmar se o seu plano é aceito e quais procedimentos são cobertos.',
      },
      {
        name: 'Cancelar Consulta',
        triggerValue: 'cancelar',
        matchType: 'contains',
        responseText:
          'Sem problemas! Para cancelar ou reagendar sua consulta, me informa seu nome completo e a data/horário agendado.',
      },
      {
        name: 'Preço / Valor',
        triggerValue: 'preço',
        matchType: 'contains',
        responseText:
          'Os valores variam conforme o procedimento. Para uma informação mais precisa, posso agendar uma avaliação sem compromisso. Quer que eu verifique a disponibilidade?',
      },
    ],
    suggestedTools: ['agenda', 'serviços'],
    setupChecklist: [
      {
        id: 'channel',
        label: 'Conectar canal de atendimento',
        description: 'WhatsApp, Instagram ou Facebook para receber mensagens',
        href: '/dashboard/integrations',
        required: true,
      },
      {
        id: 'business_hours',
        label: 'Preencher horários de atendimento',
        description: 'Dias, horários e especialidades disponíveis — a IA responde com esses dados',
        href: '/dashboard/bots?tab=comportamento',
        required: true,
      },
      {
        id: 'services',
        label: 'Cadastrar especialidades e serviços',
        description: 'Adicione os serviços da clínica para a IA mencionar corretamente',
        href: '/dashboard/services',
        required: false,
      },
      {
        id: 'prompt_review',
        label: 'Personalizar o prompt com o nome da clínica',
        description: 'Substitua os placeholders pelo nome real da sua clínica',
        href: '/dashboard/bots?tab=comportamento',
        required: false,
      },
    ],
    testScenarios: [
      {
        userMessage: 'Quero agendar uma consulta com a cardiologista',
        expectedBehavior: 'Confirma especialidade, pede data, horário e nome do paciente',
      },
      {
        userMessage: 'Vocês aceitam Unimed?',
        expectedBehavior: 'Informa que aceita convênios e pede para verificar com a recepção',
      },
      {
        userMessage: 'Estou com dor no peito, o que faço?',
        expectedBehavior: 'Orienta para SAMU/pronto-socorro imediatamente, sem emitir diagnóstico',
      },
    ],
  },

  {
    id: 'bot-ecommerce',
    name: 'Bot E-commerce',
    emoji: '🛍️',
    niche: 'ecommerce',
    nicheLabel: 'Loja / E-commerce',
    description:
      'Atendimento completo para lojas online. Ajuda clientes a encontrar produtos, acompanhar pedidos, esclarecer dúvidas sobre frete, troca e pagamento.',
    tags: ['loja', 'pedido', 'frete', 'entrega', 'produto', 'troca'],
    toneOfVoice: 'Objetivo e ágil',
    objective: 'Suporte a pedidos, rastreamento e recomendações de produtos',
    welcomeMessage:
      'Olá! 🛍️ Seja bem-vindo(a) à nossa loja! Sou seu assistente virtual e posso te ajudar a encontrar produtos, acompanhar pedidos, tirar dúvidas sobre frete e muito mais. Como posso te ajudar?',
    prompt: `Você é um assistente virtual de uma loja online. Seu papel é ajudar clientes a encontrar produtos, acompanhar pedidos e resolver dúvidas sobre compras.

COMPORTAMENTO:
- Seja objetivo, ágil e focado em resolver a dúvida do cliente
- Para recomendações, pergunte sobre preferência e orçamento antes de sugerir
- Quando o cliente quiser comprar, apresente o produto e direcione para o checkout
- Para problemas com pedidos, sempre peça o número do pedido antes de responder
- Informe prazos e frete quando perguntado
- Em caso de troca ou devolução, explique o processo e peça o número do pedido
- Não confirme preços ou disponibilidade sem verificação — informe que irá checar

INTENÇÕES PRINCIPAIS:
1. Pesquisa e recomendação de produtos
2. Acompanhamento e rastreamento de pedidos
3. Informações sobre frete e prazo de entrega
4. Processos de troca e devolução
5. Formas de pagamento e parcelamento
6. Suporte pós-venda`,
    automations: [
      {
        name: 'Rastrear Pedido',
        triggerValue: 'rastrear',
        matchType: 'contains',
        responseText:
          'Para rastrear seu pedido, me informe o número do pedido ou o código de rastreamento que foi enviado por e-mail após a confirmação da compra.',
      },
      {
        name: 'Frete / Entrega',
        triggerValue: 'frete',
        matchType: 'contains',
        responseText:
          'O valor do frete é calculado com base no seu CEP e no peso do pedido. Me passa seu CEP que eu verifico as opções e prazos disponíveis para você!',
      },
      {
        name: 'Troca / Devolução',
        triggerValue: 'troca',
        matchType: 'contains',
        responseText:
          'Nossa política permite solicitação de troca ou devolução em até 7 dias após o recebimento. Me passa o número do seu pedido que eu te oriento no processo.',
      },
      {
        name: 'Pagamento / Parcelamento',
        triggerValue: 'parcel',
        matchType: 'contains',
        responseText:
          'Aceitamos cartão de crédito (em até 12x sem juros nas compras acima de R$ 150), PIX com desconto à vista e boleto bancário. Posso te ajudar a finalizar o pedido?',
      },
      {
        name: 'Status do Pedido',
        triggerValue: 'pedido',
        matchType: 'contains',
        responseText:
          'Para verificar o status do seu pedido, me informe o número do pedido ou o e-mail cadastrado na compra.',
      },
      {
        name: 'Desconto / Cupom',
        triggerValue: 'desconto',
        matchType: 'contains',
        responseText:
          'Temos promoções e cupons de desconto periodicamente! Me diz o que você está procurando e vejo se temos alguma oferta disponível.',
      },
    ],
    suggestedTools: ['produtos', 'pagamentos'],
    setupChecklist: [
      {
        id: 'channel',
        label: 'Conectar canal de atendimento',
        description: 'WhatsApp, Instagram ou Facebook para receber mensagens dos clientes',
        href: '/dashboard/integrations',
        required: true,
      },
      {
        id: 'business_hours',
        label: 'Preencher política de entrega, frete e troca',
        description: 'Adicione prazos, CEP de origem, política de troca e formas de pagamento',
        href: '/dashboard/bots?tab=comportamento',
        required: true,
      },
      {
        id: 'products',
        label: 'Cadastrar produtos do catálogo',
        description: 'Produtos cadastrados são consultados pela IA para recomendações',
        href: '/dashboard/products',
        required: false,
      },
      {
        id: 'prompt_review',
        label: 'Personalizar o prompt com o nome da loja',
        description: 'Inclua o nome da sua loja e os diferenciais do seu atendimento',
        href: '/dashboard/bots?tab=comportamento',
        required: false,
      },
    ],
    testScenarios: [
      {
        userMessage: 'Quero rastrear meu pedido #12345',
        expectedBehavior: 'Solicita número do pedido ou código de rastreamento para verificar',
      },
      {
        userMessage: 'Qual o prazo de entrega para São Paulo?',
        expectedBehavior: 'Pede CEP e informa que verificará as opções de frete disponíveis',
      },
      {
        userMessage: 'Quero trocar um produto que recebi errado',
        expectedBehavior: 'Explica a política de troca (7 dias) e pede o número do pedido',
      },
    ],
  },

  {
    id: 'bot-cabeleireiro',
    name: 'Bot Cabeleireiro',
    emoji: '💇',
    niche: 'salão',
    nicheLabel: 'Salão / Barbearia',
    description:
      'Agendamentos, tabela de serviços, promoções e fidelização para salões de beleza e barbearias. Tom descontraído e próximo do cliente.',
    tags: ['cabelo', 'corte', 'coloração', 'salão', 'barbearia', 'manicure'],
    toneOfVoice: 'Descontraído e próximo',
    objective: 'Agendamentos, divulgação de serviços e fidelização',
    welcomeMessage:
      'Oi! 💇 Seja bem-vindo(a)! Sou o assistente virtual do salão. Posso te ajudar a agendar um horário, ver nossos serviços e tirar dúvidas. O que você precisa hoje?',
    prompt: `Você é um assistente virtual de um salão de beleza ou barbearia. Seu papel é agendar horários, apresentar serviços e criar uma experiência próxima e agradável para o cliente.

COMPORTAMENTO:
- Use linguagem informal, simpática e próxima — como um amigo que trabalha no salão
- Quando o cliente quiser agendar, pergunte: qual serviço, qual profissional (se aplicável), data e horário de preferência
- Sempre confirme o agendamento com nome, serviço, data e hora
- Se não souber o valor exato, ofereça checar com o salão ou sugira uma avaliação gratuita
- Incentive combos e pacotes quando fizer sentido
- Lembre de confirmar com antecedência em caso de horários muito cheios
- Para cancelamentos, seja compreensivo e já ofereça reagendar

INTENÇÕES PRINCIPAIS:
1. Agendamento de serviços (corte, coloração, hidratação, manicure, etc.)
2. Tabela de preços e serviços disponíveis
3. Horários disponíveis e funcionamento
4. Cancelamento e reagendamento
5. Promoções, pacotes e fidelização`,
    automations: [
      {
        name: 'Agendar Horário',
        triggerValue: 'agendar',
        matchType: 'contains',
        responseText:
          'Boa! Qual serviço você quer agendar? E qual dia e horário você prefere? Já verifico a disponibilidade pra você!',
      },
      {
        name: 'Tabela de Preços',
        triggerValue: 'preço',
        matchType: 'contains',
        responseText:
          'Nossos valores variam conforme o serviço e o profissional. Me diz qual serviço você tem interesse que eu te passo os detalhes!',
      },
      {
        name: 'Horário de Funcionamento',
        triggerValue: 'horário',
        matchType: 'contains',
        responseText:
          'Quer saber nosso horário de funcionamento? Me pergunta que eu verifico para você. Aproveita e já agenda seu horário também! 😄',
      },
      {
        name: 'Cancelar / Reagendar',
        triggerValue: 'cancelar',
        matchType: 'contains',
        responseText:
          'Sem problema! Me informa seu nome e o horário agendado que eu cancelo ou reagendo pra você.',
      },
      {
        name: 'Serviços Disponíveis',
        triggerValue: 'serviço',
        matchType: 'contains',
        responseText:
          'Temos vários serviços disponíveis: corte, barba, coloração, hidratação, escova, manicure, pedicure e muito mais! Qual te interessa?',
      },
      {
        name: 'Promoção / Pacote',
        triggerValue: 'promoção',
        matchType: 'contains',
        responseText:
          'Temos pacotes e promoções especiais! Me conta o que você precisa que eu verifico as melhores opções pra você.',
      },
    ],
    suggestedTools: ['agenda', 'serviços'],
    setupChecklist: [
      {
        id: 'channel',
        label: 'Conectar canal de atendimento',
        description: 'WhatsApp, Instagram ou Facebook para receber mensagens',
        href: '/dashboard/integrations',
        required: true,
      },
      {
        id: 'business_hours',
        label: 'Preencher horários e localização do salão',
        description: 'Dias de funcionamento, horário e endereço — a IA responde com esses dados',
        href: '/dashboard/bots?tab=comportamento',
        required: true,
      },
      {
        id: 'services',
        label: 'Cadastrar serviços e preços',
        description: 'Adicione os serviços disponíveis para a IA apresentar corretamente',
        href: '/dashboard/services',
        required: false,
      },
      {
        id: 'prompt_review',
        label: 'Personalizar o prompt com o nome do salão',
        description: 'Substitua os exemplos pelo nome do seu salão e seus profissionais',
        href: '/dashboard/bots?tab=comportamento',
        required: false,
      },
    ],
    testScenarios: [
      {
        userMessage: 'Quero agendar um corte de cabelo para amanhã',
        expectedBehavior: 'Perguntas: serviço desejado, dia/horário, profissional — tom descontraído',
      },
      {
        userMessage: 'Quanto custa uma coloração completa?',
        expectedBehavior: 'Informa que vai verificar, sugere uma avaliação ou passa para o humano',
      },
      {
        userMessage: 'Preciso cancelar meu horário de sexta',
        expectedBehavior: 'Solicita nome e horário com empatia, já oferece reagendar',
      },
    ],
  },
];
