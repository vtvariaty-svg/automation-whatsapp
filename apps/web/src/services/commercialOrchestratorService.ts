/**
 * COMM1 — Commercial Orchestrator Service
 * Structured decision engine that runs BEFORE AI fallback.
 * Returns a typed decision object; the webhook handler executes it.
 *
 * Decision types:
 *   none               — no commercial intent detected, pass through to AI
 *   clarify_item       — multiple products match, ask customer to choose
 *   send_offer         — single match, present product (no checkout yet)
 *   send_checkout      — ready to send checkout link (transactional trail guaranteed)
 *   send_external_link — product has external URL
 *   schedule_service   — product linked to Service, defer to appointmentBookingService
 *   send_catalog       — deterministic catalog listing from DB
 *   handoff_human      — requiresHumanApproval, repetition threshold, checkout error, or no_product
 */

import { prisma } from '@/lib/prisma';
import { getCommercialState, setCommercialState } from '@/lib/services/commercialStateService';
import { buildOfferMessage } from '@/lib/services/checkoutService';
import { executeConversationalCheckout } from '@/lib/services/conversationalCheckoutService';

export type OrchestratorAction =
  | 'none'
  | 'clarify_item'
  | 'send_offer'
  | 'send_checkout'
  | 'send_external_link'
  | 'schedule_service'
  | 'send_catalog'
  | 'handoff_human';

export interface OrchestratorDecision {
  action: OrchestratorAction;
  message?: string;        // ready-to-send WhatsApp message
  checkoutUrl?: string;    // populated for send_checkout
  productId?: string;      // matched product
  serviceId?: string;      // for schedule_service
  serviceName?: string;    // human-readable service name for schedule_service
  orderId?: string;        // populated for send_checkout (transactional trail)
  paymentId?: string;      // populated for send_checkout (transactional trail)
  reason?: string;         // debug
  handoffTrigger?: 'repetition' | 'checkout_error' | 'no_product' | 'requires_human_approval';
}

// ── Handoff thresholds ───────────────────────────────────────────────────────
const UNRESOLVED_HANDOFF_THRESHOLD = 3;
const NO_PRODUCT_HANDOFF_THRESHOLD = 2;

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

// ── Catalog intent keywords ─────────────────────────────────────────────────
const CATALOG_INTENT_PATTERNS = [
  /\bcatalogo\b/i,
  /\bcatálogo\b/i,
  /\bcardapio\b/i,
  /\bcardápio\b/i,
  /\bprodutos\b/i,
  /\bserviços\b/i,
  /\bservicos\b/i,
  /\bo\s+que\s+voc[eê]s\s+t[eê]m\b/i,
  /\bque\s+voc[eê]s\s+oferecem\b/i,
  /\bvalores\b/i,
  /\btabela\s+de\s+preços\b/i,
  /\bver\s+produtos\b/i,
  /\bver\s+serviços\b/i,
  /\blistar?\s+produtos\b/i,
  /\blistar?\s+serviços\b/i,
  /\bquais\s+(produtos|serviços|opções)\b/i,
  /\bme\s+mostr[ae]\s+(os|as|o|a)?\s*(produtos|serviços|opções|catalogo|catálogo)\b/i,
];

function hasBuyIntent(text: string): boolean {
  return BUY_INTENT_PATTERNS.some((p) => p.test(text));
}

function hasCatalogIntent(text: string): boolean {
  return CATALOG_INTENT_PATTERNS.some((p) => p.test(text));
}

