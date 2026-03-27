/**
 * Guided AI Setup — shared types, managed prompt block logic, and welcome suggestion.
 *
 * Architecture:
 * - Structured answers are stored in Tenant.aiGuidedSetup (Json)
 * - A "managed block" is generated from those answers and merged into Tenant.aiPrompt
 * - The block is demarcated by GUIDED_BLOCK_START / GUIDED_BLOCK_END markers
 * - Operator content OUTSIDE the markers is always preserved
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type BusinessModel  = 'services' | 'products' | 'both';
export type OfferMode      = 'never' | 'on_request' | 'consultive';
export type PricePolicy    = 'never' | 'only_when_asked' | 'always_when_relevant' | 'range_only';
export type ToneOfVoice    = 'professional' | 'friendly' | 'premium' | 'direct';

export interface GuidedSetupAnswers {
  companyName?:       string;
  niche?:             string;
  businessModel?:     BusinessModel;
  offeringsSummary?:  string;
  offerMode?:         OfferMode;
  pricePolicy?:       PricePolicy;
  businessHours?:     string;
  toneOfVoice?:       ToneOfVoice;
  mainDifferential?:  string;
}

// ── Markers ───────────────────────────────────────────────────────────────────

export const GUIDED_BLOCK_START = '[GUIDED_SETUP_START]';
export const GUIDED_BLOCK_END   = '[GUIDED_SETUP_END]';

export const PRESET_BLOCK_START = '[PRESET_BLOCK_START]';
export const PRESET_BLOCK_END   = '[PRESET_BLOCK_END]';

// ── Normalise raw JSON from DB or request ─────────────────────────────────────

export function normalizeGuidedAnswers(raw: unknown): GuidedSetupAnswers {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: GuidedSetupAnswers = {};

  if (typeof r.companyName === 'string' && r.companyName.trim())       out.companyName      = r.companyName.trim();
  if (typeof r.niche === 'string' && r.niche.trim())                   out.niche            = r.niche.trim();
  if (['services', 'products', 'both'].includes(r.businessModel as string))
    out.businessModel = r.businessModel as BusinessModel;
  if (typeof r.offeringsSummary === 'string' && r.offeringsSummary.trim())
    out.offeringsSummary = r.offeringsSummary.trim();
  if (['never', 'on_request', 'consultive'].includes(r.offerMode as string))
    out.offerMode = r.offerMode as OfferMode;
  if (['never', 'only_when_asked', 'always_when_relevant', 'range_only'].includes(r.pricePolicy as string))
    out.pricePolicy = r.pricePolicy as PricePolicy;
  if (typeof r.businessHours === 'string' && r.businessHours.trim())   out.businessHours    = r.businessHours.trim();
  if (['professional', 'friendly', 'premium', 'direct'].includes(r.toneOfVoice as string))
    out.toneOfVoice = r.toneOfVoice as ToneOfVoice;
  if (typeof r.mainDifferential === 'string' && r.mainDifferential.trim())
    out.mainDifferential = r.mainDifferential.trim();

  return out;
}

// ── Build managed prompt block ────────────────────────────────────────────────

const MODEL_MAP: Record<BusinessModel, string> = {
  services: 'apenas serviços',
  products: 'apenas produtos',
  both:     'serviços e produtos',
};

const TONE_MAP: Record<ToneOfVoice, string> = {
  professional: 'profissional e formal',
  friendly:     'próximo, amigável e acolhedor',
  premium:      'premium, exclusivo e sofisticado',
  direct:       'direto ao ponto, objetivo e ágil',
};

const OFFER_MAP: Record<OfferMode, string> = {
  never:      'Não ofereça produtos/serviços proativamente — responda apenas quando o cliente perguntar.',
  on_request: 'Sugira produtos/serviços quando o cliente demonstrar interesse ou necessidade explícita.',
  consultive: 'Ofereça produtos/serviços relevantes de forma proativa e consultiva quando fizer sentido no contexto da conversa.',
};

const PRICE_MAP: Record<PricePolicy, string> = {
  never:                'Nunca mencione preços ou valores.',
  only_when_asked:      'Informe preços somente quando o cliente perguntar diretamente.',
  always_when_relevant: 'Mencione preços quando for relevante para a decisão do cliente.',
  range_only:           'Quando perguntado sobre preços, forneça apenas uma faixa de valor aproximada.',
};

export function buildManagedPromptBlock(answers: GuidedSetupAnswers): string {
  const lines: string[] = ['# Configuração do Negócio (gerada automaticamente)'];

  if (answers.companyName)      lines.push(`Empresa: ${answers.companyName}`);
  if (answers.niche)            lines.push(`Segmento: ${answers.niche}`);
  if (answers.businessModel)    lines.push(`Modelo: ${MODEL_MAP[answers.businessModel]}`);
  if (answers.offeringsSummary) lines.push(`O que oferece: ${answers.offeringsSummary}`);
  if (answers.toneOfVoice)      lines.push(`Tom de comunicação: seja ${TONE_MAP[answers.toneOfVoice]} em todas as respostas`);
  if (answers.offerMode)        lines.push(`Modo de oferta: ${OFFER_MAP[answers.offerMode]}`);
  if (answers.pricePolicy)      lines.push(`Política de preços: ${PRICE_MAP[answers.pricePolicy]}`);
  if (answers.businessHours)    lines.push(`Horário de atendimento: ${answers.businessHours}`);
  if (answers.mainDifferential) lines.push(`Principal diferencial: ${answers.mainDifferential}`);

  return `${GUIDED_BLOCK_START}\n${lines.join('\n')}\n${GUIDED_BLOCK_END}`;
}

// ── Generic managed block helpers ─────────────────────────────────────────────

/** Extracts a managed block (including its markers) from a prompt, or null if absent. */
export function extractManagedBlock(
  prompt: string | null | undefined,
  startMarker: string,
  endMarker: string,
): string | null {
  const base = prompt ?? '';
  const startIdx = base.indexOf(startMarker);
  const endIdx   = base.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return base.slice(startIdx, endIdx + endMarker.length);
  }
  return null;
}

