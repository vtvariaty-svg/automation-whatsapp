import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createSubscription, getSubscription } from '@/lib/services/subscriptionService';
import { createCustomer, createCheckoutSession } from '@/lib/services/stripeService';
import { prisma } from '@/lib/prisma';
import { PLANS, WHATSAPP_BUSINESS_URL } from '@/lib/config/plans';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    if (!PLANS[plan]) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const existing = await getSubscription(auth.tenantId);

    // Free and legacy Standard: create/update subscription directly, no Stripe checkout needed
    if (plan === 'free' || plan === 'standard') {
      const hasTrial = PLANS[plan].hasTrial ?? false;
      const trialEnd = hasTrial ? new Date(Date.now() + 7 * 86_400_000) : null;

      if (!existing) {
        await createSubscription(auth.tenantId, plan);
      } else {
        await prisma.subscription.update({
          where: { tenantId: auth.tenantId },
          data: {
            plan,
            status: hasTrial ? 'trialing' : 'active',
            trialEnd,
          },
        });
      }
      return NextResponse.json({ continue: true, trial: hasTrial, trialEnd });
    }

    // Block Consultative / Business plans from attempting Stripe API initialization
    if (PLANS[plan].isConsultative || plan === 'business') {
      return NextResponse.json({
        noCheckout: true,
        contactSales: true,
        contactUrl: WHATSAPP_BUSINESS_URL,
        message: "O plano selecionado é consultivo. Fale com nossa equipe comercial para continuar."
      }, { status: 200 });
    }

    // Pro (or remaining paid self-service): redirect to Stripe checkout
    // Success URL returns to onboarding step 1 to continue setup
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
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
    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      plan,
      `${origin}/onboarding/step/1`,
      `${origin}/onboarding/plan`,
      auth.tenantId
    );

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error('[Onboarding plan] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
