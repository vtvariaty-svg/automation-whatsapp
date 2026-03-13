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
  "clínica": {
    businessType: "clínica",
    defaultServices: [
      { name: "Consulta", durationMinutes: 30 },
      { name: "Avaliação", durationMinutes: 30 },
      { name: "Retorno", durationMinutes: 15 },
    ],
    defaultAutomations: [
      {
        name: "Preço",
        triggerType: "keyword",
        triggerValue: "preço",
        matchType: "contains",
        responseType: "text",
        responseText: "Os valores dependem do procedimento. Posso ajudar a agendar uma avaliação.",
      },
      {
        name: "Horário",
        triggerType: "keyword",
        triggerValue: "horário",
        matchType: "contains",
        responseType: "text",
        responseText: "Nosso horário de atendimento é {business_hours}.",
      },
    ],
    defaultFaq: "",
    defaultPrompt: "Você é assistente virtual de uma clínica.\nAjude pacientes a agendar consultas e tirar dúvidas.",
  },
  
  "salão": {
    businessType: "salão",
    defaultServices: [
      { name: "Corte", durationMinutes: 45 },
      { name: "Barba", durationMinutes: 30 },
      { name: "Hidratação", durationMinutes: 60 },
    ],
    defaultAutomations: [
      {
        name: "Preço",
        triggerType: "keyword",
        triggerValue: "preço",
        matchType: "contains",
        responseType: "text",
        responseText: "Posso verificar os valores dos serviços para você.",
      },
      {
        name: "Horário",
        triggerType: "keyword",
        triggerValue: "horário",
        matchType: "contains",
        responseType: "text",
        responseText: "Nosso horário de funcionamento é {business_hours}.",
      },
    ],
    defaultFaq: "",
    defaultPrompt: "Você é assistente virtual de um salão de beleza.\nAjude clientes a marcar horários.",
  },

  "restaurante": {
    businessType: "restaurante",
    defaultServices: [
      { name: "Reserva", durationMinutes: 120 },
      { name: "Pedido", durationMinutes: 30 },
      { name: "Informações do cardápio", durationMinutes: 15 },
    ],
    defaultAutomations: [
      {
        name: "Cardápio",
        triggerType: "keyword",
        triggerValue: "cardápio",
        matchType: "contains",
        responseType: "text",
        responseText: "Posso ajudar com informações do cardápio.",
      },
      {
        name: "Endereço",
        triggerType: "keyword",
        triggerValue: "endereço",
        matchType: "contains",
        responseType: "text",
        responseText: "Nosso endereço é {business_address}.",
      },
    ],
    defaultFaq: "",
    defaultPrompt: "Você é assistente virtual de um restaurante.\nAjude clientes com reservas e pedidos.",
  },

  "ecommerce": {
    businessType: "ecommerce",
    defaultServices: [
      { name: "Atendimento", durationMinutes: 30 },
      { name: "Suporte", durationMinutes: 30 },
    ],
    defaultAutomations: [
      {
        name: "Frete",
        triggerType: "keyword",
        triggerValue: "frete",
        matchType: "contains",
        responseType: "text",
        responseText: "O valor do frete depende do seu CEP. Posso verificar para você.",
      },
      {
        name: "Troca",
        triggerType: "keyword",
        triggerValue: "troca",
        matchType: "contains",
        responseType: "text",
        responseText: "Nossa política de trocas está disponível no site.",
      },
    ],
    defaultFaq: "",
    defaultPrompt: "Você é assistente virtual de um e-commerce.\nAjude clientes com dúvidas sobre produtos e entregas.",
  },

  "outro": {
    businessType: "outro",
    defaultServices: [
      { name: "Atendimento Especializado", durationMinutes: 30 },
    ],
    defaultAutomations: [
      {
        name: "Horário",
        triggerType: "keyword",
        triggerValue: "horário",
        matchType: "contains",
        responseType: "text",
        responseText: "Nosso horário de atendimento é {business_hours}.",
      },
    ],
    defaultFaq: "",
    defaultPrompt: "Você é um assistente virtual focado em ótimo atendimento ao cliente.\nResponda as dúvidas de forma educada e ajude com informações sobre nossa empresa.",
  }
};
