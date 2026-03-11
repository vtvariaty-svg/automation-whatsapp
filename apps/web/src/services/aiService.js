import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Envia mensagem para OpenAI e retorna resposta simples.
 * @param {string} messageText 
 * @returns {Promise<string>}
 */
export async function generateAIResponse(messageText, apiKey, aiPrompt, businessHours) {
  const openai = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });

  const systemMessage = `
${aiPrompt || 'Você é um assistente virtual da empresa. Responda cordialmente aos clientes.'}

---
DIRETRIZES TÉCNICAS E REGRAS:
1. Siga estritamente as instruções da sua persona (descritas no início deste prompt).
2. Se não houver resposta para a pergunta do cliente nas informações acima, seja honesto e diga que não tem essa informação no momento.
${businessHours ? `\nINFORMAÇÕES DE ATENDIMENTO:\nHorário de atendimento: ${businessHours}` : ''}
  `.trim();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage.trim() },
        { role: "user", content: `Mensagem do cliente:\n${messageText}` },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao gerar resposta da IA:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação.";
  }
}
