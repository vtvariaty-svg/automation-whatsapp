export interface BusinessTemplate {
  businessType: string;
  defaultServices: { name: string; durationMinutes: number }[];
  defaultAutomations: {
    name: string;
    triggerType: string;
    triggerValue: string;
    matchType: string;
    responseType: string;
    responseText: string;
  }[];
  defaultFaq: string;
  defaultPrompt: string;
}

export const businessTemplates: Record<string, BusinessTemplate> = {
  "Clínica Médica / Odontológica": {
    businessType: "Clínica Médica / Odontológica",
    defaultServices: [
      { name: "Consulta", durationMinutes: 30 },
      { name: "Avaliação", durationMinutes: 30 },
      { name: "Retorno", durationMinutes: 15 },
    ],
    defaultAutomations: [
      {
        name: "Informação de Preço",
        triggerType: "keyword",
        triggerValue: "preço,valor,custa",
        matchType: "contains",
        responseType: "text",
        responseText: "Para informações sobre valores, nossa equipe pode ajudar ou agendar uma avaliação. Gostaria de falar com um atendente?",
      },
      {
        name: "Informação de Horário",
        triggerType: "keyword",
        triggerValue: "hora,horário,funcionamento,aberto",
        matchType: "contains",
        responseType: "text",
        responseText: "Nosso horário de funcionamento é {business_hours}.",
      },
    ],
    defaultFaq: "Perguntas frequentes: Aceitam convênio? (Depende do profissional, consulte na recepção). Onde ficam? (Consulte nosso endereço atualizado no perfil).",
    defaultPrompt: "Você é o assistente virtual de uma clínica.\nAjude pacientes a marcar consultas, retornos e avaliações.\nSeja sempre empático e acolhedor.\nNunca dê diagnósticos médicos, apenas ajude com o agendamento e dúvidas administrativas.",
  },
  
  "Salão de Beleza / Barbearia": {
    businessType: "Salão de Beleza / Barbearia",
    defaultServices: [
      { name: "Corte", durationMinutes: 45 },
      { name: "Barba / Acabamento", durationMinutes: 30 },
      { name: "Coloração / Química", durationMinutes: 120 },
    ],
    defaultAutomations: [
      {
        name: "Tabela de Preços",
        triggerType: "keyword",
        triggerValue: "preço,valor,custa",
        matchType: "contains",
        responseType: "text",
        responseText: "Nossos valores dependem do profissional e do serviço exato. Posso verificar para você, basta me dizer qual serviço deseja agendar!",
      },
      {
        name: "Horário de Funcionamento",
        triggerType: "keyword",
        triggerValue: "hora,horário,funcionamento,aberto",
        matchType: "contains",
        responseType: "text",
        responseText: "Nosso horário de funcionamento é {business_hours}.",
      },
    ],
    defaultFaq: "Perguntas frequentes: Precisa agendar ou atende por ordem de chegada? (Recomendamos agendar para não esperar). Faz pacote? (Sim, temos pacotes mensais, consulte no balcão).",
    defaultPrompt: "Você é o assistente virtual de um salão de beleza/barbearia.\nAjude clientes a marcar horários e tirar dúvidas sobre nossos serviços.\nSeja simpático e moderno.",
  },

  "Restaurante / Delivery": {
    businessType: "Restaurante / Delivery",
    defaultServices: [
      { name: "Reserva de Mesa", durationMinutes: 120 },
      { name: "Encomenda para Evento", durationMinutes: 30 },
    ],
    defaultAutomations: [
      {
        name: "Cardápio",
        triggerType: "keyword",
        triggerValue: "cardápio,menu,opções,comer",
        matchType: "contains",
        responseType: "text",
        responseText: "Aqui está! Você pode me dizer o que deseja pedir ou posso enviar o link do nosso cardápio online.",
      },
      {
        name: "Endereço",
        triggerType: "keyword",
        triggerValue: "endereço,localização,onde",
        matchType: "contains",
        responseType: "text",
        responseText: "Nossa localização ou taxa de entrega depende do seu bairro. Me diga seu endereço para eu verificar!",
      },
    ],
    defaultFaq: "Perguntas frequentes: Fazem entrega? (Sim, via delivery próprio e apps). Aceita VR/VA? (Sim, aceitamos os principais vales refeição).",
    defaultPrompt: "Você é o assistente virtual de um restaurante/delivery.\nAjude clientes com pedidos para entrega, dúvidas sobre o cardápio e reservas de mesa.\nSe perguntarem recomendações, sugira os pratos mais populares.",
  },

  "Loja / E-commerce": {
    businessType: "Loja / E-commerce",
    defaultServices: [
      { name: "Atendimento Personalizado", durationMinutes: 30 },
      { name: "Suporte / Troca", durationMinutes: 30 },
    ],
    defaultAutomations: [
      {
        name: "Frete e Entrega",
        triggerType: "keyword",
        triggerValue: "frete,entrega,prazo",
        matchType: "contains",
        responseType: "text",
        responseText: "Enviamos para todo o Brasil! O prazo de entrega varia conforme o CEP. Se quiser, me passe seu CEP para eu calcular.",
      },
      {
        name: "Trocas",
        triggerType: "keyword",
        triggerValue: "troca,devolução,com defeito",
        matchType: "contains",
        responseType: "text",
        responseText: "Você tem até 7 dias para solicitar troca ou devolução de compras online. Posso te passar as instruções?",
      },
    ],
    defaultFaq: "Perguntas frequentes: Tem loja física? (Atualmente somos apenas online / e-commerce). Formas de pagamento? (Pix com desconto e cartão em até 12x).",
    defaultPrompt: "Você é o assistente virtual de uma loja/e-commerce.\nAjude clientes com dúvidas sobre produtos, prazos de entrega, código de rastreio e processo de trocas.",
  },

  "Outro": {
    businessType: "Outro",
    defaultServices: [
      { name: "Atendimento Especializado", durationMinutes: 30 },
    ],
    defaultAutomations: [
      {
        name: "Informação de Horário",
        triggerType: "keyword",
        triggerValue: "hora,horário,funcionamento,aberto",
        matchType: "contains",
        responseType: "text",
        responseText: "Nosso horário de atendimento é {business_hours}.",
      },
    ],
    defaultFaq: "",
    defaultPrompt: "Você é um assistente virtual focado em ótimo atendimento ao cliente.\nResponda as dúvidas de forma educada e ajude com informações sobre nossa empresa.",
  }
};
