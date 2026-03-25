/**
 * CONV-CHECKOUT — Transactional Checkout for Conversational Flows
 *
 * Single coordinator that ensures a durable local trail for every
 * checkout generated from WhatsApp / conversational commerce:
 *
 *   1. Resolve / ensure Contact
 *   2. Create local Order (draft → pending_payment)
 *   3. Create local Payment with provider reference
 *   4. Call external provider (Asaas or Stripe)
 *   5. Persist providerPaymentId
 *   6. Return checkout URL + formatted WhatsApp message
 *
 * Asaas path: delegates to paymentService.createPaymentLink (creates charge + Payment + links Order).
 * Stripe path: creates Stripe session + persists Payment locally.
 * No provider: placeholder URL with local Order for manual reconciliation.
 *
 * NOTE on Stripe webhook: this service persists Payment with providerPaymentId = session.id.
 * A Stripe webhook handler is NOT shipped in this refactor — reconciliation from Stripe
 * requires a /api/webhook/stripe endpoint that finds Payment by providerPaymentId and
 * advances status. This is explicitly called out as a remaining gap.
 */

import { prisma } from '@/lib/prisma';
import { createOrder } from '@/src/services/orderService';
import { createPaymentLink } from '@/src/services/paymentService';
import { buildCheckoutMessage } from '@/lib/services/checkoutService';
import { upsertContactByPhone } from '@/lib/services/contactService';
import { addDays, format } from 'date-fns';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConversationalCheckoutProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string | null;
  salesCtaText?: string | null;
}

export interface ConversationalCheckoutInput {
  tenantId: string;
  product: ConversationalCheckoutProduct;
  customerPhone: string;
  contactId?: string;
  conversationId?: string;
  channel?: string;
}

export interface ConversationalCheckoutResult {
  success: boolean;
  message: string;
  orderId?: string;
  paymentId?: string;
  checkoutUrl?: string;
  provider?: 'asaas' | 'stripe' | 'placeholder';
  error?: string;
}

// ── Main entry point ─────────────────────────────────────────────────────────

export async function executeConversationalCheckout(
  input: ConversationalCheckoutInput
): Promise<ConversationalCheckoutResult> {
  const { tenantId, product, customerPhone, channel = 'whatsapp' } = input;

  // ── 1. Resolve / ensure Contact ──────────────────────────────────────────
  let contactId = input.contactId;
  if (!contactId) {
    const existing = await prisma.contact.findFirst({
      where: { tenantId, normalizedPhone: customerPhone.replace(/\D/g, '') },
      select: { id: true },
    });
    contactId = existing?.id;
  }
  if (!contactId) {
    const upserted = await upsertContactByPhone({
      tenantId,
      phone: customerPhone,
      source: channel,
    });
    contactId = upserted?.id;
  }
  if (!contactId) {
    return {
      success: false,
      message: 'Não foi possível identificar o contato para gerar o checkout.',
      error: 'contact_resolution_failed',
    };
  }

  // ── 2. Resolve conversation ID ──────────────────────────────────────────
  let conversationId = input.conversationId;
  if (!conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { tenantId, customerPhone, channel },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true },
    });
    conversationId = conv?.id ?? undefined;
  }

  // ── 3. Resolve customer name ─────────────────────────────────────────────
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, tenantId },
    select: { name: true, phone: true, email: true },
  });
  const customerName = contact?.name || 'Cliente WhatsApp';

  // ── 4. Create local Order (draft) ────────────────────────────────────────
  let order;
  try {
    order = await createOrder({
      tenantId,
      customerPhone,
      customerName: contact?.name ?? undefined,
      contactId,
      conversationId,
      origin: channel,
      status: 'draft',
      items: [{
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
      }],
    }, 'conversational_checkout');
  } catch (orderErr: any) {
    console.error('[ConversationalCheckout] Order creation failed:', orderErr?.message);
    return {
      success: false,
      message: '',
      error: `order_creation_failed: ${orderErr?.message}`,
    };
  }

  // ── 5. Determine provider and create payment ─────────────────────────────

  // 5a. Check Asaas
  const payConfig = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId },
  }).catch(() => null);

  const useAsaas = !!(payConfig?.enabled && payConfig.apiKey && payConfig.provider === 'asaas');

  if (useAsaas) {
    return await checkoutViaAsaas({
      tenantId, product, order, contactId, conversationId,
      customerName, customerPhone, customerEmail: contact?.email ?? undefined,
    });
  }

  // 5b. Check Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    return await checkoutViaStripe({
      tenantId, product, order, contactId, conversationId,
      customerName, customerPhone,
    });
  }

  // 5c. No provider — placeholder
  return checkoutPlaceholder({ tenantId, product, order, contactId });
}

// ── Asaas path ──────────────────────────────────────────────────────────────

