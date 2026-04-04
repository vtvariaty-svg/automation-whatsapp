export type NicheTheme = 'clinicas' | 'beleza'

// ─── A/B Variant Types ────────────────────────────────────────────────────────

/** Active variant key. 'A' = control. Change to 'B' or 'C' to switch. */
export type VariantKey = 'A' | 'B' | 'C'

/** Text blocks that can be A/B tested per niche. */
export interface ContentVariants {
  hero: {
    headline: Record<VariantKey, string>
    subheadline: Record<VariantKey, string>
    primaryCTA: Record<VariantKey, string>
  }
  finalCTA: {
    headline: Record<VariantKey, string>
    subheadline: Record<VariantKey, string>
  }
}

export interface NicheContent {
  theme: NicheTheme
  /** URL slug used to build niche-aware hrefs, e.g. 'clinicas-consultorios' */
  slug: string
  /** Pre-filled WhatsApp specialist message, niche-specific */
  specialistWAText: string
  /** Cross-niche rescue link shown at the bottom of the LP */
  crossNiche: {
    text: string
    href: string
    ctaLabel: string
    targetNiche: string
  }
  /** Three credibility chips in the trust bar below the hero */
  credibilityAnchors: [string, string, string]

  hero: {
    badge: string
    headline: string
    /** Word index at which the gradient span ends (exclusive).
     *  First `headlineBreak` words get the gradient treatment. */
    headlineBreak: number
    subheadline: string
    primaryCTA: string
    secondaryCTA: string
    microcopy: string
    trustBullets: string[]
  }
  problem: {
    title: string
    bullets: string[]
  }
  solution: {
    title: string
    description: string
    /** Before/after contrast block rendered below the description */
    contrast?: { before: string; after: string }
  }
  /** Specific operational scenario cards — rendered between Solution and How It Works */
  scenarios?: {
    title: string
    items: Array<{
      label: string
      headline: string
      description: string
      outcome: string
    }>
  }
  howItWorks: {
    title: string
    steps: Array<{ title: string; description: string }>
  }
  benefits: {
    title: string
    items: Array<{ title: string; description: string }>
  }
  proof: {
    title: string
    focusPoints: string[]
  }
  objections: {
    title: string
    items: Array<{ q: string; a: string }>
  }
  faq: {
    items: Array<{ q: string; a: string }>
  }
  finalCTA: {
    headline: string
    subheadline: string
    primaryCTA: string
    secondaryCTA: string
  }
  stickyMobileCTA: string
}

export interface ThemeColors {
  // Hero
  heroBadgeBg: string
  heroBadgeBorder: string
  heroBadgeText: string
  heroGlow: string
  gradientFrom: string
  gradientTo: string
  // Sections
  sectionBadge: string
  sectionBadgeRing: string
  accentText: string
  bulletDot: string
  // Problem / icon colors
  problemIconBg: string
  problemIconText: string
  // Step connector line
  stepConnector: string
  // Benefit card hover border
  benefitHoverBorder: string
}

export const themeColors: Record<NicheTheme, ThemeColors> = {
  clinicas: {
    heroBadgeBg: 'bg-teal-500/10',
    heroBadgeBorder: 'border border-teal-400/20',
    heroBadgeText: 'text-teal-300',
    heroGlow: 'rgba(20,184,166,0.08)',
    gradientFrom: '#34d399',
    gradientTo: '#60a5fa',
    sectionBadge: 'bg-blue-50 text-blue-700',
    sectionBadgeRing: 'ring-1 ring-blue-100',
    accentText: 'text-blue-600',
    bulletDot: 'bg-teal-500',
    problemIconBg: 'bg-blue-50',
    problemIconText: 'text-blue-600',
    stepConnector: 'from-blue-100 via-teal-200 to-teal-100',
    benefitHoverBorder: 'hover:border-blue-200',
  },
  beleza: {
    heroBadgeBg: 'bg-rose-500/10',
    heroBadgeBorder: 'border border-rose-400/20',
    heroBadgeText: 'text-rose-300',
    heroGlow: 'rgba(244,63,94,0.07)',
    gradientFrom: '#fb7185',
    gradientTo: '#fbbf24',
    sectionBadge: 'bg-rose-50 text-rose-700',
    sectionBadgeRing: 'ring-1 ring-rose-100',
    accentText: 'text-rose-500',
    bulletDot: 'bg-rose-500',
    problemIconBg: 'bg-rose-50',
    problemIconText: 'text-rose-500',
    stepConnector: 'from-rose-100 via-amber-200 to-amber-100',
    benefitHoverBorder: 'hover:border-rose-200',
  },
}
