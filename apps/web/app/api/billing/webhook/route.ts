import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/services/stripeService';
import { updateSubscriptionFromStripe, resetUsage, markCanceled } from '@/lib/services/subscriptionService';
import { PLANS } from '@/lib/config/plans';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      // ── Checkout completed ────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const tenantId = session.metadata?.tenantId;
        const productId = session.metadata?.productId;
        const contactId = session.metadata?.contactId;
        const plan = session.metadata?.plan || 'free';

        if (!tenantId) break;

        const { prisma } = await import('@/lib/prisma');

        if (productId && contactId) {
          // ── Product-sale checkout (not a subscription change) ────────────
          const salesEvent = await prisma.salesEvent.findFirst({
            where: { tenantId, contactId, productId, status: 'created' },
            orderBy: { createdAt: 'desc' },
          });
          if (salesEvent) {
            await prisma.salesEvent.update({ where: { id: salesEvent.id }, data: { status: 'paid' } });
          }

          const opportunity = await prisma.salesOpportunity.findFirst({
            where: { tenantId, contactId, status: 'checkout_enviado' },
            orderBy: { createdAt: 'desc' },
          });
          if (opportunity) {
            await prisma.salesOpportunity.update({ where: { id: opportunity.id }, data: { status: 'pago' } });
          }

          // ORDERS_V2 — Create Order from checkout (idempotent via externalPaymentRef)
          try {
            const { createOrderFromCheckout } = await import('@/src/services/orderService');
            const product = await prisma.product.findUnique({ where: { id: productId } });
            const stripeSessionId = session.id ?? session.payment_intent ?? `stripe_${Date.now()}`;

            // Find conversation for this contact to link the order
            // contactId is a UUID — resolve real phone first, then query by phone
            const billingContact = await prisma.contact.findFirst({
              where: { id: contactId, tenantId },
              select: { phone: true },
            });
            const conversation = await prisma.conversation.findFirst({
              where: { tenantId, customerPhone: billingContact?.phone ?? '' },
              orderBy: { lastMessageAt: 'desc' },
            });

            await createOrderFromCheckout(
              tenantId,
              contactId,
              productId,
              product?.name ?? 'Produto',
              product?.price ?? 0,
              stripeSessionId,
              conversation?.id
            );

            // Update attribution with orderId
            const { touchAttribution, markConverted } = await import('@/lib/attribution');
            const order = await prisma.order.findUnique({ where: { externalPaymentRef: stripeSessionId } });
            if (order) {
              await touchAttribution(tenantId, contactId, 'whatsapp', 'direct', undefined, { orderId: order.id, opportunityId: opportunity?.id });
              await markConverted(tenantId, contactId, order.price);
            }
          } catch (orderErr) {
            console.error('[Webhook] Error creating Order from checkout:', orderErr);
            // Non-blocking — SalesEvent/Opportunity already updated
          }

          console.log(`[Webhook] Product sale: tenantId=${tenantId} contactId=${contactId} productId=${productId}`);
        } else {
          // ── Subscription checkout ─────────────────────────────────────────
          const planConfig = PLANS[plan];
          const hasTrial = planConfig?.hasTrial ?? false;

          // If Standard → trial; Pro/Business/Free → immediate active
          const trialEnd = hasTrial ? new Date(Date.now() + 7 * 86_400_000) : null;
          const status = hasTrial ? 'trialing' : 'active';

          const dbPlan = await prisma.plan.findFirst({
            where: { name: { contains: plan, mode: 'insensitive' } },
          });

          await updateSubscriptionFromStripe(tenantId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            plan,
            planId: dbPlan?.id || undefined,
            status,
            trialEnd,
            currentPeriodStart: new Date(),
          });

          console.log(`[Webhook] Subscription checkout: tenantId=${tenantId} plan=${plan} status=${status} trial=${hasTrial}`);
        }
        break;
      }

      // ── Subscription updated (plan change / trial converted) ───────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const { prisma } = await import('@/lib/prisma');

        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!subscription) break;

        const stripeStatus = sub.status; // 'active' | 'trialing' | 'canceled' | etc.
        const plan = sub.metadata?.plan || subscription.plan;

        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : undefined;

        await updateSubscriptionFromStripe(subscription.tenantId, {
          plan,
          status: stripeStatus,
          trialEnd,
          currentPeriodEnd: periodEnd,
        });

        console.log(`[Webhook] Subscription updated: tenantId=${subscription.tenantId} plan=${plan} status=${stripeStatus}`);
        break;
      }

      // ── Invoice paid (billing cycle renewal) ──────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const { prisma } = await import('@/lib/prisma');
          const subscription = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (subscription) {
            const periodStart = invoice.lines?.data?.[0]?.period?.start
              ? new Date(invoice.lines.data[0].period.start * 1000)
              : new Date();
            const periodEnd = invoice.lines?.data?.[0]?.period?.end
              ? new Date(invoice.lines.data[0].period.end * 1000)
              : undefined;

            // Mark active (trial converted to paid) and update period
            await updateSubscriptionFromStripe(subscription.tenantId, {
              status: 'active',
              trialEnd: null, // trial is over once paid
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            });

            // Reset usage counter on new billing cycle
            await resetUsage(subscription.tenantId);
            console.log(`[Webhook] Invoice paid: tenantId=${subscription.tenantId} period_end=${periodEnd}`);
          }
        }
        break;
      }

      // ── Subscription deleted (canceled) ───────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const { prisma } = await import('@/lib/prisma');
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (subscription) {
          await markCanceled(subscription.tenantId);
          console.log(`[Webhook] Subscription canceled: tenantId=${subscription.tenantId}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
