import OpenAI from "openai";
import { getAvailableSlots, createAppointment, getServices } from "./schedulingService";

/**
 * Envia mensagem para OpenAI e executa funções de agendamento se necessário.
 * @param {string} messageText 
 * @param {string} apiKey 
 * @param {string} aiPrompt 
 * @param {string} businessHours 
 * @param {string} tenantId 
 * @param {string} customerPhone 
 * @returns {Promise<string>}
 */
export async function generateAIResponse(messageText, apiKey, aiPrompt, businessHours, tenantId, customerPhone) {
  const openai = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });

  // Instrução extra forçada para agendamento
  const schedulingInstructions = `
REGRA DE AGENDAMENTO:
Você tem a capacidade de agendar horários para os clientes.
Se o cliente pedir para agendar um horário, voçê DEVE:
1. Perguntar qual serviço o cliente deseja (se já não tiver informado).
2. Perguntar qual dia (data) o cliente tem interesse.
3. Usar a ferramenta "check_availability" passando a data (formato YYYY-MM-DD) e o nome do serviço para ver os horários livres.
4. Mostrar os horários livres para o cliente e pedir para ele escolher um.
5. Quando o cliente escolher o horário, use a ferramenta "book_appointment" para confirmar e criar o agendamento no sistema.
6. Sempre responda ao usuário de forma amigável após concluir.
Hoje é dia ${new Date().toLocaleDateString('pt-BR')}
`;

  const systemMessage = `
${aiPrompt || 'Você é um assistente virtual da empresa. Responda cordialmente aos clientes.'}

---
DIRETRIZES TÉCNICAS E REGRAS:
1. Siga estritamente as instruções da sua persona.
2. Seja honesto e direto.
${businessHours ? `\nINFORMAÇÕES DE ATENDIMENTO:\nHorário de atendimento: ${businessHours}` : ''}
${schedulingInstructions}
  `.trim();

  const tools = [
    {
      type: "function",
      function: {
        name: "check_availability",
        description: "Consulta os horários disponíveis para um determinado serviço em uma data específica.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "A data desejada no formato YYYY-MM-DD (ex: 2024-05-20)",
            },
            serviceName: {
              type: "string",
              description: "O nome do serviço que o cliente quer agendar",
            },
          },
          required: ["date", "serviceName"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "book_appointment",
        description: "Cria um agendamento oficial no sistema quando o cliente confirma o horário.",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "A data do agendamento (YYYY-MM-DD)",
            },
            time: {
              type: "string",
              description: "O horário escolhido (ex: 14:30)",
            },
            serviceName: {
              type: "string",
              description: "O serviço escolhido",
            },
            customerName: {
              type: "string",
              description: "O nome do cliente (pergunte se não souber, ou envie Vazio)",
            }
          },
          required: ["date", "time", "serviceName"],
        },
      },
    }
  ];

  try {
    const messages = [
      { role: "system", content: systemMessage.trim() },
      { role: "user", content: `Mensagem do cliente:\n${messageText}` },
    ];

    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fallback to mini can be risky for tools but generally works well. If gpt-4 or 4o is available it's better. We use 4o-mini
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    let messageObj = response.choices[0].message;

    // Lida com tool calls (funções)
    if (messageObj.tool_calls) {
      messages.push(messageObj); // Add assistant's tool call request to history

      for (const toolCall of messageObj.tool_calls) {
        if (toolCall.function.name === "check_availability") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            const slots = await getAvailableSlots(tenantId, args.date, args.serviceName);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ available_slots: slots }),
            });
          } catch (e) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: e.message || "Erro ao consultar horários" }),
            });
          }
        } 
        else if (toolCall.function.name === "book_appointment") {
          const args = JSON.parse(toolCall.function.arguments);
          try {
            await createAppointment(tenantId, {
              phone: customerPhone,
              customerName: args.customerName || "Cliente WhatsApp",
              service: args.serviceName,
              date: args.date,
              time: args.time
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: true, message: `Agendado com sucesso para ${args.date} às ${args.time}` }),
            });
          } catch (e) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ success: false, error: "Falha ao gravar agendamento" }),
            });
          }
        }
      }

      // Segunda chamada com o resultado das funções
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
      });

      return secondResponse.choices[0].message.content;
    }

    return messageObj.content;
  } catch (error) {
    console.error("Erro ao gerar resposta da IA com Functions:", error);
    return "Desculpe, ocorreu um erro interno ao tentar processar ou agendar.";
  }
}
