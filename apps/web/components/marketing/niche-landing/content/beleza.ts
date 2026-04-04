import type { NicheContent, ContentVariants, VariantKey } from './types'

// ─── A/B Variant Config ───────────────────────────────────────────────────────
// Change ACTIVE_VARIANT to 'B' or 'C' to activate an alternative.
// 'A' = control (default live version).
export const ACTIVE_BELEZA_VARIANT: VariantKey = 'A'

export const belezaVariants: ContentVariants = {
  hero: {
    headline: {
      // A — aspirational, agenda-focused (control)
      A: 'Sua agenda mais cheia começando pelo WhatsApp',
      // B — speed/return-oriented
      B: 'Responda primeiro. Agende mais. Trabalhe menos no celular.',
      // C — revenue/recurrence-focused
      C: 'Agenda cheia, clientes voltando, WhatsApp trabalhando por você',
    },
    subheadline: {
      // A — mechanism-clear with outcome balance (control)
      A: 'A Variaty responde clientes imediatamente, confirma agendamentos, envia lembretes e reengaja quem sumiu — para você focar em atender, não em ficar no celular.',
      // B — speed + mechanics first
      B: 'A Variaty responde em segundos, confirma agendamentos, lembra clientes antes do horário e reengaja quem parou de agendar — enquanto você atende.',
      // C — outcome-first framing
      C: 'Com a Variaty, seu negócio de beleza responde em segundos, mantém clientes engajados e preenche buracos na agenda — automaticamente, sem você parar de atender.',
    },
    primaryCTA: {
      A: 'Quero ver funcionando',
      B: 'Ver a demonstração',
      C: 'Começar agora',
    },
  },
  finalCTA: {
    headline: {
      // A — urgency, loss-aware (appropriate for beauty, commercially direct)
      A: 'Cada cliente que não recebeu resposta rápida foi embora. Quantos já foram?',
      // B — opportunity-framing, speed-oriented
      B: 'Cada mensagem sem resposta rápida é uma oportunidade que vai embora',
      // C — aspirational, growth-oriented
      C: 'Sua agenda pode ser mais consistente. Seus clientes podem voltar com mais frequência.',
    },
    subheadline: {
      A: 'Comece a responder em segundos, manter clientes e encher a agenda — sem parar de atender para ficar no celular.',
      B: 'Automatize respostas, confirmações e reengajamento. Sua agenda mais cheia — com menos tempo preso no celular.',
      C: 'Automação prática para negócios de beleza: mais agendamentos, mais recorrência, menos tempo operacional no WhatsApp.',
    },
  },
}

// ─── Content ──────────────────────────────────────────────────────────────────

