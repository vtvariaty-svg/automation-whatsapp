/**
 * HANDOFF1 — Handoff Service
 * Detects escalation triggers and executes the operator alert flow.
 *
 * Trigger types:
 *   explicit_request — customer message contains "falar com humano/atendente/pessoa"
 *   ai_low_confidence — AI response contains uncertainty markers
 *   repetition — unresolvedCount threshold exceeded
 *   checkout_error — checkout generation failed
 *   no_product — no matching product found (if configured)
 */

import { prisma } from '@/lib/prisma';

// ── Trigger detection patterns ────────────────────────────────────────────────

const EXPLICIT_HUMAN_PATTERNS = [
  /falar?\s+(com\s+)?(uma?\s+)?(humano|pessoa|atendente|funcionário|vendedor|gerente|responsável)/i,
  /quero\s+(um?\s+)?(humano|atendente|pessoa|suporte)/i,
  /me\s+(coloca|transfere|passa)\s+(para\s+)?(um?\s+)?(humano|atendente|pessoa)/i,
  /atendimento\s+humano/i,
  /falar?\s+com\s+alguém/i,
  /preciso\s+de\s+(um?\s+)?(humano|atendente|pessoa)/i,
];

const AI_LOW_CONFIDENCE_PATTERNS = [
  /não\s+(tenho|possuo)\s+(certeza|informação)/i,
  /não\s+(sei|consigo)\s+(responder|ajudar)/i,
  /lamento.*não\s+poder/i,
  /sugiro.*entrar\s+em\s+contato/i,
  /recomendo.*falar\s+com/i,
  /entre\s+em\s+contato\s+diretamente/i,
  /não\s+estou\s+apto/i,
  /fora\s+do\s+meu\s+conhecimento/i,
  /não\s+tenho\s+acesso\s+a\s+essa\s+informação/i,
];

export function detectExplicitRequest(messageText: string): boolean {
  return EXPLICIT_HUMAN_PATTERNS.some((p) => p.test(messageText));
}

export function detectAiLowConfidence(aiResponse: string): boolean {
  return AI_LOW_CONFIDENCE_PATTERNS.some((p) => p.test(aiResponse));
}

// ── Main handoff executor ─────────────────────────────────────────────────────

export interface HandoffContext {
  tenantId: string;
  customerPhone: string;
  channel: string;
  triggerReason: 'explicit_request' | 'ai_low_confidence' | 'repetition' | 'checkout_error' | 'no_product';
  lastMessage: string;
  contactId?: string;
}

export interface HandoffResult {
  triggered: boolean;
  reason: string;
  clientMessageSent: boolean;
  operatorAlerted: boolean;
  conversationSetToHuman: boolean;
}

/**
 * Execute handoff logic:
 * 1. Load HandoffConfig for the tenant
 * 2. Check if trigger type is enabled
 * 3. Anti-spam: cooldown + max alerts
 * 4. Send client message (if configured)
 * 5. Alert operator via WhatsApp
 * 6. Set conversation.status = 'human' (if autoSetHuman)
 */
