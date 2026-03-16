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

// ─── L2 Plan Entitlements ──────────────────────────────────────────────────

export type FeatureKey =
  | 'instagram'
  | 'facebook'
  | 'abTesting'
  | 'whiteLabel'
  | 'premiumTemplates'
  | 'aiCopilot'
  | 'conversionSequences'
  | 'advancedCRM';

export type LimitKey = 'messages' | 'agents' | 'automations' | 'contacts' | 'conversations';

export interface PlanEntitlements {
  channels: string[];
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number>; // -1 = unlimited
}

const UNLIMITED = -1;

export const PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  starter: {
    channels: ['whatsapp'],
    features: {
      instagram: false,
      facebook: false,
      abTesting: false,
      whiteLabel: false,
      premiumTemplates: false,
      aiCopilot: false,
      conversionSequences: false,
      advancedCRM: false,
    },
    limits: { messages: 1000, agents: 1, automations: 5, contacts: 500, conversations: 500 },
  },
  pro: {
    channels: ['whatsapp', 'instagram'],
    features: {
      instagram: true,
      facebook: false,
      abTesting: true,
      whiteLabel: false,
      premiumTemplates: true,
      aiCopilot: true,
      conversionSequences: true,
      advancedCRM: false,
    },
    limits: { messages: 4000, agents: 3, automations: 20, contacts: 2000, conversations: 2000 },
  },
  business: {
    channels: ['whatsapp', 'instagram', 'facebook'],
    features: {
      instagram: true,
      facebook: true,
      abTesting: true,
      whiteLabel: true,
      premiumTemplates: true,
      aiCopilot: true,
      conversionSequences: true,
      advancedCRM: true,
    },
    limits: {
      messages: 15000,
      agents: UNLIMITED,
      automations: UNLIMITED,
      contacts: UNLIMITED,
      conversations: UNLIMITED,
    },
  },
  superadmin: {
    channels: ['whatsapp', 'instagram', 'facebook'],
    features: {
      instagram: true,
      facebook: true,
      abTesting: true,
      whiteLabel: true,
      premiumTemplates: true,
      aiCopilot: true,
      conversionSequences: true,
      advancedCRM: true,
    },
    limits: {
      messages: UNLIMITED,
      agents: UNLIMITED,
      automations: UNLIMITED,
      contacts: UNLIMITED,
      conversations: UNLIMITED,
    },
  },
};

export const FEATURE_UPGRADE_MESSAGES: Record<FeatureKey, string> = {
  instagram: 'Instagram está disponível nos planos Pro e Business. Faça upgrade para conectar.',
  facebook: 'Facebook Messenger está disponível no plano Business. Faça upgrade para conectar.',
  abTesting: 'Testes A/B estão disponíveis nos planos Pro e Business.',
  whiteLabel: 'White-label está disponível exclusivamente no plano Business.',
  premiumTemplates: 'Templates premium estão disponíveis nos planos Pro e Business.',
  aiCopilot: 'AI Copilot está disponível nos planos Pro e Business.',
  conversionSequences: 'Sequências de conversão estão disponíveis nos planos Pro e Business.',
  advancedCRM: 'CRM Avançado (tags, segmentos, lead score) está disponível no plano Business.',
};
