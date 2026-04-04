import type { NicheContent, ContentVariants, VariantKey } from './types'

// ─── A/B Variant Config ───────────────────────────────────────────────────────
// Change ACTIVE_VARIANT to 'B' or 'C' to activate an alternative.
// 'A' = control (default live version).
export const ACTIVE_CLINICAS_VARIANT: VariantKey = 'A'

export const clinicasVariants: ContentVariants = {
  hero: {
    headline: {
      // A — operational clarity, no fear framing
      A: 'Atendimento automático 24h — sem sobrecarregar sua equipe',
      // B — trust-heavy, more professional tone
      B: 'O WhatsApp da sua clínica organizado, sem aumentar a equipe',
      // C — efficiency/outcome-first
      C: 'Menos faltas, menos carga manual — mais tempo para o que importa',
    },
    subheadline: {
      // A — mechanism-clear, feature-outcome balanced
      A: 'A Variaty confirma consultas, envia lembretes e responde dúvidas frequentes no WhatsApp da sua clínica — para que sua equipe cuide de pacientes, não de mensagens repetitivas.',
      // B — trust-first, consistency-focused
      B: 'Confirmações automáticas, lembretes de consulta e respostas a dúvidas frequentes — tudo funcionando com consistência, sem depender de esforço manual da equipe.',
      // C — efficiency-focused, reception-relief angle
      C: 'Automatize confirmações de consulta, lembretes e respostas iniciais no WhatsApp. Sua recepção ganha foco. Seus pacientes, mais consistência no atendimento.',
    },
    primaryCTA: {
      A: 'Ver demonstração gratuita',
      B: 'Ver como funciona',
      C: 'Agendar demonstração',
    },
  },
  finalCTA: {
    headline: {
      // A — opportunity framing, not loss certainty
      A: 'Seu WhatsApp pode trabalhar por você — antes, durante e depois do horário da clínica.',
      // B — professional, trust-heavy
      B: 'Uma recepção mais organizada começa pelo WhatsApp',
      // C — efficiency/ROI angle
      C: 'Sua recepção pode operar com mais eficiência — e seus pacientes percebem a diferença',
    },
    subheadline: {
      A: 'Organize confirmações, reduza faltas e melhore a experiência do paciente com um fluxo de atendimento mais eficiente no WhatsApp.',
      B: 'Automatize o que é repetitivo. Libere sua equipe para o que realmente exige atenção. Sem complicar a operação.',
      C: 'Confirmações automáticas, lembretes ativos e respostas rápidas para reduzir faltas e organizar o fluxo do WhatsApp da sua clínica.',
    },
  },
}

// ─── Content ──────────────────────────────────────────────────────────────────

