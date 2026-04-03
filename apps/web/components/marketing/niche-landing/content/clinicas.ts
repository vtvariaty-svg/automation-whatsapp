import type { NicheContent } from './types'

export const clinicasContent: NicheContent = {
  theme: 'clinicas',
  slug: 'clinicas-consultorios',
  specialistWAText:
    'Olá, quero entender a automação da Variaty para clínicas e consultórios.',
  crossNiche: {
    text: 'Seu negócio é da área de beleza? Veja a versão feita para salão, barbearia e estética.',
    href: '/whatsapp/servicos-de-beleza',
    ctaLabel: 'Ver para serviços de beleza',
    targetNiche: 'beleza',
  },

  hero: {
    badge: 'Clínicas · Consultórios · Saúde',
    headline: 'Sua clínica pode atender melhor no WhatsApp sem sobrecarregar a recepção',
    headlineBreak: 5,
    subheadline:
      'Automatize confirmações, lembretes, respostas iniciais e organização do contato com pacientes para reduzir faltas, ganhar tempo e passar mais profissionalismo no atendimento.',
    primaryCTA: 'Agendar demonstração',
    secondaryCTA: 'Ver como funciona',
    microcopy:
      'Sem complicação. Implantação orientada. Ideal para clínicas, consultórios e profissionais da saúde.',
    trustBullets: ['Atendimento mais rápido', 'Menos faltas', 'Mais organização no WhatsApp'],
  },

  problem: {
    title: 'O WhatsApp da clínica não pode virar um gargalo operacional',
    bullets: [
      'Confirmação manual toma tempo da recepção',
      'Pacientes esquecem horário ou respondem em cima da hora',
      'Muitas perguntas repetidas no WhatsApp',
      'Atendimento fica inconsistente entre membros da equipe',
      'A clínica parece menos organizada do que realmente é',
    ],
  },

  solution: {
    title: 'Transforme o WhatsApp em um canal organizado de atendimento',
    description:
      'Em vez de responder manualmente cada mensagem repetitiva, a sua equipe passa a focar no que realmente importa — o contato humano e o cuidado com o paciente.',
  },

  howItWorks: {
    title: 'Como funciona na prática',
    steps: [
      {
        title: 'O paciente entra em contato pelo WhatsApp',
        description: 'Ele chega por qualquer origem — indicação, anúncio ou busca direta.',
      },
      {
        title: 'As etapas repetitivas deixam de ser manuais',
        description:
          'Confirmações, lembretes e respostas a dúvidas frequentes rodam de forma automática.',
      },
      {
        title: 'Sua equipe ganha tempo para o que importa',
        description: 'A recepção foca em situações que precisam de atenção humana real.',
      },
      {
        title: 'A clínica melhora previsibilidade e experiência',
        description:
          'Menos faltas, mais organização e um atendimento mais consistente para o paciente.',
      },
    ],
  },

  benefits: {
    title: 'O que sua clínica ganha com isso',
    items: [
      {
        title: 'Menos faltas e mais previsibilidade',
        description:
          'Lembretes automáticos reduzem ausências e facilitam a reorganização da agenda.',
      },
      {
        title: 'Recepção menos sobrecarregada',
        description:
          'Sem precisar responder cada mensagem repetitiva, a equipe tem mais tempo para o que exige atenção.',
      },
      {
        title: 'Resposta mais rápida',
        description: 'O paciente recebe retorno imediato, mesmo fora do horário da recepção.',
      },
      {
        title: 'Mais organização no atendimento',
        description: 'Fluxo claro e consistente, independente de quem está na recepção.',
      },
      {
        title: 'Imagem mais profissional',
        description: 'Comunicação organizada e fluida transmite mais confiança para o paciente.',
      },
    ],
  },

  proof: {
    title: 'Feito para clínicas que querem profissionalizar o atendimento no WhatsApp',
    focusPoints: [
      'Organizar o fluxo de atendimento sem complicar a operação',
      'Reduzir carga manual da recepção',
      'Dar respostas mais rápidas ao paciente',
      'Criar experiência mais consistente e profissional',
    ],
  },

  objections: {
    title: 'Mas isso serve para a minha clínica?',
    items: [
      {
        q: 'Tenho clínica pequena.',
        a: 'A automação é ainda mais valiosa em clínicas pequenas, onde cada hora da recepção conta. Você não precisa de uma estrutura grande para se beneficiar de um atendimento mais organizado.',
      },
      {
        q: 'Não quero atendimento impessoal.',
        a: 'A automação cuida das tarefas repetitivas — confirmação, lembrete, resposta de FAQ. O contato humano continua quando realmente importa. O paciente percebe mais rapidez, não menos cuidado.',
      },
      {
        q: 'Parece difícil de implementar.',
        a: 'A implantação é orientada e o processo é estruturado para você não precisar parar a operação. Você entra com o conhecimento do seu fluxo; a gente ajuda a organizar isso no WhatsApp.',
      },
      {
        q: 'Já usamos WhatsApp hoje.',
        a: 'Ótimo — isso significa que o canal já é parte da operação. O próximo passo é deixar de depender de esforço manual para as partes que podem ser automatizadas.',
      },
      {
        q: 'Minha recepção já dá conta.',
        a: 'Se a recepção dá conta, imagine o que ela conseguiria fazer se não precisasse responder confirmações e lembretes manualmente. O ganho é liberar tempo para o atendimento que realmente precisa de atenção humana.',
      },
    ],
  },

  faq: {
    items: [
      {
        q: 'A automação substitui minha equipe de recepção?',
        a: 'Não. A automação cuida das tarefas repetitivas e previsíveis, como confirmações e respostas a perguntas frequentes. A equipe continua responsável pelo atendimento que exige julgamento e contato humano.',
      },
      {
        q: 'Funciona para clínica pequena com só um profissional?',
        a: 'Sim, e pode ser ainda mais impactante. Em consultórios pequenos, o profissional muitas vezes faz tudo sozinho. Automação do WhatsApp libera tempo que seria gasto em tarefas manuais repetitivas.',
      },
      {
        q: 'O paciente vai perceber que é automático?',
        a: 'Depende de como você configura. Para confirmações e lembretes, é natural e esperado. O importante é que o fluxo seja fluido e útil — o que a automação permite justamente porque é mais consistente do que a resposta manual.',
      },
      {
        q: 'Posso começar só com confirmações de consulta?',
        a: 'Sim. Você pode começar com um fluxo específico e expandir conforme se sentir confortável. Não é necessário implementar tudo de uma vez.',
      },
      {
        q: 'Preciso mudar todo o meu processo atual?',
        a: 'Não. O objetivo é encaixar a automação no fluxo que você já tem, não refazer tudo. A configuração parte do que você já faz hoje e organiza isso de forma mais eficiente.',
      },
    ],
  },

  finalCTA: {
    headline:
      'Se o WhatsApp da sua clínica já virou parte da operação, ele precisa trabalhar a seu favor',
    subheadline:
      'Organize confirmações, reduza carga manual da recepção e melhore a experiência do paciente com um fluxo mais eficiente no WhatsApp.',
    primaryCTA: 'Agendar demonstração',
    secondaryCTA: 'Falar com especialista',
  },

  stickyMobileCTA: 'Agendar demonstração',
}