export const belezaContent: NicheContent = {
  theme: 'beleza',
  slug: 'servicos-de-beleza',
  specialistWAText:
    'Olá, quero entender como a Variaty funciona para salão, barbearia ou estética.',
  crossNiche: {
    text: 'Seu negócio é clínica ou consultório? Veja a versão feita para atendimento em saúde.',
    href: '/whatsapp/clinicas-consultorios',
    ctaLabel: 'Ver para clínicas e consultórios →',
    targetNiche: 'clinicas',
  },

  credibilityAnchors: [
    'Responde em segundos — de dia e de madrugada',
    'Reengaja clientes parados automaticamente',
    'Implantação guiada — sem parar de atender',
  ],

  hero: {
    badge: 'Salão · Barbearia · Estética · Manicure',
    headline: belezaVariants.hero.headline[ACTIVE_BELEZA_VARIANT],
    headlineBreak: 5,
    subheadline: belezaVariants.hero.subheadline[ACTIVE_BELEZA_VARIANT],
    primaryCTA: belezaVariants.hero.primaryCTA[ACTIVE_BELEZA_VARIANT],
    secondaryCTA: 'Como funciona',
    microcopy:
      'Para salão, barbearia, estética, manicure e qualquer negócio de beleza. Sem complicação.',
    trustBullets: [
      'Responde em segundos — 24h por dia',
      'Clientes parados voltam a agendar',
      'Menos tempo preso no celular',
    ],
  },

  problem: {
    title: 'A agenda vazia não é falta de cliente — é falta de seguimento',
    bullets: [
      'Cliente manda mensagem às 21h e vai para o concorrente que responde primeiro',
      'Agenda com buracos porque faltou lembrar o cliente de confirmar',
      'Cliente que veio uma vez e sumiu — nunca teve ninguém para trazer de volta',
      'Horas do dia indo embora respondendo as mesmas perguntas de sempre',
      'Você trabalha preso no celular no mesmo ritmo em que está atendendo',
    ],
  },

  solution: {
    title: 'WhatsApp trabalhando por você, mesmo quando você está com alguém na cadeira',
    description:
      'A Variaty responde enquanto você atende, confirma enquanto você descansa e lembra quem sumiu enquanto você foca em crescer. O que era operação manual vira resultado automático.',
    contrast: {
      before: 'Você no celular entre atendimentos, perdendo tempo e cliente',
      after: 'Variaty no WhatsApp. Você na cadeira, gerando receita.',
    },
  },

  scenarios: {
    title: 'Como negócios de beleza usam a Variaty no dia a dia',
    items: [
      {
        label: 'Resposta rápida',
        headline: 'Cliente às 20h recebe resposta em segundos',
        description:
          'Enquanto você está em casa ou atendendo, a Variaty responde com disponibilidade, preços e próximo passo — antes que o cliente vá embora.',
        outcome: 'Mais conversão de contato em agendamento',
      },
      {
        label: 'Confirmação automática',
        headline: 'Buracos na agenda caem com confirmação ativa',
        description:
          'Lembrete vai automático antes do horário marcado. Cliente confirma, reagenda ou avisa cancelamento direto no WhatsApp — sem você fazer nada.',
        outcome: 'Menos no-show, agenda mais previsível',
      },
      {
        label: 'Cliente que sumiu',
        headline: 'Quem não volta é lembrado no momento certo',
        description:
          'A Variaty identifica clientes que não agendaram há um tempo e envia mensagem personalizada — automaticamente. Sem você precisar lembrar de cada um.',
        outcome: 'Mais recorrência sem esforço',
      },
      {
        label: 'Autônomo solo',
        headline: 'Trabalha por você quando você não pode responder',
        description:
          'Para profissional que trabalha sozinho, a automação funciona como um assistente que nunca para — respondendo, confirmando e mantendo o contato ativo.',
        outcome: 'Operação independente da sua disponibilidade',
      },
    ],
  },

  howItWorks: {
    title: 'Como funciona no dia a dia do seu negócio',
    steps: [
      {
        title: 'Cliente manda mensagem — recebe resposta em segundos',
        description: 'A qualquer hora. A Variaty responde com o que ele precisa e mantém o interesse.',
      },
      {
        title: 'Perguntas repetitivas saem do seu colo',
        description:
          'Horário, preço, disponibilidade — respondidos automaticamente. Você só entra quando necessário.',
      },
      {
        title: 'Confirmações e lembretes acontecem sem você fazer nada',
        description:
          'O sistema confirma, lembra e mantém o agendamento vivo. Menos cancelamento de última hora.',
      },
      {
        title: 'Clientes parados recebem reengajamento automático',
        description:
          'A Variaty identifica quem sumiu e manda mensagem no momento certo para trazer de volta.',
      },
    ],
  },

  benefits: {
    title: 'O que muda no seu negócio de beleza',
    items: [
      {
        title: 'Mais agendamentos sem mais esforço',
        description:
          'Resposta imediata aumenta a conversão. Cliente que recebe atenção rápida agenda — o que espera vai para o concorrente.',
      },
      {
        title: 'Clientes que voltam com mais frequência',
        description:
          'Reengajamento automático para quem não agendou há um tempo. Sem você lembrar de cada contato.',
      },
      {
        title: 'Agenda com menos buracos',
        description:
          'Confirmação automática com resposta ativa — cliente confirma, avisa ou reagenda sem você ligar para cada um.',
      },
      {
        title: 'Menos tempo preso no celular',
        description:
          'Sem responder as mesmas perguntas manualmente. Cada minuto ganho é tempo no atendimento, não no WhatsApp.',
      },
      {
        title: 'Faturamento mais previsível',
        description:
          'Agenda consistente gera receita previsível. Recorrência de clientes é a base de um negócio que cresce sem depender só de novos leads.',
      },
    ],
  },

  proof: {
    title: 'Para quem a Variaty faz sentido de verdade',
    focusPoints: [
      'Profissional autônomo cansado de perder cliente por demora na resposta',
      'Salão que quer crescer sem contratar mais atendentes',
      'Negócio com agenda vazia quando deveria estar mais cheia',
      'Dono que quer parar de trabalhar no celular e começar a trabalhar no negócio',
    ],
  },

  objections: {
    title: 'Tem dúvidas? Essas são as mais comuns',
    items: [
      {
        q: 'Meu salão é pequeno — isso serve para mim?',
        a: 'Pequeno é onde a automação faz mais diferença. Com menos equipe, cada mensagem não respondida é um cliente perdido. A Variaty atende o que você não consegue atender sozinho — sem custo de contratação.',
      },
      {
        q: 'Tenho medo de parecer robótico para o cliente.',
        a: 'O que o cliente percebe é velocidade. Resposta rápida = negócio organizado = profissional confiável. A automação cuida das perguntas previsíveis. Você continua presente no atendimento que importa.',
      },
      {
        q: 'Não sei se vale o investimento.',
        a: 'Quantos clientes você perde por não responder rápido? Quantos não voltam porque ninguém lembrou? Se a agenda tem buracos que poderiam ser preenchidos, o retorno vem com os primeiros agendamentos recuperados.',
      },
      {
        q: 'Eu já respondo o WhatsApp.',
        a: 'Ótimo — mas quanto tempo isso consome? Cada mensagem manual é tempo tirado do atendimento. A automação não tira a tarefa de você. Ela faz a tarefa por você, no horário que você não conseguiria responder.',
      },
      {
        q: 'É difícil de configurar?',
        a: 'Não. A implantação é guiada — você não precisa entender de tecnologia. O processo começa pelo seu fluxo atual e a gente organiza junto, sem parar a operação.',
      },
    ],
  },

  faq: {
    items: [
      {
        q: 'Funciona para profissional autônomo que trabalha sozinho?',
        a: 'Sim — e é um dos casos de maior impacto. Quem trabalha sozinho não tem ninguém para delegar mensagens. A Variaty age como um assistente sempre disponível, sem custo de contratação.',
      },
      {
        q: 'Como funciona o reengajamento de clientes?',
        a: 'Você define o critério — por exemplo, clientes que não agendam há 30 dias. A Variaty dispara mensagem automática no momento certo, com texto personalizado para trazer o cliente de volta.',
      },
      {
        q: 'Preciso parar tudo para configurar?',
        a: 'Não. A configuração é feita junto com você sem interromper a operação. O processo é estruturado para ter impacto rápido sem virar um projeto demorado.',
      },
      {
        q: 'Posso começar só com confirmações de agendamento?',
        a: 'Sim. Você começa com o que faz mais sentido agora e expande quando quiser. Não é tudo ou nada.',
      },
      {
        q: 'Serve para barbearia, não só salão?',
        a: 'Sim — barbearia, estética, manicure, lash, sobrancelha, massagem. Qualquer negócio de beleza que usa WhatsApp para agendar e se comunicar com clientes.',
      },
    ],
  },

  finalCTA: {
    headline: belezaVariants.finalCTA.headline[ACTIVE_BELEZA_VARIANT],
    subheadline: belezaVariants.finalCTA.subheadline[ACTIVE_BELEZA_VARIANT],
    primaryCTA: belezaVariants.hero.primaryCTA[ACTIVE_BELEZA_VARIANT],
    secondaryCTA: 'Falar com especialista',
  },

  stickyMobileCTA: 'Quero ver funcionando',
}