async function checkoutViaAsaas(ctx: {
  tenantId: string;
  product: ConversationalCheckoutProduct;
  order: any;
  contactId: string;
  conversationId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}): Promise<ConversationalCheckoutResult> {
  const dueDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  try {
    const payment = await createPaymentLink({
      tenantId: ctx.tenantId,
      orderId: ctx.order.id,
      contactId: ctx.contactId,
      conversationId: ctx.conversationId,
      customerData: {
        name: ctx.customerName,
        phone: ctx.customerPhone,
        email: ctx.customerEmail,
      },
      amount: ctx.product.price,
      description: ctx.product.name,
      dueDate,
      billingType: 'UNDEFINED',
    });

    const checkoutUrl = payment.invoiceUrl ?? '';
    const message = buildCheckoutMessage(
      ctx.product.name,
      ctx.product.price,
      ctx.product.currency,
      checkoutUrl,
      ctx.product.salesCtaText,
    );

    return {
      success: true,
      message,
      orderId: ctx.order.id,
      paymentId: payment.id,
      checkoutUrl,
      provider: 'asaas',
    };
  } catch (err: any) {
    console.error('[ConversationalCheckout][Asaas] Payment creation failed:', err?.message);
    return {
      success: false,
      message: '',
      orderId: ctx.order.id,
      provider: 'asaas',
      error: `asaas_payment_failed: ${err?.message}`,
    };
  }
}

// ── Stripe path ─────────────────────────────────────────────────────────────

async function checkoutViaStripe(ctx: {
  tenantId: string;
  product: ConversationalCheckoutProduct;
  order: any;
  contactId: string;
  conversationId?: string;
  customerName: string;
  customerPhone: string;
}): Promise<ConversationalCheckoutResult> {
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia' as any,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: (ctx.product.currency || 'BRL').toLowerCase(),
          product_data: {
            name: ctx.product.name,
            ...(ctx.product.description && { description: ctx.product.description }),
          },
          unit_amount: Math.round(ctx.product.price * 100),
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        tenantId: ctx.tenantId,
        contactId: ctx.contactId,
        productId: ctx.product.id,
        orderId: ctx.order.id,
      },
    });

    // Persist Payment locally so Stripe webhook can reconcile
    const dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const payment = await prisma.payment.create({
      data: {
        tenantId: ctx.tenantId,
        sourceType: 'order',
        orderId: ctx.order.id,
        contactId: ctx.contactId,
        conversationId: ctx.conversationId ?? null,
        provider: 'stripe',
        providerPaymentId: session.id,
        invoiceUrl: session.url,
        status: 'pending',
        amount: ctx.product.price,
        currency: ctx.product.currency || 'BRL',
        description: ctx.product.name,
        customerName: ctx.customerName,
        customerPhone: ctx.customerPhone,
        dueDate,
        billingType: 'CREDIT_CARD',
      },
    });

    // Link Payment to Order and advance to pending_payment
    await prisma.order.update({
      where: { id: ctx.order.id },
      data: {
        paymentId: payment.id,
        externalPaymentRef: session.id,
        status: 'pending_payment',
        statusHistory: {
          create: {
            fromStatus: 'draft',
            toStatus: 'pending_payment',
            changedBy: 'conversational_checkout',
            reason: `Stripe session criada: ${session.id}`,
          },
        },
      },
    });

    const message = buildCheckoutMessage(
      ctx.product.name,
      ctx.product.price,
      ctx.product.currency,
      session.url!,
      ctx.product.salesCtaText,
    );

    return {
      success: true,
      message,
      orderId: ctx.order.id,
      paymentId: payment.id,
      checkoutUrl: session.url!,
      provider: 'stripe',
    };
  } catch (err: any) {
    console.error('[ConversationalCheckout][Stripe] Session creation failed:', err?.message);
    return {
      success: false,
      message: '',
      orderId: ctx.order.id,
      provider: 'stripe',
      error: `stripe_session_failed: ${err?.message}`,
    };
  }
}

// ── Placeholder path (no provider configured) ────────────────────────────────

function checkoutPlaceholder(ctx: {
  tenantId: string;
  product: ConversationalCheckoutProduct;
  order: any;
  contactId: string;
}): ConversationalCheckoutResult {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';
  const placeholderUrl = `${baseUrl}/checkout/${ctx.product.id}?c=${ctx.contactId}&o=${ctx.order.id}`;

  const message = buildCheckoutMessage(
    ctx.product.name,
    ctx.product.price,
    ctx.product.currency,
    placeholderUrl,
    ctx.product.salesCtaText,
  );

  return {
    success: true,
    message,
    orderId: ctx.order.id,
    checkoutUrl: placeholderUrl,
    provider: 'placeholder',
  };
}
