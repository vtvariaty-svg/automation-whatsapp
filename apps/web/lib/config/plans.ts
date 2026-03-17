// ─── PLAN_V2: 4-plan commercial structure ─────────────────────────────────
// Free → Standard → Pro → Business
// Trial ONLY for Standard (7 days). Free has no trial. Pro/Business have no trial.
// ──────────────────────────────────────────────────────────────────────────────

export interface PlanConfig {
  name: string;
  slug: string;
  price: number; // BRL/month. 0 = free
  limitMessages: number;
  stripePriceId: string;
  hasTrial: boolean; // ONLY Standard = true
}

export const PLANS: Record<string, PlanConfig> = {
  free: {
    name: 'Free',
    slug: 'free',
    price: 0,
    limitMessages: 500,
    stripePriceId: '',
    hasTrial: false,
  },
  standard: {
    name: 'Standard',
    slug: 'standard',
    price: 49.90,
    limitMessages: 3000,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD || 'price_standard_placeholder',
    hasTrial: true, // 7-day trial — ONLY this plan
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    price: 97.00,
    limitMessages: 10000,
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
    hasTrial: false,
  },
  business: {
    name: 'Business',
    slug: 'business',
    price: 197.00,
    limitMessages: -1, // unlimited
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business_placeholder',
    hasTrial: false,
  },
  // Legacy alias — existing DB rows with plan='starter' fall back to free entitlements
  starter: {
    name: 'Starter',
    slug: 'starter',
    price: 39.90,
    limitMessages: 1000,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
    hasTrial: false,
  },
};

export const TRIAL_DAYS = 7; // applies only to Standard

export const getPlan = (slug: string): PlanConfig | undefined => PLANS[slug];

export const getPlanLimit = (slug: string): number => PLANS[slug]?.limitMessages ?? 0;

// ─── Feature & Limit keys ─────────────────────────────────────────────────

export type FeatureKey =
  | 'whatsapp'          // WhatsApp Business channel
  | 'instagram'         // Instagram DM + comments
  | 'facebook'          // Facebook Messenger
  | 'instagramComments' // Auto-reply to Instagram comments
  | 'advancedCRM'       // Tags, lead score, dynamic segments
  | 'dynamicSegments'   // Audience segments + A/B test
  | 'abTesting'         // A/B message testing
  | 'aiCopilot'         // AI Copilot / Insights features
  | 'conversionSequences' // Drip/follow-up sequences
  | 'premiumTemplates'  // Premium WhatsApp templates
  | 'whiteLabel'        // White-label / custom branding
  | 'agencyReseller';   // Agency panel + reseller features

export type LimitKey = 'messages' | 'agents' | 'automations' | 'contacts' | 'conversations';

export interface PlanEntitlements {
  channels: string[];
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number>; // -1 = unlimited
}

const UNLIMITED = -1;

