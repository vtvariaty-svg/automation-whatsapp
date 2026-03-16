import { createOpenAIClient, withRetry } from '@whatsapp-automation/shared';
import { getTenantConfig, listProducts } from './tenantService';

const openai = createOpenAIClient();

export const generateResponse = async (tenantId: string, userMessage: string) => {
  const config = await getTenantConfig(tenantId);
  const products = await listProducts(tenantId);

  const productList = products.map((p: any) => `- ${p.name}: ${p.description} (R$ ${p.price})`).join('\n');

  const systemPrompt = `
${config.aiPrompt ? config.aiPrompt : `Você é um assistente virtual da empresa ${config.name}. Responda cordialmente aos clientes.`}

---
INFORMAÇÕES DA EMPRESA:
Nome: ${config.name}
Descrição: ${config.businessDescription || 'Não informada'}
Horário de Atendimento 1: ${config.businessHours || 'Não informado'}
Horário de Atendimento 2: ${config.businessConfig?.openingHours || 'Não informado'}
Endereço: ${config.businessConfig?.address || 'Não informado'}

PRODUTOS E SERVIÇOS:
${productList || 'Nenhum produto cadastrado no momento.'}

---
DIRETRIZES GERAIS:
1. Siga estritamente as instruções da sua persona (descritas no início deste prompt).
2. Utilize as informações da empresa e a lista de produtos acima para responder às dúvidas do cliente.
3. Se não houver resposta para a pergunta do cliente nas informações acima, seja honesto e diga que não tem essa informação no momento, oferecendo transferir para um atendente humano.
4. Responda de forma clara, educada e direta.
  `.trim();

  const response = await withRetry(() => openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
  }));

  return response.choices[0].message.content;
};

export const classifyIntent = async (userMessage: string) => {
  const systemPrompt = `
Classifique a intenção da mensagem do cliente em uma das seguintes categorias:
- question (dúvidas gerais/informações)
- order (fazer um pedido/comprar algo)
- appointment (agendamentos)
- support (suporte técnico/problemas)

Responda APENAS com a palavra da categoria.
  `;

  const response = await withRetry(() => openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 10,
  }));

  const intent = response.choices[0].message.content?.toLowerCase().trim();
  return intent;
};
