/**
 * COMM1 — Commercial Orchestrator Service
 * Structured decision engine that runs BEFORE AI fallback.
 * Returns a typed decision object; the webhook handler executes it.
 *
 * Decision types:
 *   none               — no commercial intent detected, pass through to AI
 *   clarify_item       — multiple products match, ask customer to choose
 *   send_offer         — single match, present product (no checkout yet)
 *   send_checkout      — ready to send checkout link
 *   send_external_link — product has external URL
 *   schedule_service   — product linked to Service, defer to appointmentBookingService
 *   handoff_human      — requiresHumanApproval or explicit handoff trigger
 */

import { prisma } from '@/lib/prisma';
import { getCommercialState, setCommercialState } from '@/lib/services/commercialStateService';
import { generateCheckoutUrl, buildCheckoutMessage, buildOfferMessage } from '@/lib/services/checkoutService';

export type OrchestratorAction =
  | 'none'
  | 'clarify_item'
  | 'send_offer'
  | 'send_checkout'
  | 'send_external_link'
  | 'schedule_service'
  | 'handoff_human';

export interface OrchestratorDecision {
  action: OrchestratorAction;
  message?: string;       // ready-to-send WhatsApp message
  checkoutUrl?: string;   // populated for send_checkout
  productId?: string;     // matched product
  serviceId?: string;     // for schedule_service
  reason?: string;        // debug
}

// ── Commercial intent keywords (Portuguese-centric) ──────────────────────────
const BUY_INTENT_PATTERNS = [
  /\bquero\b/i,
  /\bqueria\b/i,
  /\bcomprar?\b/i,
  /\bpagar?\b/i,
  /\bcontratar?\b/i,
  /\bagend(ar?|amento)\b/i,
  /\bpreciso\b.*\b(de|do|da)\b/i,
  /\bme\s+manda?\b/i,
  /\bme\s+envia?\b/i,
  /\btem\s+(o|a|os|as)\b/i,
  /\bpreço\b/i,
  /\bvalor\b/i,
  /\bcusto\b/i,
  /\bquanto\s+(custa|é|fica)\b/i,
  /\bcomo\s+(faço|compro|pago|contrato)\b/i,
  /\btopei\b/i,
  /\bfechado\b/i,
  /\bquero\s+pagar?\b/i,
  /\blink\s+de\s+pagamento\b/i,
  /\blink\s+de\s+compra\b/i,
];

function hasBuyIntent(text: string): boolean {
  return BUY_INTENT_PATTERNS.some((p) => p.test(text));
}

/**
 * Score a product against the incoming message.
 * Returns a positive score if the message mentions the product name or any alias.
 * Higher score = stronger match.
 */
function scoreProduct(
  product: { name: string; aliases: string[]; salesShortText: string | null; salesPriority: number },
  msgLower: string
): number {
  let score = 0;

  const targets = [
    product.name.toLowerCase(),
    ...(product.salesShortText ? [product.salesShortText.toLowerCase()] : []),
    ...product.aliases.map((a) => a.toLowerCase()),
  ];

  for (const target of targets) {
    if (msgLower.includes(target)) {
      // Exact alias or shortText match scores higher
      score += target === product.name.toLowerCase() ? 2 : 3;
    }
  }

  // Add salesPriority as tiebreaker
  if (score > 0) score += product.salesPriority * 0.1;

  return score;
}

/**
 * Main orchestrator entry point.
 * Called from webhook AFTER automation match (no match) and BEFORE AI.
 */
