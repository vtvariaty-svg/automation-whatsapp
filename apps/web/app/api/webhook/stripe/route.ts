/**
 * Stripe Product-Sale Webhook
 *
 * Handles `checkout.session.completed` events for **conversational-checkout sessions**
 * (identified by the presence of `metadata.orderId`).
 *
 * Responsibility:
 *   1. Validate Stripe signature (HMAC via constructWebhookEvent)
 *   2. Find the local Payment by providerPaymentId = session.id
 *   3. Advance Payment.status → paid (idempotent)
 *   4. Advance Order.status → paid + append statusHistory entry
 *
 * This route is intentionally separate from /api/billing/webhook, which handles
 * subscription lifecycle events (checkout for SaaS plans, renewals, cancellations).
 * Configure a dedicated Stripe webhook listener pointing to this path.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/services/stripeService';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  // ── 1. Read raw body (must be text before JSON parse for HMAC) ──────────────
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  // ── 2. Validate Stripe signature ────────────────────────────────────────────
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    console.warn('[StripeWebhook] Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event: ReturnType<typeof constructWebhookEvent>;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (err: any) {
    console.error('[StripeWebhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── 3. Route events ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;
      }

      default:
        // Silently acknowledge — we only care about checkout.session.completed here.
        // Subscription events are handled by /api/billing/webhook.
        console.log(`[StripeWebhook] Unhandled event type (ignored): ${event.type}`);
    }
  } catch (err: any) {
    console.error('[StripeWebhook] Error processing event:', err.message, err);
    // Return 500 so Stripe will retry delivery.
    return NextResponse.json({ error: 'Internal error processing event' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ── Handler: checkout.session.completed ─────────────────────────────────────

async function handleCheckoutSessionCompleted(session: any): Promise<void> {
  const sessionId: string = session.id;
  const orderId: string | undefined = session.metadata?.orderId;

  // This webhook only handles conversational-checkout sessions (those with an orderId).
  // Subscription sessions (metadata.plan) are handled by /api/billing/webhook.
  if (!orderId) {
    console.log(
      `[StripeWebhook] checkout.session.completed — no orderId in metadata, skipping (sessionId=${sessionId.slice(0, 20)})`
    );
    return;
  }

  // Additional metadata (informational only — reconciliation is by providerPaymentId)
  const tenantId: string | undefined = session.metadata?.tenantId;

  console.log(
    `[StripeWebhook] Processing checkout.session.completed — sessionId=${sessionId.slice(0, 20)} orderId=${orderId} tenantId=${tenantId ?? 'unknown'}`
  );

  // ── 4. Find Payment by providerPaymentId ────────────────────────────────────
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: sessionId },
    select: { id: true, status: true, orderId: true, tenantId: true },
  });

  if (!payment) {
    // This can happen if the webhook fires before the session is persisted (race condition),
    // or if the session was created by a path that doesn't persist Payment locally.
    // Return 200 to avoid Stripe retry loop — the race window is narrow.
    console.warn(
      `[StripeWebhook] Payment not found for providerPaymentId=${sessionId.slice(0, 20)} — possible race or untracked session`
    );
    return;
  }

  // ── 5. Idempotency guard ────────────────────────────────────────────────────
  if (payment.status === 'paid') {
    console.log(
      `[StripeWebhook] Payment ${payment.id.slice(0, 8)} already paid — skipping (idempotent)`
    );
    return;
  }

  // Verify orderId consistency (sanity check — metadata vs local Payment.orderId)
  if (payment.orderId && payment.orderId !== orderId) {
    console.error(
      `[StripeWebhook] OrderId mismatch: metadata=${orderId} payment.orderId=${payment.orderId} — aborting`
    );
    return;
  }

  // ── 6. Advance Payment.status → paid ────────────────────────────────────────
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'paid',
    },
  });

  console.log(`[StripeWebhook] Payment ${payment.id.slice(0, 8)} advanced to paid`);

  // ── 7. Advance Order.status → paid ──────────────────────────────────────────
  const linkedOrderId = payment.orderId ?? orderId;

  const order = await prisma.order.findUnique({
    where: { id: linkedOrderId },
    select: { id: true, status: true },
  });

  if (!order) {
    console.warn(`[StripeWebhook] Order ${linkedOrderId.slice(0, 8)} not found — Payment updated but Order not advanced`);
    return;
  }

  // Idempotency: do not downgrade from a terminal status.
  if (order.status === 'paid' || order.status === 'completed' || order.status === 'cancelled') {
    console.log(
      `[StripeWebhook] Order ${order.id.slice(0, 8)} already in terminal status "${order.status}" — skipping Order update`
    );
    return;
  }

  const previousStatus = order.status;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'paid',
      statusHistory: {
        create: {
          fromStatus: previousStatus,
          toStatus: 'paid',
          changedBy: 'stripe_webhook',
          reason: `Pagamento confirmado pelo Stripe (session: ${sessionId})`,
        },
      },
    },
  });

  console.log(
    `[StripeWebhook] Order ${order.id.slice(0, 8)} advanced from "${previousStatus}" → paid ✓ (tenantId=${payment.tenantId ?? tenantId ?? 'unknown'})`
  );
}