export const PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  // ── Free ────────────────────────────────────────────────────────────────
  free: {
    channels: ['instagram'],
    features: {
      whatsapp: false,
      instagram: true,
      facebook: false,
      instagramComments: false,
      advancedCRM: false,
      dynamicSegments: false,
      abTesting: false,
      aiCopilot: false,
      conversionSequences: false,
      premiumTemplates: false,
      whiteLabel: false,
      agencyReseller: false,
    },
    limits: { messages: 500, agents: 1, automations: 5, contacts: 1000, conversations: 200 },
  },

  // ── Standard ────────────────────────────────────────────────────────────
  standard: {
    channels: ['instagram', 'whatsapp'],
    features: {
      whatsapp: true,
      instagram: true,
      facebook: false,
      instagramComments: true,
      advancedCRM: false,
      dynamicSegments: false,
      abTesting: false,
      aiCopilot: false,
      conversionSequences: true,
      premiumTemplates: false,
      whiteLabel: false,
      agencyReseller: false,
    },
    limits: { messages: 3000, agents: 2, automations: 15, contacts: 5000, conversations: 5000 },
  },

  // ── Pro ─────────────────────────────────────────────────────────────────
  pro: {
    channels: ['instagram', 'whatsapp', 'facebook'],
    features: {
      whatsapp: true,
      instagram: true,
      facebook: true,
      instagramComments: true,
      advancedCRM: true,
      dynamicSegments: true,
      abTesting: true,
      aiCopilot: true,
      conversionSequences: true,
      premiumTemplates: true,
      whiteLabel: false,
      agencyReseller: false,
    },
    limits: { messages: 10000, agents: 5, automations: UNLIMITED, contacts: 20000, conversations: UNLIMITED },
  },

  // ── Business ────────────────────────────────────────────────────────────
  business: {
    channels: ['instagram', 'whatsapp', 'facebook'],
    features: {
      whatsapp: true,
      instagram: true,
      facebook: true,
      instagramComments: true,
      advancedCRM: true,
      dynamicSegments: true,
      abTesting: true,
      aiCopilot: true,
      conversionSequences: true,
      premiumTemplates: true,
      whiteLabel: true,
      agencyReseller: true,
    },
    limits: {
      messages: UNLIMITED,
      agents: UNLIMITED,
      automations: UNLIMITED,
      contacts: UNLIMITED,
      conversations: UNLIMITED,
    },
  },

  // ── Legacy: starter rows in DB fall back to free ─────────────────────────
  starter: {
    channels: ['instagram'],
    features: {
      whatsapp: false,
      instagram: true,
      facebook: false,
      instagramComments: false,
      advancedCRM: false,
      dynamicSegments: false,
      abTesting: false,
      aiCopilot: false,
      conversionSequences: false,
      premiumTemplates: false,
      whiteLabel: false,
      agencyReseller: false,
    },
    limits: { messages: 1000, agents: 1, automations: 5, contacts: 1000, conversations: 500 },
  },

  // ── Superadmin: all features, unlimited ────────────────────────────────
  superadmin: {
    channels: ['instagram', 'whatsapp', 'facebook'],
    features: {
      whatsapp: true,
      instagram: true,
      facebook: true,
      instagramComments: true,
      advancedCRM: true,
      dynamicSegments: true,
      abTesting: true,
      aiCopilot: true,
      conversionSequences: true,
      premiumTemplates: true,
      whiteLabel: true,
      agencyReseller: true,
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

// ─── Upgrade messages ─────────────────────────────────────────────────────

export const FEATURE_UPGRADE_MESSAGES: Record<FeatureKey, string> = {
  whatsapp: 'WhatsApp está disponível a partir do plano Standard. Faça upgrade para conectar.',
  instagram: 'Instagram DM está disponível em todos os planos pagos.',
  facebook: 'Facebook Messenger está disponível nos planos Pro e Business.',
  instagramComments: 'Comentários do Instagram estão disponíveis a partir do plano Standard.',
  advancedCRM: 'CRM Avançado (tags, segmentos, lead score) está disponível nos planos Pro e Business.',
  dynamicSegments: 'Segmentos dinâmicos e testes A/B estão disponíveis nos planos Pro e Business.',
  abTesting: 'Testes A/B estão disponíveis nos planos Pro e Business.',
  aiCopilot: 'AI Copilot e Insights estão disponíveis nos planos Pro e Business.',
  conversionSequences: 'Sequências de conversão estão disponíveis a partir do plano Standard.',
  premiumTemplates: 'Templates premium estão disponíveis nos planos Pro e Business.',
  whiteLabel: 'White-label está disponível exclusivamente no plano Business.',
  agencyReseller: 'Painel de agência e revenda estão disponíveis exclusivamente no plano Business.',
};

// ─── Helpers ─────────────────────────────────────────────────────────────

/** The minimum paid plan for a feature (used for upgrade CTA labels). */
export const PLAN_ORDER = ['free', 'standard', 'pro', 'business'];

export const isPaidPlan = (slug: string) => slug !== 'free' && slug !== 'starter';

export const canUpgrade = (currentPlan: string, targetPlan: string): boolean => {
  const ci = PLAN_ORDER.indexOf(currentPlan);
  const ti = PLAN_ORDER.indexOf(targetPlan);
  return ci !== -1 && ti !== -1 && ti > ci;
};