/**
 * Score a product against the incoming message.
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
      score += target === product.name.toLowerCase() ? 2 : 3;
    }
  }

  if (score > 0) score += product.salesPriority * 0.1;
  return score;
}

/**
 * Main orchestrator entry point.
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
    const products = await prisma.product.findMany({
      where: { id: { in: state.candidateProductIds }, tenantId, active: true },
    });

    // Try numeric choice
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

    // Unresolved — clear choice state and pass to AI
    await setCommercialState(tenantId, customerPhone, { awaitingChoice: false }, channel);
    return { action: 'none', reason: 'awaiting_choice_unresolved' };
  }

  // ── 2. Detect catalog intent ──────────────────────────────────────────
  if (hasCatalogIntent(messageText)) {
    return await buildCatalogDecision(tenantId);
  }

  // ── 3. Detect commercial intent ─────────────────────────────────────────
  if (!hasBuyIntent(msgLower)) {
    return { action: 'none', reason: 'no_buy_intent' };
  }

  // ── 4. Find matching active products ────────────────────────────────────
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

  // ── 5. No product match — track and potentially handoff ────────────────
  if (scored.length === 0) {
    const unresolvedCount = (state.unresolvedCount ?? 0) + 1;
    await setCommercialState(tenantId, customerPhone, { unresolvedCount }, channel);

    if (unresolvedCount >= NO_PRODUCT_HANDOFF_THRESHOLD) {
      await setCommercialState(tenantId, customerPhone, { unresolvedCount: 0 }, channel);
      return {
        action: 'handoff_human',
        reason: 'no_product_threshold_reached',
        handoffTrigger: 'no_product',
      };
    }

    return { action: 'none', reason: 'no_product_match' };
  }

  // ── 6. Multiple matches — disambiguation ────────────────────────────────
  if (scored.length > 1) {
    const top = scored.slice(0, 5);
    const lines = top.map((x, i) => `${i + 1}. *${x.p.name}*`).join('\n');
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

  // ── 7. Single match ──────────────────────────────────────────────────────
  const product = scored[0].p;
  return await buildProductDecision(tenantId, product, resolvedContactId, customerPhone, channel, state);
}

// ── Internal: build catalog decision ──────────────────────────────────────────

async function buildCatalogDecision(tenantId: string): Promise<OrchestratorDecision> {
  const [products, services] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, description: true, price: true, currency: true, category: true, serviceId: true },
      orderBy: [{ category: 'asc' }, { salesPriority: 'desc' }, { name: 'asc' }],
      take: 20,
    }),
    prisma.service.findMany({
      where: { tenantId, active: true },
      select: { id: true, name: true, durationMinutes: true },
      orderBy: { name: 'asc' },
      take: 10,
    }),
  ]);

  if (products.length === 0 && services.length === 0) {
    return {
      action: 'send_catalog',
      message: 'No momento não temos produtos ou serviços cadastrados. Em breve teremos novidades! 😊',
      reason: 'empty_catalog',
    };
  }

  const lines: string[] = ['📋 *Nosso Catálogo*\n'];

  if (products.length > 0) {
    let currentCategory = '';
    for (const p of products) {
      const cat = p.category || 'Geral';
      if (cat !== currentCategory) {
        currentCategory = cat;
        lines.push(`\n*${currentCategory}*`);
      }
      const priceStr = p.price > 0
        ? (p.currency?.toUpperCase() === 'BRL' ? `R$${p.price.toFixed(2)}` : `${p.currency} ${p.price.toFixed(2)}`)
        : '';
      const isService = !!p.serviceId;
      const tag = isService ? ' 📅' : '';
      lines.push(`• *${p.name}*${priceStr ? ` — ${priceStr}` : ''}${tag}`);
      if (p.description) {
        lines.push(`  ${p.description.slice(0, 100)}`);
      }
    }
  }

  // Services without linked product (standalone services)
  const linkedServiceIds = new Set(products.filter(p => p.serviceId).map(p => p.serviceId));
  const standaloneServices = services.filter(s => !linkedServiceIds.has(s.id));

  if (standaloneServices.length > 0) {
    lines.push('\n*Serviços para Agendamento* 📅');
    for (const s of standaloneServices) {
      const duration = s.durationMinutes ? ` (${s.durationMinutes}min)` : '';
      lines.push(`• *${s.name}*${duration}`);
    }
  }

  lines.push('\nPara comprar, agendar ou saber mais, basta me dizer o nome do item desejado!');

  return {
    action: 'send_catalog',
    message: lines.join('\n'),
    reason: 'catalog_from_db',
  };
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
  // Reset unresolved counter on successful match
  await setCommercialState(tenantId, customerPhone, { unresolvedCount: 0, awaitingChoice: false }, channel);

  // Human approval required
  if (product.requiresHumanApproval) {
    await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id }, channel);
    return {
      action: 'handoff_human',
      productId: product.id,
      reason: 'requires_human_approval',
      handoffTrigger: 'requires_human_approval',
    };
  }

  // Linked to a service → schedule_service
  if (product.serviceId) {
    // Resolve service name for the webhook to use
    const service = await prisma.service.findUnique({
      where: { id: product.serviceId },
      select: { name: true },
    });
    await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id }, channel);
    return {
      action: 'schedule_service',
      productId: product.id,
      serviceId: product.serviceId,
      serviceName: service?.name ?? product.name,
      message: `Vou te ajudar a agendar *${service?.name ?? product.name}*! 📅`,
      reason: 'product_linked_to_service',
    };
  }

  // External link
  if (product.salesMode === 'external_link' && product.externalSalesUrl) {
    const { buildCheckoutMessage } = await import('@/lib/services/checkoutService');
    const msg = buildCheckoutMessage(
      product.name,
      product.price,
      product.currency,
      product.externalSalesUrl,
      product.salesCtaText
    );
    await setCommercialState(tenantId, customerPhone, { lastOfferedProductId: product.id }, channel);
    return {
      action: 'send_external_link',
      message: msg,
      checkoutUrl: product.externalSalesUrl,
      productId: product.id,
      reason: 'external_link',
    };
  }

  // Dynamic checkout — transactional path
  if (product.salesMode === 'dynamic_checkout') {
    // Check cached checkout (2 hours)
    const recentlySent =
      state.lastOfferedProductId === product.id &&
      state.lastCheckoutUrl &&
      state.lastCheckoutSentAt &&
      (new Date().getTime() - new Date(state.lastCheckoutSentAt).getTime() < 1000 * 60 * 60 * 2);

    if (recentlySent) {
      const { buildCheckoutMessage } = await import('@/lib/services/checkoutService');
      const msg = buildCheckoutMessage(
        product.name,
        product.price,
        product.currency,
        state.lastCheckoutUrl,
        product.salesCtaText
      );
      return {
        action: 'send_checkout',
        message: msg,
        checkoutUrl: state.lastCheckoutUrl,
        productId: product.id,
        orderId: state.lastOrderId,
        reason: 'dynamic_checkout_reused',
      };
    }

    // Execute transactional checkout
    const checkoutResult = await executeConversationalCheckout({
      tenantId,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        description: product.description,
        salesCtaText: product.salesCtaText,
      },
      customerPhone,
      contactId: resolvedContactId,
      channel,
    });

    if (checkoutResult.success) {
      await setCommercialState(tenantId, customerPhone, {
        lastOfferedProductId: product.id,
        lastCheckoutSentAt: new Date().toISOString(),
        lastCheckoutUrl: checkoutResult.checkoutUrl,
        lastOrderId: checkoutResult.orderId,
      }, channel);

      // Persist SalesEvent for analytics (non-blocking, deduplication via catch)
      prisma.salesEvent.create({
        data: {
          tenantId,
          contactId: resolvedContactId ?? '',
          productId: product.id,
          checkoutUrl: checkoutResult.checkoutUrl ?? '',
          status: 'created',
        },
      }).catch(() => {});

      // Persist SalesOpportunity (non-blocking, deduplication via catch)
      prisma.salesOpportunity.create({
        data: {
          tenantId,
          contactId: resolvedContactId ?? '',
          productId: product.id,
          status: 'checkout_enviado',
          value: product.price,
        },
      }).catch(() => {});

      return {
        action: 'send_checkout',
        message: checkoutResult.message,
        checkoutUrl: checkoutResult.checkoutUrl,
        productId: product.id,
        orderId: checkoutResult.orderId,
        paymentId: checkoutResult.paymentId,
        reason: `dynamic_checkout_${checkoutResult.provider}`,
      };
    }

    // Checkout FAILED — trigger handoff instead of silent degrade
    console.error(`[CommercialOrchestrator] Checkout failed: ${checkoutResult.error}`);
    return {
      action: 'handoff_human',
      productId: product.id,
      orderId: checkoutResult.orderId,
      reason: `checkout_error: ${checkoutResult.error}`,
      handoffTrigger: 'checkout_error',
    };
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