export async function runCommercialOrchestrator(
  tenantId: string,
  customerPhone: string,
  messageText: string,
  resolvedContactId: string | undefined,
  channel: string = 'whatsapp'
): Promise<OrchestratorDecision> {
  const msgLower = messageText.toLowerCase().trim();

  // Load current commercial state
  const state = await getCommercialState(tenantId, customerPhone, channel);

  // ── 1. Awaiting product choice disambiguation ───────────────────────────
  if (state.awaitingChoice && state.candidateProductIds?.length) {
    // Customer is choosing from a list — try to match by position number or name
    const products = await prisma.product.findMany({
      where: { id: { in: state.candidateProductIds }, tenantId, active: true },
    });

    // Try numeric choice ("1", "2", "3", etc.)
    const numMatch = msgLower.match(/^[1-9]$/);
    if (numMatch) {
      const idx = parseInt(numMatch[0], 10) - 1;
      if (idx >= 0 && idx < products.length) {
        const chosen = products[idx];
        return await buildProductDecision(tenantId, chosen, resolvedContactId, customerPhone, channel, state);
      }
    }

    // Try name/alias match among candidates
    const scored = products
      .map((p) => ({ p, score: scoreProduct(p, msgLower) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 1) {
      return await buildProductDecision(tenantId, scored[0].p, resolvedContactId, customerPhone, channel, state);
    }

    // Still ambiguous or unrelated message — clear choice state and pass to AI
    await setCommercialState(tenantId, customerPhone, { awaitingChoice: false }, channel);
    return { action: 'none', reason: 'awaiting_choice_unresolved' };
  }

  // ── 2. Detect commercial intent ─────────────────────────────────────────
  if (!hasBuyIntent(msgLower)) {
    return { action: 'none', reason: 'no_buy_intent' };
  }

  // ── 3. Find matching active products ────────────────────────────────────
  const allProducts = await prisma.product.findMany({
    where: { tenantId, active: true },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      currency: true,
      salesMode: true,
      salesCtaText: true,
      salesShortText: true,
      externalSalesUrl: true,
      aliases: true,
      salesPriority: true,
      requiresHumanApproval: true,
      serviceId: true,
    },
  });

  const scored = allProducts
    .map((p) => ({ p, score: scoreProduct(p, msgLower) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // ── 4. No product match ──────────────────────────────────────────────────
  if (scored.length === 0) {
    // Increment unresolved counter
    const unresolvedCount = (state.unresolvedCount ?? 0) + 1;
    await setCommercialState(tenantId, customerPhone, { unresolvedCount }, channel);
    return { action: 'none', reason: 'no_product_match' };
  }

  // ── 5. Multiple matches — disambiguation ────────────────────────────────
  if (scored.length > 1) {
    const top = scored.slice(0, 5); // max 5 options
    const lines = top
      .map((x, i) => `${i + 1}. *${x.p.name}*`)
      .join('\n');
    const disambigMsg = `Encontrei alguns produtos que podem te interessar:\n\n${lines}\n\nQual deles você deseja? Responda com o número ou o nome.`;

    await setCommercialState(tenantId, customerPhone, {
      awaitingChoice: true,
      candidateProductIds: top.map((x) => x.p.id),
      lastIntent: 'buy_product',
    }, channel);

    return {
      action: 'clarify_item',
      message: disambigMsg,
      reason: 'multiple_products_matched',
    };
  }

  // ── 6. Single match ──────────────────────────────────────────────────────
  const product = scored[0].p;
  return await buildProductDecision(tenantId, product, resolvedContactId, customerPhone, channel, state);
}

// ── Internal: build decision for a single identified product ─────────────────
async function buildProductDecision(
  tenantId: string,
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    salesMode: string;
    salesCtaText: string | null;
    salesShortText: string | null;
    externalSalesUrl: string | null;
    aliases: string[];
    salesPriority: number;
    requiresHumanApproval: boolean;
    serviceId: string | null;
  },
  resolvedContactId: string | undefined,
  customerPhone: string,
  channel: string,
  state: Record<string, any>
): Promise<OrchestratorDecision> {
  // Human approval required
  if (product.requiresHumanApproval) {
    await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id, awaitingChoice: false }, channel);
    return {
      action: 'handoff_human',
      productId: product.id,
      reason: 'requires_human_approval',
    };
  }

  // Linked to a service → schedule_service
  if (product.serviceId) {
    await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id, awaitingChoice: false }, channel);
    return {
      action: 'schedule_service',
      productId: product.id,
      serviceId: product.serviceId,
      reason: 'product_linked_to_service',
    };
  }

  // External link
  if (product.salesMode === 'external_link' && product.externalSalesUrl) {
    const msg = buildCheckoutMessage(
      product.name,
      product.price,
      product.currency,
      product.externalSalesUrl,
      product.salesCtaText
    );
    await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id, awaitingChoice: false }, channel);
    return {
      action: 'send_external_link',
      message: msg,
      checkoutUrl: product.externalSalesUrl,
      productId: product.id,
      reason: 'external_link',
    };
  }

  // Dynamic checkout — need contactId
  if (product.salesMode === 'dynamic_checkout') {
    // ── 4-layer contactId resolution ──────────────────────────────────────
    let contactId = resolvedContactId;

    if (!contactId) {
      // Layer 2: lookup by phone
      const contact = await prisma.contact.findFirst({
        where: { tenantId, phone: customerPhone },
        select: { id: true },
      });
      contactId = contact?.id;
    }

    if (!contactId) {
      // Layer 3: normalized phone lookup
      const normalized = customerPhone.replace(/\D/g, '');
      const contact = await prisma.contact.findFirst({
        where: { tenantId, normalizedPhone: normalized },
        select: { id: true },
      });
      contactId = contact?.id;
    }

    if (!contactId) {
      // Layer 4: upsert contact by phone, then degrade to send_offer
      try {
        const upserted = await prisma.contact.upsert({
          where: { tenantId_normalizedPhone: { tenantId, normalizedPhone: customerPhone.replace(/\D/g, '') } },
          create: {
            tenantId,
            phone: customerPhone,
            normalizedPhone: customerPhone.replace(/\D/g, ''),
            source: 'whatsapp',
          },
          update: {},
        });
        contactId = upserted.id;
      } catch {
        // Degrade gracefully
        const offerMsg = buildOfferMessage(
          product.name,
          product.price,
          product.currency,
          product.description,
          product.salesCtaText
        );
        await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id, awaitingChoice: false }, channel);
        return { action: 'send_offer', message: offerMsg, productId: product.id, reason: 'contact_upsert_failed' };
      }
    }

    // Generate checkout
    try {
      const { checkoutUrl } = await generateCheckoutUrl(tenantId, product.id, contactId);
      const msg = buildCheckoutMessage(
        product.name,
        product.price,
        product.currency,
        checkoutUrl,
        product.salesCtaText
      );
      await setCommercialState(tenantId, customerPhone, {
        lastOfferedProductId: product.id,
        lastCheckoutSentAt: new Date().toISOString(),
        awaitingChoice: false,
      }, channel);

      // Persist SalesEvent
      try {
        await prisma.salesEvent.create({
          data: { tenantId, contactId, productId: product.id, checkoutUrl, status: 'created' },
        });
      } catch { /* duplicate or no contactId — non-blocking */ }

      // Persist SalesOpportunity so billing webhook can advance it to 'pago' on payment
      try {
        await prisma.salesOpportunity.create({
          data: {
            tenantId,
            contactId,
            productId: product.id,
            status: 'checkout_enviado',
            value: product.price,
          },
        });
      } catch { /* duplicate — non-blocking */ }

      return {
        action: 'send_checkout',
        message: msg,
        checkoutUrl,
        productId: product.id,
        reason: 'dynamic_checkout',
      };
    } catch (err: any) {
      console.error('[CommercialOrchestrator] Checkout generation failed:', err?.message);
      // Degrade to offer
      const offerMsg = buildOfferMessage(
        product.name,
        product.price,
        product.currency,
        product.description,
        product.salesCtaText
      );
      await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id }, channel);
      return { action: 'send_offer', message: offerMsg, productId: product.id, reason: 'checkout_error_degraded_to_offer' };
    }
  }

  // Default: salesMode='none' → send_offer
  const offerMsg = buildOfferMessage(
    product.name,
    product.price,
    product.currency,
    product.description,
    product.salesCtaText
  );
  await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id, awaitingChoice: false }, channel);
  return {
    action: 'send_offer',
    message: offerMsg,
    productId: product.id,
    reason: 'sales_mode_none',
  };
}