export async function executeHandoff(ctx: HandoffContext): Promise<HandoffResult> {
  const result: HandoffResult = {
    triggered: false,
    reason: '',
    clientMessageSent: false,
    operatorAlerted: false,
    conversationSetToHuman: false,
  };

  // Load config
  const config = await prisma.handoffConfig.findUnique({
    where: { tenantId: ctx.tenantId },
  });

  if (!config || !config.enabled) {
    result.reason = 'handoff_disabled';
    return result;
  }

  // Check if this trigger type is enabled
  const enabledMap: Record<string, boolean> = {
    explicit_request: config.triggerOnExplicitRequest,
    ai_low_confidence: config.triggerOnLowConfidence,
    repetition: config.triggerOnRepetition,
    checkout_error: config.triggerOnCheckoutError,
    no_product: config.triggerOnNoProduct,
  };

  if (!enabledMap[ctx.triggerReason]) {
    result.reason = `trigger_${ctx.triggerReason}_disabled`;
    return result;
  }

  // Load conversation
  const conv = await prisma.conversation.findFirst({
    where: { tenantId: ctx.tenantId, customerPhone: ctx.customerPhone, channel: ctx.channel },
    orderBy: { lastMessageAt: 'desc' },
    select: { id: true, handoffAlertCount: true, lastHandoffAlertAt: true, status: true },
  });

  if (!conv) {
    result.reason = 'conversation_not_found';
    return result;
  }

  // Anti-spam: max alerts per conversation
  if (conv.handoffAlertCount >= config.maxAlertsPerConversation) {
    result.reason = 'max_alerts_reached';
    result.triggered = false;
    return result;
  }

  // Anti-spam: cooldown
  if (conv.lastHandoffAlertAt) {
    const elapsedMs = Date.now() - new Date(conv.lastHandoffAlertAt).getTime();
    const cooldownMs = config.cooldownMinutes * 60 * 1000;
    if (elapsedMs < cooldownMs) {
      result.reason = `cooldown_active_${Math.round((cooldownMs - elapsedMs) / 60000)}min_remaining`;
      return result;
    }
  }

  result.triggered = true;

  // Resolve contact name
  let contactName = ctx.customerPhone;
  if (ctx.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: ctx.contactId, tenantId: ctx.tenantId },
      select: { name: true, phone: true },
    });
    contactName = contact?.name || contact?.phone || ctx.customerPhone;
  }

  // Load tenant WhatsApp credentials
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: {
      whatsappPhoneNumberId: true,
      whatsappPhoneId: true,
      whatsappToken: true,
      name: true,
    },
  });

  const phoneId = tenant?.whatsappPhoneNumberId || tenant?.whatsappPhoneId;
  const rawToken = tenant?.whatsappToken;

  // ── Send client message ──────────────────────────────────────────────────
  if (config.clientMessage && phoneId && rawToken) {
    try {
      const { decrypt } = await import('@/lib/utils/crypto');
      // @ts-ignore
      const { sendWhatsAppMessage } = await import('@/src/services/whatsappService');
      const token = decrypt(rawToken);
      await sendWhatsAppMessage(ctx.customerPhone, config.clientMessage, phoneId, token);
      result.clientMessageSent = true;
    } catch (err) {
      console.error('[Handoff] Failed to send client message:', err);
    }
  }

  // ── Alert operator ───────────────────────────────────────────────────────
  if (config.alertPhone && phoneId && rawToken) {
    try {
      const { decrypt } = await import('@/lib/utils/crypto');
      // @ts-ignore
      const { sendWhatsAppMessage } = await import('@/src/services/whatsappService');
      const token = decrypt(rawToken);

      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

      const triggerLabel: Record<string, string> = {
        explicit_request: 'Pedido explícito do cliente',
        ai_low_confidence: 'IA sem resposta segura',
        repetition: 'Intenção repetida sem resolução',
        checkout_error: 'Erro ao gerar checkout',
        no_product: 'Nenhum produto encontrado',
      };

      const operatorMsg =
        config.operatorMessage ||
        `🔔 *Atendimento Humano Solicitado*\n\n` +
        `Cliente: *${contactName}*\n` +
        `Telefone: ${ctx.customerPhone}\n` +
        `Canal: ${ctx.channel}\n` +
        `Motivo: ${triggerLabel[ctx.triggerReason] || ctx.triggerReason}\n\n` +
        `Última mensagem:\n"${ctx.lastMessage.slice(0, 200)}"\n\n` +
        `Acesse o atendimento:\n${baseUrl}/dashboard/conversations`;

      await sendWhatsAppMessage(config.alertPhone, operatorMsg, phoneId, token);
      result.operatorAlerted = true;
    } catch (err) {
      console.error('[Handoff] Failed to alert operator:', err);
    }
  }

  // ── Set conversation to human ────────────────────────────────────────────
  if (config.autoSetHuman && conv.status !== 'human') {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { status: 'human' },
    });
    result.conversationSetToHuman = true;
  }

  // ── Update anti-spam counters ────────────────────────────────────────────
  await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      handoffAlertCount: { increment: 1 },
      lastHandoffAlertAt: new Date(),
    },
  });

  console.log(
    `[Handoff] Triggered: tenant=${ctx.tenantId} phone=${ctx.customerPhone} reason=${ctx.triggerReason} ` +
    `clientMsg=${result.clientMessageSent} operatorAlert=${result.operatorAlerted} human=${result.conversationSetToHuman}`
  );

  result.reason = ctx.triggerReason;
  return result;
}
