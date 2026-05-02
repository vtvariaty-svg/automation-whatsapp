import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/session';
import { getSubscription, createSubscription } from '@/lib/services/subscriptionService';
import { createCustomer, createCheckoutSession, cancelSubscription } from '@/lib/services/stripeService';
import { prisma } from '@/lib/prisma';
import { PLANS, WHATSAPP_BUSINESS_URL } from '@/lib/config/plans';

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    const planConfig = PLANS[plan];

    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Legacy paid plans are no longer available for new checkout.
    // free downgrade remains available for backward compat (handled below).
    const LEGACY_PAID_PLANS = ['pro', 'business', 'starter', 'standard'];
    if (LEGACY_PAID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: 'Este plano foi descontinuado para novas assinaturas. Escolha Plano Consultório ou Plano Restaurante.' },
        { status: 410 }
      );
    }

    if (planConfig.isConsultative) {
      return NextResponse.json(
        {
          noCheckout: true,
          contactSales: true,
          contactUrl: WHATSAPP_BUSINESS_URL,
          message: 'O plano selecionado é consultivo. Entre em contato com a equipe comercial para assinar.'
        },
        { status: 200 }
      );
    }

    // ── Downgrade to Free ─────────────────────────────────────────────────────
    if (plan === 'free') {
      const existing = await getSubscription(session.tenantId);

      if (!existing) {
        // No subscription yet — just create a free one.
        await createSubscription(session.tenantId, 'free');
        return NextResponse.json({ plan: 'free', price: 0, noCheckout: true, downgraded: true, canceledStripeSubscription: false });
      }

      // canceledStripeSubscription tracks whether we actually canceled a live
      // Stripe subscription in this request (used by the UI for accurate messaging).
      let canceledStripeSubscription = false;

      if (existing.stripeSubscriptionId) {
        try {
          await cancelSubscription(existing.stripeSubscriptionId);
          // Order matters:
          //   1. Cancel in Stripe → stops continued billing.
          //   2. Clear stripeSubscriptionId in DB (below) → when Stripe fires
          //      customer.subscription.deleted, findFirst returns null and the
          //      webhook silently ignores the event, preventing a status conflict.
          //
          // stripeCustomerId is intentionally retained for future upgrades.
          canceledStripeSubscription = true;
        } catch (stripeErr: any) {
          if (stripeErr?.code === 'resource_missing' || stripeErr?.statusCode === 404) {
            // Subscription already canceled/deleted in Stripe — safe to clean up locally.
            canceledStripeSubscription = false;
          } else {
            // Real Stripe error: ABORT the local downgrade to prevent DB ↔ Stripe divergence.
            // The subscription remains active in both systems; user can retry.
            console.error('[Billing] Stripe cancel error on free downgrade:', stripeErr?.message);
            return NextResponse.json(
              { error: 'Não foi possível cancelar a assinatura no Stripe. Tente novamente ou entre em contato com o suporte.' },
              { status: 502 }
            );
          }
        }
      }

      await prisma.subscription.update({
        where: { tenantId: session.tenantId },
        data: {
          plan: 'free',
          status: 'active',
          // Clear all period/plan fields that belong to the canceled paid subscription.
          stripeSubscriptionId: null,
          planId: null,
          trialEnd: null, // Trial reset
          currentPeriodStart: null,
          currentPeriodEnd: null,
          // stripeCustomerId intentionally kept — see comment above.
        },
      });

      return NextResponse.json({ plan: 'free', price: 0, noCheckout: true, downgraded: true, canceledStripeSubscription });
    }

    // ── Paid plan checkout (Pro) ────────────────────────
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: { users: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    let subscription = await getSubscription(session.tenantId);
    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const user = tenant.users[0];
      const customer = await createCustomer(user?.email || '', tenant.name);
      stripeCustomerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      plan,
      `${origin}/dashboard/billing?success=true`,
      `${origin}/dashboard/billing?canceled=true`,
      session.tenantId
    );

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error('Billing checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
