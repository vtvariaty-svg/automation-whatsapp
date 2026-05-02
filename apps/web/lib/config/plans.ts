// ─── PLAN_V4: 2 vertical public plans + legacy backward compat ────────────
// Public plans: consultorio · restaurante (both with 7-day Stripe trial)
// Legacy (isPublic: false, not shown in new commercial flow): free · pro · business · starter · standard
// STRIPE envs required for production: STRIPE_PRICE_CONSULTORIO · STRIPE_PRICE_RESTAURANTE
// ──────────────────────────────────────────────────────────────────────────────

export interface PlanConfig {
  name: string;
  slug: string;
  price: number; // BRL/month. 0 = free
  limitMessages: number;
  stripePriceId: string;
  hasTrial: boolean; 
  isPublic: boolean;
  isConsultative?: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  // ── Public vertical plans ──────────────────────────────────────────────────
  // [!] PENDING: Confirm final price before launch. R$97 is a provisional placeholder.
  // [!] REQUIRED env for production: STRIPE_PRICE_CONSULTORIO · STRIPE_PRICE_RESTAURANTE
  consultorio: {
    name: 'Plano Consultório',
    slug: 'consultorio',
    price: 97.00, // provisional — confirm before launch
    limitMessages: 10000,
    stripePriceId: process.env.STRIPE_PRICE_CONSULTORIO || 'price_consultorio_placeholder',
    hasTrial: true,
    isPublic: true,
  },
  restaurante: {
    name: 'Plano Restaurante',
    slug: 'restaurante',
    price: 97.00, // provisional — confirm before launch
    limitMessages: 10000,
    stripePriceId: process.env.STRIPE_PRICE_RESTAURANTE || 'price_restaurante_placeholder',
    hasTrial: true,
    isPublic: true,
  },

  // ── Legacy plans (isPublic: false — not shown in new commercial flow) ──────
  free: {
    name: 'Free',
    slug: 'free',
    price: 0,
    limitMessages: 500,
    stripePriceId: '',
    hasTrial: false,
    isPublic: false,
  },
  pro: {
    name: 'Pro',
    slug: 'pro',
    price: 49.90,
    limitMessages: 10000,
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
    hasTrial: false,
    isPublic: false,
  },
  business: {
    name: 'Business',
    slug: 'business',
    price: 197.00,
    limitMessages: -1,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business_placeholder',
    hasTrial: false,
    isPublic: false,
    isConsultative: true,
  },
  standard: {
    name: 'Standard (Legacy)',
    slug: 'standard',
    price: 49.90,
    limitMessages: 3000,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD || 'price_standard_placeholder',
    hasTrial: false,
    isPublic: false,
  },
  starter: {
    name: 'Starter (Legacy)',
    slug: 'starter',
    price: 39.90,
    limitMessages: 1000,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
    hasTrial: false,
    isPublic: false,
  },
};

export const TRIAL_DAYS = 7;

export const getPlan = (slug: string): PlanConfig | undefined => PLANS[slug];

export const getPlanLimit = (slug: string): number => PLANS[slug]?.limitMessages ?? 0;

export const WHATSAPP_BUSINESS_URL = "https://wa.me/5519995993220?text=Ol%C3%A1%2C%20quero%20entender%20o%20plano%20Business%20da%20Variaty.";

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
  | 'agencyReseller'    // Agency panel + reseller features
  | 'advancedAnalytics' // Attribution, funnels, sales metrics
  | 'leadProspectingIntel' // Prospecção IA — Business only
  | 'beautyWorkspace';  // Beauty Workspace vertical (salão, barbearia, estética, manicure)

export type LimitKey = 'messages' | 'agents' | 'automations' | 'contacts' | 'conversations';

export interface PlanEntitlements {
  channels: string[];
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number>; // -1 = unlimited
}

const UNLIMITED = -1;

