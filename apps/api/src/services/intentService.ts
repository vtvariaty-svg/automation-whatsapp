/**
 * Zero-latency intent detection using keywords and regex.
 * Fast, cheap and deterministic classification of incoming WhatsApp messages.
 */

export interface IntentReuslt {
  intent: 'sales' | 'support' | 'faq' | 'general';
}

const SALES_KEYWORDS = [
  'preço',
  'preco', 
  'quanto custa',
  'valor',
  'tem produto',
  'tem disponível',
  'tem disponivel',
  'quero comprar',
  'como comprar',
  'quanto sai',
  'venda',
  'comprar',
  'orçamento',
  'orcamento',
  'catálogo',
  'catalogo'
];

const SUPPORT_KEYWORDS = [
  'problema',
  'erro',
  'defeito',
  'não funciona',
  'nao funciona',
  'ajuda',
  'suporte',
  'cancelar',
  'reclamação',
  'reclamacao'
];

const FAQ_KEYWORDS = [
  'horário',
  'horario',
  'onde fica',
  'endereço',
  'endereco',
  'localização',
  'localizacao',
  'dúvida',
  'duvida',
  'informação',
  'informacao'
];

export const detectIntent = (message: string): IntentReuslt => {
  if (!message) return { intent: 'general' };

  const lowerMessage = message.toLowerCase().trim();

  // 1. Check Sales
  if (SALES_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return { intent: 'sales' };
  }

  // 2. Check Support
  if (SUPPORT_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return { intent: 'support' };
  }

  // 3. Check FAQ
  if (FAQ_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    return { intent: 'faq' };
  }

  // Fallback to general if no specific intent is found
  return { intent: 'general' };
};
