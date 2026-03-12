import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/services/stripeService';
import { updateSubscriptionFromStripe, resetUsage, markCanceled } from '@/lib/services/subscriptionService';

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
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan;

        if (tenantId) {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);

          // Find the planId in the DB
          const { prisma } = await import('@/lib/prisma');
          const dbPlan = await prisma.plan.findFirst({ where: { name: { contains: plan || 'Starter', mode: 'insensitive' } } });

          await updateSubscriptionFromStripe(tenantId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            plan: plan || 'starter',
            planId: dbPlan?.id || undefined,
            status: 'trialing',
            trialEnd,
            currentPeriodStart: new Date(),
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          // Find tenant by Stripe subscription ID
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

            await updateSubscriptionFromStripe(subscription.tenantId, {
              status: 'active',
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            });

            // Reset usage on new billing cycle
            await resetUsage(subscription.tenantId);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const { prisma } = await import('@/lib/prisma');
        const subscription = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (subscription) {
          await markCanceled(subscription.tenantId);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
