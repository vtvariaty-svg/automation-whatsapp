export interface PlanConfig {
  name: string;
  slug: string;
  price: number;
  limitMessages: number;
  stripePriceId: string;
}

export const PLANS: Record<string, PlanConfig> = {
  starter: {
    name: 'Starter',
    slug: 'starter',
    price: 39.90,
    limitMessages: 1000,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    price: 79.90,
    limitMessages: 4000,
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  },
  business: {
    name: 'Business',
    slug: 'business',
    price: 149.00,
    limitMessages: 15000,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business_placeholder',
  },
};

export const TRIAL_DAYS = 7;

export const getPlan = (slug: string): PlanConfig | undefined => PLANS[slug];

export const getPlanLimit = (slug: string): number => {
  return PLANS[slug]?.limitMessages ?? 0;
};
