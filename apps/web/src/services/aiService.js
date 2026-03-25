import OpenAI from "openai";
import { recordAiUsage } from "./billingService";

/**
 * Envia mensagem para OpenAI e retorna resposta de texto puro.
 *
 * A IA é uma camada de linguagem e persuasão — NÃO executa ações transacionais.
 * Agendamentos, pagamentos, pedidos e catálogo são geridos por serviços determinísticos.
 *
 * @param {string} messageText
 * @param {string} apiKey
 * @param {string} aiPrompt
 * @param {string} businessHours
 * @param {string} tenantId
 * @param {string} customerPhone
 * @param {string} customerContext
 * @returns {Promise<string>}
 */
export async function generateAIResponse(messageText, apiKey, aiPrompt, businessHours, tenantId, customerPhone, customerContext = '') {
  const openai = new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });

  const systemMessage = `
${aiPrompt || 'Você é um assistente virtual da empresa. Responda cordialmente aos clientes.'}
${customerContext ? `\n---\n${customerContext}\n---` : ''}

---
DIRETRIZES TÉCNICAS E REGRAS:
1. Siga estritamente as instruções da sua persona.
2. Seja honesto e direto.
3. Você NÃO pode criar agendamentos, pagamentos ou pedidos diretamente. Para essas ações, oriente o cliente a seguir o fluxo normal (pedir para agendar, informar o serviço desejado, etc.) — o sistema cuidará da execução.
4. Quando o cliente perguntar sobre produtos, serviços ou catálogo, apresente as informações disponíveis no contexto acima. Se não houver informações, oriente o cliente a perguntar sobre "catálogo" ou "produtos".
${businessHours ? `\nINFORMAÇÕES DE ATENDIMENTO:\nHorário de atendimento: ${businessHours}` : ''}
Hoje é dia ${new Date().toLocaleDateString('pt-BR')}
  `.trim();

  try {
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Mensagem do cliente:\n${messageText}` },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    const messageObj = response.choices[0].message;

    // Registra uso de tokens (non-blocking)
    try { await recordAiUsage(tenantId, response.usage?.total_tokens || 1); } catch (e) { console.error('recordAiUsage falhou:', e.message); }

    return messageObj.content;
  } catch (error) {
    console.error("Erro ao gerar resposta da IA:", error);
    return "Desculpe, ocorreu um erro interno ao tentar processar sua mensagem.";
  }
}
