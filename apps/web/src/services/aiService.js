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

  const systemMessage = `Você é assistente da empresa.

Instruções:
${aiPrompt || 'Responda cordialmente.'}

${businessHours ? `Horário de atendimento: ${businessHours}` : ''}`;

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
