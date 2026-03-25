import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/session';
import { getSubscription, createSubscription } from '@/lib/services/subscriptionService';
import { createCustomer, createCheckoutSession, cancelSubscription } from '@/lib/services/stripeService';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/config/plans';

export async function POST(req: Request) {
  try {
    const session = await requireAuth(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    if (!PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // ── Downgrade to Free ─────────────────────────────────────────────────────
    if (plan === 'free') {
      const existing = await getSubscription(session.tenantId);

      if (!existing) {
        // No subscription yet — just create a free one
        await createSubscription(session.tenantId, 'free');
      } else {
        // Cancel active Stripe subscription BEFORE clearing stripeSubscriptionId
        // in the DB. This order matters:
        //   1. Cancel in Stripe → prevents continued billing.
        //   2. Clear stripeSubscriptionId in DB → when Stripe fires
        //      customer.subscription.deleted, our webhook will not find the record
        //      (findFirst by stripeSubscriptionId returns null) and will silently
        //      ignore the event, avoiding a status overwrite conflict.
        //
        // stripeCustomerId is intentionally retained so future upgrades can reuse
        // the existing Stripe customer record instead of creating a duplicate.
        if (existing.stripeSubscriptionId) {
          try {
            await cancelSubscription(existing.stripeSubscriptionId);
          } catch (stripeErr: any) {
            // 'resource_missing' (404) = subscription already canceled/deleted in Stripe.
            // Safe to ignore — we still need to clean up the local state.
            if (stripeErr?.code !== 'resource_missing' && stripeErr?.statusCode !== 404) {
              console.error('[Billing] Stripe cancel error on free downgrade:', stripeErr?.message);
              // Still proceed with the local downgrade to keep DB consistent.
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
            trialEnd: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
            // stripeCustomerId intentionally kept — see comment above.
          },
        });
      }

      return NextResponse.json({ plan: 'free', price: 0, noCheckout: true, downgraded: true });
    }

    // ── Paid plan checkout (Standard / Pro / Business) ────────────────────────
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