export const PLAN_ENTITLEMENTS: Record<string, PlanEntitlements> = {
  // ── Consultório (vertical — WhatsApp + IA administrativa) ────────────────
  consultorio: {
    channels: ['whatsapp'],
    features: {
      whatsapp: true,
      instagram: false,
      facebook: false,
      instagramComments: false,
      advancedCRM: true,
      dynamicSegments: false,
      abTesting: false,
      aiCopilot: true,
      conversionSequences: true,
      premiumTemplates: false,
      whiteLabel: false,
      agencyReseller: false,
      advancedAnalytics: false,
      leadProspectingIntel: false,
      beautyWorkspace: false,
    },
    limits: { messages: 10000, agents: 3, automations: 20, contacts: 5000, conversations: UNLIMITED },
  },

  // ── Restaurante (vertical — WhatsApp + IA de atendimento) ────────────────
  restaurante: {
    channels: ['whatsapp'],
    features: {
      whatsapp: true,
      instagram: false,
      facebook: false,
      instagramComments: false,
      advancedCRM: true,
      dynamicSegments: false,
      abTesting: false,
      aiCopilot: true,
      conversionSequences: false,
      premiumTemplates: false,
      whiteLabel: false,
      agencyReseller: false,
      advancedAnalytics: false,
      leadProspectingIntel: false,
      beautyWorkspace: false,
    },
    limits: { messages: 10000, agents: 2, automations: 10, contacts: 5000, conversations: UNLIMITED },
  },

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
      advancedAnalytics: false,
      leadProspectingIntel: false,
      beautyWorkspace: false,
    },
    limits: { messages: 500, agents: 1, automations: 5, contacts: 1000, conversations: 200 },
  },

  // ── Pro (Main Paid Plan) ────────────────────────────────────────────────
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
      advancedAnalytics: true,
      leadProspectingIntel: false,
      beautyWorkspace: true,
    },
    limits: { messages: 10000, agents: 5, automations: UNLIMITED, contacts: 20000, conversations: UNLIMITED },
  },

  // ── Business (Consultative) ─────────────────────────────────────────────
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
      advancedAnalytics: true,
      leadProspectingIntel: true,
      beautyWorkspace: true,
    },
    limits: {
      messages: UNLIMITED,
      agents: UNLIMITED,
      automations: UNLIMITED,
      contacts: UNLIMITED,
      conversations: UNLIMITED,
    },
  },

  // ── Legacy: Standard ────────────────────────────────────────────────────
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
      advancedAnalytics: false,
      leadProspectingIntel: false,
      beautyWorkspace: false,
    },
    limits: { messages: 3000, agents: 2, automations: 15, contacts: 5000, conversations: 5000 },
  },

  // ── Legacy: starter rows in DB fall back to free entitlements ───────────
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
      advancedAnalytics: false,
      leadProspectingIntel: false,
      beautyWorkspace: false,
    },
    limits: { messages: 1000, agents: 1, automations: 5, contacts: 1000, conversations: 500 },
  },

  // ── Superadmin: all features, unlimited ─────────────────────────────────
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
      advancedAnalytics: true,
      leadProspectingIntel: true,
      beautyWorkspace: true,
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
  whatsapp: 'WhatsApp está disponível a partir do plano Pro. Faça upgrade para conectar.',
  instagram: 'Instagram DM está disponível em todos os planos.',
  facebook: 'Facebook Messenger está disponível no plano Pro.',
  instagramComments: 'Comentários do Instagram estão disponíveis a partir do plano Pro.',
  advancedCRM: 'CRM Avançado (tags, segmentos, lead score) está disponível no plano Pro.',
  dynamicSegments: 'Segmentos dinâmicos e testes A/B estão disponíveis no plano Pro.',
  abTesting: 'Testes A/B estão disponíveis no plano Pro.',
  aiCopilot: 'AI Copilot e Insights estão disponíveis no plano Pro.',
  conversionSequences: 'Sequências de conversão estão disponíveis a partir do plano Pro.',
  premiumTemplates: 'Templates premium estão disponíveis no plano Pro.',
  whiteLabel: 'White-label é exclusivo do plano Business (Consultivo).',
  agencyReseller: 'Painel de revenda é exclusivo do plano Business (Consultivo).',
  advancedAnalytics: 'Analytics avançado está disponível a partir do plano Pro.',
  leadProspectingIntel: 'Prospecção IA requer o plano Business (Consultivo).',
  beautyWorkspace: 'Beauty Workspace está disponível a partir do plano Pro. Faça upgrade para acessar a gestão completa para salão, barbearia e estética.',
};

// ─── Helpers ─────────────────────────────────────────────────────────────

/** The minimum paid plan for a feature (used for upgrade CTA labels). */
// Vertical plans (consultorio/restaurante) sit between pro and business so that:
// - planAtLeast(vertical, 'pro') = true  (they inherit pro-level access)
// - planAtLeast(vertical, 'business') = false (business remains the max tier)
// Known ambiguity: consultorio and restaurante are at adjacent positions, so
// canUpgrade/planAtLeast comparisons between them are not semantically meaningful.
// Do not refactor the pricing engine in this phase — document and accept for now.
export const PLAN_ORDER = ['free', 'starter', 'standard', 'pro', 'consultorio', 'restaurante', 'business'];

export const isPaidPlan = (slug: string) => slug !== 'free' && slug !== 'starter';

export const canUpgrade = (currentPlan: string, targetPlan: string): boolean => {
  const ci = PLAN_ORDER.indexOf(currentPlan);
  const ti = PLAN_ORDER.indexOf(targetPlan);
  return ci !== -1 && ti !== -1 && ti > ci;
};

/** Check if a plan is at least a given minimum level. */
export function planAtLeast(current: string | null, min: string): boolean {
  if (current === 'superadmin') return true;
  const ci = PLAN_ORDER.indexOf(current ?? 'free');
  const mi = PLAN_ORDER.indexOf(min);
  return ci >= mi;
}

/** Return the slug of the lowest plan that has a given feature enabled. */
export function getMinPlan(feature: FeatureKey): string {
  for (const slug of PLAN_ORDER) {
    const ent = PLAN_ENTITLEMENTS[slug];
    if (ent?.features[feature]) return slug;
  }
  return 'business';
}
