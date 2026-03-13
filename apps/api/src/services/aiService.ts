import { createOpenAIClient } from '../integrations/openai/openaiClient';
import { getTenantConfig, listProducts } from './tenantService';

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

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
  });

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

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 10,
  });

  const intent = response.choices[0].message.content?.toLowerCase().trim();
  return intent;
};

export const generateSalesResponse = async (tenantId: string, userMessage: string) => {
  const config = await getTenantConfig(tenantId);
  const products = await listProducts(tenantId);
  
  // Limiting to 5 products for recommendations as requested
  const recommendedProducts = products.slice(0, 5);

  const productList = recommendedProducts.map((p: any) => 
    `Nome: ${p.name}\nDescrição: ${p.description || 'Não informada'}\nPreço: R$ ${p.price.toFixed(2)}`
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
4. Se o item estiver em falta (estoque 0), ofereça alternativas do catálogo.
5. Seja claro, objetivo, amigável e focado em conversão.

Exemplo de tom: "Temos estas opções que podem te ajudar... O [Produto X] é ótimo para [Benefício]. Qual você prefere?"
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
  });

  return response.choices[0].message.content;
};
