import { createOpenAIClient, withRetry } from '@whatsapp-automation/shared';
import { getTenantConfig, listProducts, searchProducts } from './tenantService';
import { createCheckoutSession } from './salesService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const openai = createOpenAIClient();

export const generateResponse = async (tenantId: string, userMessage: string) => {
  const config = await getTenantConfig(tenantId);
  const products = await listProducts(tenantId);

  const productList = products.map((p: any) => `- ${p.name}: ${p.description} (R$ ${p.price})`).join('\n');

  const systemPrompt = `
Você é um assistente virtual da empresa ${config.name}.

Contexto da empresa:
Descrição: ${config.businessDescription || 'Não informada'}
Horário de Funcionamento: ${config.businessConfig?.openingHours || 'Não informado'}
Endereço: ${config.businessConfig?.address || 'Não informado'}

Produtos/Serviços:
${productList || 'Nenhum produto cadastrado no momento.'}

Seu objetivo:
Responder clientes de forma clara e educada. 
Use as informações acima para responder. Se não souber algo ou se a informação não estiver no contexto, peça mais informações ou sugira que o cliente aguarde um contato humano.

Mantenha as respostas concisas e profissionais.
  `;

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

export const generateSalesResponse = async (tenantId: string, userMessage: string, contactId: string) => {
  const config = await getTenantConfig(tenantId);
  const recommendedProducts = await searchProducts(tenantId, userMessage);

  if (recommendedProducts.length > 0) {
    const openOpp = await prisma.salesOpportunity.findFirst({
      where: { tenantId, contactId, status: 'novo_lead' },
      orderBy: { createdAt: 'desc' }
    });
    if (openOpp) {
      await prisma.salesOpportunity.update({
        where: { id: openOpp.id },
        data: { status: 'interessado' }
      });
    }
  }

  const productList = recommendedProducts.map((p: any) => 
    `ID: ${p.id}\nNome: ${p.name}\nDescrição: ${p.description || 'Não informada'}\nPreço: R$ ${p.price.toFixed(2)}`
  ).join('\n\n');

  const systemPrompt = `
Você é o Assistente de Vendas Especialista da empresa ${config.name}.

Contexto da empresa:
Descrição: ${config.businessDescription || 'Não informada'}

Produtos disponíveis:

${productList || 'Nenhum produto cadastrado no momento.'}

Seu objetivo:
O cliente demonstrou interesse em comprar ou tirar dúvidas sobre produtos. Você deve:
1. Recomendar os produtos acima que melhor se adaptam à necessidade do cliente.
2. Explicar os benefícios de cada item recomendado de forma persuasiva.
3. Perguntar qual deles o cliente prefere para guiar o fechamento da venda.
4. Se o cliente aceitar explicitamente ou quiser comprar um produto ESPECÍFICO, você DEVE gerar o link de pagamento usando a ferramenta generate_checkout_link informando o ID do produto.
5. Ao retornar o link de checkout, diga obrigatoriamente a frase: "Aqui está o link para finalizar sua compra: {url}".
6. Se o item estiver em falta, ofereça alternativas do catálogo.
7. Seja claro, objetivo, amigável e focado em conversão.

Exemplo de tom inicial: "Temos estas opções que podem te ajudar... O [Produto X] é ótimo para [Benefício]. Qual você prefere?"
  `;

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  const tools: any[] = [
    {
      type: "function",
      function: {
        name: "generate_checkout_link",
        description: "Gera uma URL de checkout quando o cliente diz que quer comprar ou aceita um produto sugerido.",
        parameters: {
          type: "object",
          properties: {
            productId: {
              type: "string",
              description: "O ID do produto escolhido."
            }
          },
          required: ["productId"]
        }
      }
    }
  ];

  let response = await withRetry(() => openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    tools,
    tool_choice: "auto"
  }));

  const responseMessage = response.choices[0].message;

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage); // append the assistant's tool call message
    
    for (const toolCall of responseMessage.tool_calls) {
      const call = toolCall as any;
      if (call.function.name === 'generate_checkout_link') {
        const args = JSON.parse(call.function.arguments);
        try {
          // Execute local function to generate link and mock the DB object
          const checkoutData = await createCheckoutSession(tenantId, contactId, args.productId);
          
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify(checkoutData)
          });
        } catch (error: any) {
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify({ error: error.message })
          });
        }
      }
    }

    // Call OpenAI again to get the final response formatted with the generated data
    response = await withRetry(() => openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages
    }));
    
    return response.choices[0].message.content;
  }

  return responseMessage.content;
};
