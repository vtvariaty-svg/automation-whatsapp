import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Envia mensagem para OpenAI e retorna resposta simples.
 * @param {string} messageText 
 * @returns {Promise<string>}
 */
export async function generateAIResponse(messageText) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um assistente útil e educado que responde mensagens de clientes no WhatsApp." },
        { role: "user", content: messageText },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao gerar resposta da IA:", error);
    return "Desculpe, ocorreu um erro ao processar sua solicitação.";
  }
}