/** Replaces (or prepends) a managed block delimited by startMarker/endMarker. */
export function replaceManagedBlock(
  prompt: string | null | undefined,
  startMarker: string,
  endMarker: string,
  newBlock: string,
): string {
  const base = prompt ?? '';
  const startIdx = base.indexOf(startMarker);
  const endIdx   = base.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = base.slice(0, startIdx);
    const after  = base.slice(endIdx + endMarker.length);
    return (before + newBlock + after).replace(/\n{3,}/g, '\n\n').trim();
  }
  const custom = base.trim();
  return custom ? `${newBlock}\n\n${custom}` : newBlock;
}

/** Removes a managed block delimited by startMarker/endMarker. */
export function removeManagedBlock(
  prompt: string | null | undefined,
  startMarker: string,
  endMarker: string,
): string {
  const base = prompt ?? '';
  const startIdx = base.indexOf(startMarker);
  const endIdx   = base.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = base.slice(0, startIdx);
    const after  = base.slice(endIdx + endMarker.length);
    return (before + after).replace(/\n{3,}/g, '\n\n').trim();
  }
  return base;
}

/** Returns the raw prompt with ALL managed blocks stripped (manual layer only). */
export function extractPromptWithoutManagedBlocks(prompt: string | null | undefined): string {
  let result = removeManagedBlock(prompt, PRESET_BLOCK_START, PRESET_BLOCK_END);
  result = removeManagedBlock(result, GUIDED_BLOCK_START, GUIDED_BLOCK_END);
  return result.trim();
}

/**
 * Compose the final aiPrompt from independently managed layers.
 * Canonical order: PRESET block → GUIDED block → manual layer
 */
export function composePromptFromBlocks(opts: {
  presetBlock?:  string | null;
  guidedBlock?:  string | null;
  manualLayer?:  string | null;
}): string {
  const parts: string[] = [];
  if (opts.presetBlock?.trim())  parts.push(opts.presetBlock.trim());
  if (opts.guidedBlock?.trim())  parts.push(opts.guidedBlock.trim());
  if (opts.manualLayer?.trim())  parts.push(opts.manualLayer.trim());
  return parts.join('\n\n');
}

// ── Merge managed block into existing prompt ──────────────────────────────────

/**
 * Replaces the GUIDED block inside `currentPrompt` if markers exist,
 * otherwise prepends the new block — preserving all operator content outside the markers.
 */
export function mergePromptBlock(
  currentPrompt: string | null | undefined,
  newBlock: string,
): string {
  return replaceManagedBlock(currentPrompt, GUIDED_BLOCK_START, GUIDED_BLOCK_END, newBlock);
}

// ── Suggested welcome (only when tenant welcome is currently empty) ────────────

const WELCOME_TEMPLATES: Record<ToneOfVoice, (name: string) => string> = {
  professional: (n) => `Olá! Bem-vindo(a) à ${n}. Sou o assistente virtual e estou aqui para ajudá-lo(a). Como posso ser útil?`,
  friendly:     (n) => `Oi! 👋 Que bom ter você aqui! Sou a assistente da ${n}. Como posso te ajudar hoje?`,
  premium:      (n) => `Olá! Seja muito bem-vindo(a) à ${n}. Estou à sua disposição para o melhor atendimento. Como posso ajudá-lo(a)?`,
  direct:       (n) => `Olá! Assistente da ${n} aqui. Como posso ajudar?`,
};

export function buildSuggestedWelcome(answers: GuidedSetupAnswers): string {
  const name = answers.companyName?.trim() || 'nossa empresa';
  const tone = answers.toneOfVoice ?? 'friendly';
  return WELCOME_TEMPLATES[tone](name);
}
