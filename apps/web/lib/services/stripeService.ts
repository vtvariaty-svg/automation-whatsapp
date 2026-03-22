import Stripe from 'stripe';
import { PLANS, TRIAL_DAYS } from '../config/plans';

const getStripe = () =>
  new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia' as any,
  });

export const createCustomer = async (email: string, name: string) => {
  const customer = await getStripe().customers.create({
    email,
    name,
  });
  return customer;
};

export const createCheckoutSession = async (
  customerId: string,
  plan: string,
  successUrl: string,
  cancelUrl: string,
  tenantId: string
) => {
  const planConfig = PLANS[plan];
  if (!planConfig) throw new Error(`Invalid plan: ${plan}`);

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: planConfig.stripePriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      ...(planConfig.hasTrial ? { trial_period_days: TRIAL_DAYS } : {}),
      metadata: {
        tenantId,
        plan,
      },
    },
    metadata: {
      tenantId,
      plan,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
};

export const cancelSubscription = async (subscriptionId: string) => {
  const subscription = await getStripe().subscriptions.cancel(subscriptionId);
  return subscription;
};

export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string
) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
};
