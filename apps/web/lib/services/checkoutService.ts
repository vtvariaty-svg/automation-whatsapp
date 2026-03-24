/**
 * COMM1 — Checkout Service
 * Internal checkout URL generation + message building, callable without HTTP/JWT.
 * Shared by the /api/sales/create-checkout route and the commercialOrchestrator.
 */

import { prisma } from '@/lib/prisma';

export interface CheckoutResult {
  checkoutUrl: string;
  provider: 'stripe' | 'asaas' | 'placeholder';
}

/**
 * Generate a checkout URL for a product.
 * Priority: Stripe → Asaas → placeholder.
 * Does NOT persist SalesEvent — caller is responsible.
 */
export async function generateCheckoutUrl(
  tenantId: string,
  productId: string,
  contactId: string
): Promise<CheckoutResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
  });

  if (!product) {
    throw new Error(`Product ${productId} not found for tenant ${tenantId}`);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

  // ── Stripe ────────────────────────────────────────────────────────────────
  if (process.env.STRIPE_SECRET_KEY) {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: (product.currency || 'BRL').toLowerCase(),
            product_data: {
              name: product.name,
              ...(product.description && { description: product.description }),
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: { tenantId, contactId, productId },
    });

    return { checkoutUrl: session.url!, provider: 'stripe' };
  }

  // ── Asaas ─────────────────────────────────────────────────────────────────
  const payConfig = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId },
  }).catch(() => null);

  if (payConfig?.enabled && payConfig.apiKey && payConfig.provider === 'asaas') {
    const asaasBase =
      payConfig.environment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';

    // Create payment link via Asaas
    const res = await fetch(`${asaasBase}/paymentLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: payConfig.apiKey,
      },
      body: JSON.stringify({
        name: product.name,
        description: product.description || '',
        endDate: null,
        value: product.price,
        billingType: 'UNDEFINED',
        chargeType: 'DETACHED',
        dueDateLimitDays: 3,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return { checkoutUrl: data.url, provider: 'asaas' };
      }
    }
  }

  // ── Placeholder ───────────────────────────────────────────────────────────
  return {
    checkoutUrl: `${baseUrl}/checkout/${productId}?c=${contactId}`,
    provider: 'placeholder',
  };
}

/**
 * Build a WhatsApp-ready checkout message (raw URL, no markdown).
 * Example:
 *   Ótimo! Preparei seu link de pagamento para "Corte de Cabelo Feminino" por R$80,00:
 *   https://checkout.stripe.com/...
 *   O link é válido por 24h. Qualquer dúvida, é só chamar!
 */
export function buildCheckoutMessage(
  productName: string,
  price: number,
  currency: string,
  checkoutUrl: string,
  ctaText?: string | null
): string {
  const formatted =
    currency.toUpperCase() === 'BRL'
      ? `R$${price.toFixed(2)}`
      : `${currency} ${price.toFixed(2)}`;

  const cta = ctaText || 'Acesse o link abaixo para finalizar sua compra:';

  return `${cta}\n\n*${productName}* — ${formatted}\n${checkoutUrl}\n\nO link é válido por 24h. Qualquer dúvida, é só chamar!`;
}

/**
 * Build a simple offer/presentation message (no checkout URL).
 * Used when salesMode='none' or when we want to present before sending the link.
 */
export function buildOfferMessage(
  productName: string,
  price: number,
  currency: string,
  description?: string | null,
  ctaText?: string | null
): string {
  const formatted =
    currency.toUpperCase() === 'BRL'
      ? `R$${price.toFixed(2)}`
      : `${currency} ${price.toFixed(2)}`;

  const descLine = description ? `\n${description}` : '';
  const cta = ctaText || 'Quer que eu envie o link de pagamento?';

  return `*${productName}* — ${formatted}${descLine}\n\n${cta}`;
}
