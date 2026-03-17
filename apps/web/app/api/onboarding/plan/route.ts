import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/authService';
import { createSubscription, getSubscription } from '@/lib/services/subscriptionService';
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
    if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const existing = await getSubscription(payload.tenantId);

    // Free and Standard (trial): create/update subscription directly, no Stripe checkout needed
    if (plan === 'free' || plan === 'standard') {
      const hasTrial = PLANS[plan].hasTrial ?? false;
      const trialEnd = hasTrial ? new Date(Date.now() + 7 * 86_400_000) : null;

      if (!existing) {
        await createSubscription(payload.tenantId, plan);
      } else {
        await prisma.subscription.update({
          where: { tenantId: payload.tenantId },
          data: {
            plan,
            status: hasTrial ? 'trialing' : 'active',
            trialEnd,
          },
        });
      }
      return NextResponse.json({ continue: true, trial: hasTrial, trialEnd });
    }

    // Pro / Business: redirect to Stripe checkout
    // Success URL returns to onboarding step 1 to continue setup
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      include: { users: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    let stripeCustomerId = existing?.stripeCustomerId;
    if (!stripeCustomerId) {
      const user = tenant.users[0];
      const customer = await createCustomer(user?.email || '', tenant.name);
      stripeCustomerId = customer.id;
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession(
      stripeCustomerId,
      plan,
      `${origin}/onboarding/step/1`,
      `${origin}/onboarding/plan`,
      payload.tenantId
    );

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error: any) {
    console.error('[Onboarding plan] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
