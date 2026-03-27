/**
 * Mapeamento explícito: botId → chave de template em businessTemplates.
 *
 * Fonte de verdade auditável. Cada bot do marketplace DEVE ter entrada aqui.
 * Se um bot não tiver mapeamento, a ativação não criará serviços padrão.
 */
export const BOT_TEMPLATE_MAP: Record<string, string> = {
  'bot-clinica':      'clínica',
  'bot-cabeleireiro': 'salão',
  'bot-odontologia':  'odontologia',
  'bot-estetica':     'estetica',
  'bot-veterinaria':  'veterinaria',
  'bot-oficina':      'oficina',
  'bot-ecommerce':    'ecommerce',
  'bot-restaurante':  'restaurante',
  'bot-loja':         'loja',
  'bot-imobiliaria':  'imobiliária',
  'bot-advocacia':    'advocacia',
  'bot-educacao':     'educacao',
  'bot-academia':     'academia',
};
