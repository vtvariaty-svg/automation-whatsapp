import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { verifyToken } from '@/lib/services/authService';
import { getSubscription, createSubscription } from '@/lib/services/subscriptionService';
import { createCustomer, createCheckoutSession } from '@/lib/services/stripeService';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/config/plans';

export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { plan } = await req.json();
    if (!PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Free plan: no Stripe checkout needed — just upsert the subscription record directly
    if (plan === 'free') {
      const existing = await getSubscription(payload.tenantId);
      if (!existing) {
        await createSubscription(payload.tenantId, 'free');
      } else {
        // Downgrade to free: update plan, clear Stripe fields, set active status
        await prisma.subscription.update({
          where: { tenantId: payload.tenantId },
          data: { plan: 'free', status: 'active', trialEnd: null },
        });
      }
      return NextResponse.json({ plan: 'free', price: 0, noCheckout: true });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      include: { users: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    let subscription = await getSubscription(payload.tenantId);
    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const user = tenant.users[0];
      const customer = await createCustomer(user?.email || '', tenant.name);
      stripeCustomerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession(
      stripeCustomerId,
      plan,
      `${origin}/dashboard/billing?success=true`,
      `${origin}/dashboard/billing?canceled=true`,
      payload.tenantId
    );

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error: any) {
    console.error('Billing checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