export const clinicasContent: NicheContent = {
  theme: 'clinicas',
  slug: 'clinicas-consultorios',
  specialistWAText:
    'Olá, quero entender como a Variaty funciona para clínicas e consultórios.',
  crossNiche: {
    text: 'Seu negócio é da área de beleza? Veja a versão feita para salão, barbearia e estética.',
    href: '/whatsapp/servicos-de-beleza',
    ctaLabel: 'Ver para serviços de beleza →',
    targetNiche: 'beleza',
  },

  credibilityAnchors: [
    'Funciona com seu número de WhatsApp atual',
    'Ativo fora do horário da recepção',
    'Implantação orientada — sem parar a operação',
  ],

  hero: {
    badge: 'Clínicas · Consultórios · Saúde',
    headline: clinicasVariants.hero.headline[ACTIVE_CLINICAS_VARIANT],
    headlineBreak: 3,
    subheadline: clinicasVariants.hero.subheadline[ACTIVE_CLINICAS_VARIANT],
    primaryCTA: clinicasVariants.hero.primaryCTA[ACTIVE_CLINICAS_VARIANT],
    secondaryCTA: 'Como funciona',
    microcopy: 'Sem cartão de crédito. Implantação orientada. Funciona com seu WhatsApp atual.',
    trustBullets: [
      'Ativo 24h — inclusive fora do horário',
      'Menos faltas, agenda mais previsível',
      'Sem mudar o WhatsApp da clínica',
    ],
  },

  problem: {
    title: 'O WhatsApp da clínica consome tempo que deveria estar com o paciente',
    bullets: [
      'Paciente envia mensagem após o horário — e espera resposta até o dia seguinte',
      'Recepção gasta horas confirmando consultas uma a uma no WhatsApp',
      'Faltas aumentam quando o lembrete depende de alguém lembrar de enviar',
      'Toda troca de recepcionista quebra o padrão do atendimento',
      'A clínica transmite menos organização do que realmente tem',
    ],
  },

  solution: {
    title: 'Atendimento automático no WhatsApp, sem abrir mão do toque humano',
    description:
      'A Variaty assume as tarefas previsíveis — responder perguntas frequentes, confirmar consultas, enviar lembretes, acolher o paciente fora do horário. Sua equipe retoma o controle quando o contato precisa de atenção real.',
    contrast: {
      before: 'Recepção respondendo WhatsApp manualmente o dia todo',
      after: 'Equipe focada no paciente — automação cobre o resto',
    },
  },

  scenarios: {
    title: 'Como clínicas usam a Variaty no dia a dia',
    items: [
      {
        label: 'Recepção',
        headline: 'Sem acúmulo de mensagens pela manhã',
        description:
          'A Variaty responde automaticamente fora do horário. Ao abrir, a recepção encontra só o que precisa de atenção humana.',
        outcome: 'Menos pressão no início do turno',
      },
      {
        label: 'Confirmação de consulta',
        headline: 'Faltas caem sem esforço extra',
        description:
          'Lembrete automático vai para o paciente 24h antes — com opção de confirmar, reagendar ou avisar cancelamento direto pelo WhatsApp.',
        outcome: 'Agenda mais previsível',
      },
      {
        label: 'Paciente novo',
        headline: 'Primeira impressão organizada, mesmo às 22h',
        description:
          'Paciente vê o anúncio, manda mensagem e recebe resposta em segundos — com informações claras e próximo passo definido.',
        outcome: 'Mais conversão de contato em consulta',
      },
      {
        label: 'Dúvidas frequentes',
        headline: 'Sem repetir as mesmas respostas 10× por dia',
        description:
          'Convênios aceitos, horários, documentos, como chegar — respondidos de forma consistente, sem depender de quem está disponível.',
        outcome: 'Equipe com mais tempo para o que importa',
      },
    ],
  },

  howItWorks: {
    title: 'Do primeiro contato ao resultado — sem esforço manual',
    steps: [
      {
        title: 'Paciente entra em contato pelo WhatsApp',
        description: 'A qualquer hora — do anúncio, da indicação ou da busca direta.',
      },
      {
        title: 'A Variaty assume o atendimento inicial',
        description:
          'Responde em segundos, coleta o que precisa e direciona o fluxo correto.',
      },
      {
        title: 'Confirmações e lembretes acontecem automaticamente',
        description:
          'Sem depender de alguém lembrar de enviar — na frequência e no momento certos.',
      },
      {
        title: 'Sua equipe foca no que precisa de atenção humana',
        description:
          'Menos faltas, mais previsibilidade e uma recepção que trabalha com mais foco.',
      },
    ],
  },

  benefits: {
    title: 'O que muda na operação da sua clínica',
    items: [
      {
        title: 'Menos faltas, agenda mais previsível',
        description:
          'Lembrete automático com confirmação ativa — o paciente confirma, reagenda ou avisa no próprio WhatsApp.',
      },
      {
        title: 'Recepção focada, não sobrecarregada',
        description:
          'As mensagens repetitivas deixam de exigir atenção. Sua equipe entra quando a situação realmente precisa disso.',
      },
      {
        title: 'Atendimento 24h sem contratação extra',
        description:
          'Paciente que entra em contato após o horário recebe resposta imediata — mesmo quando a clínica está fechada.',
      },
      {
        title: 'Padrão consistente, independente da equipe',
        description:
          'O fluxo de atendimento não muda quando a recepcionista muda. Profissionalismo que não depende de pessoa.',
      },
      {
        title: 'Mais tempo para o que gera valor',
        description:
          'Consultas, procedimentos, relacionamento com paciente — não responder WhatsApp manualmente.',
      },
    ],
  },

  proof: {
    title: 'A Variaty é ideal para clínicas que querem crescer sem crescer o time',
    focusPoints: [
      'Clínica com 1 a 3 profissionais onde cada hora da recepção conta',
      'Consultório que quer responder mais rápido sem aumentar a carga da equipe',
      'Gestão que quer previsibilidade de agenda sem depender de processo manual',
      'Clínica que quer profissionalizar o atendimento sem complicar a operação',
    ],
  },

  objections: {
    title: 'Sua dúvida provavelmente está aqui',
    items: [
      {
        q: 'Tenho clínica pequena — isso serve para mim?',
        a: 'É justamente para você. Em clínicas pequenas, cada hora da recepção conta mais. Automatizar confirmações e respostas frequentes libera tempo direto para o que gera resultado — sem precisar de estrutura grande.',
      },
      {
        q: 'Não quero que o atendimento fique frio ou robótico.',
        a: 'A automação entra nas tarefas previsíveis — confirmação, lembrete, FAQ. O contato humano continua onde faz diferença. O paciente percebe mais velocidade e consistência, não menos cuidado.',
      },
      {
        q: 'E se o paciente perceber que é automático?',
        a: 'Confirmação de consulta por WhatsApp é natural e esperada por pacientes. O que gera atrito é esperar horas por uma resposta simples. A automação entrega o que o paciente precisa: rapidez, clareza e próximo passo definido.',
      },
      {
        q: 'Já usamos WhatsApp — como isso é diferente?',
        a: 'Usar WhatsApp e ter um WhatsApp organizado são coisas diferentes. A Variaty transforma o canal que você já usa em uma operação estruturada — sem mudar de ferramenta, sem complicar.',
      },
      {
        q: 'Quanto tempo leva para funcionar?',
        a: 'A implantação é orientada e estruturada. Você não precisa parar a clínica para configurar. O processo é feito junto com você, no ritmo da sua operação.',
      },
    ],
  },

  faq: {
    items: [
      {
        q: 'A automação vai substituir minha recepcionista?',
        a: 'Não. A automação cuida do que é repetitivo e previsível — confirmações, lembretes, dúvidas frequentes. Sua equipe continua presente no atendimento que requer julgamento e empatia. O ganho é liberar tempo, não eliminar pessoas.',
      },
      {
        q: 'Funciona para consultório pequeno com um profissional?',
        a: 'Sim — e é onde o impacto tende a ser maior. Quando o profissional faz tudo sozinho, automatizar o WhatsApp libera tempo que estava sendo gasto com tarefas que não precisam de intervenção humana.',
      },
      {
        q: 'Preciso mudar meu WhatsApp atual?',
        a: 'Não. A Variaty funciona junto com seu número existente. Você não muda de ferramenta — só deixa de depender do esforço manual para as partes que podem ser automatizadas.',
      },
      {
        q: 'Posso começar com só um fluxo?',
        a: 'Sim. Você pode começar com confirmações de consulta e expandir conforme se sentir confortável. Não precisa implementar tudo de uma vez.',
      },
      {
        q: 'E durante as horas que não tenho recepção?',
        a: 'Exatamente para isso que a automação foi feita. Enquanto sua clínica está fechada, a Variaty continua respondendo, coletando informações e preparando o fluxo para quando você abrir.',
      },
    ],
  },

  finalCTA: {
    headline: clinicasVariants.finalCTA.headline[ACTIVE_CLINICAS_VARIANT],
    subheadline: clinicasVariants.finalCTA.subheadline[ACTIVE_CLINICAS_VARIANT],
    primaryCTA: clinicasVariants.hero.primaryCTA[ACTIVE_CLINICAS_VARIANT],
    secondaryCTA: 'Falar com especialista',
  },

  stickyMobileCTA: 'Ver demonstração',
}
