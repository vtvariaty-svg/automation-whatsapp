export type NicheTheme = 'clinicas' | 'beleza'

export interface NicheContent {
  theme: NicheTheme
  hero: {
    badge: string
    headline: string
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
  // Problem section
  problemIconBg: string
  problemIconText: string
  // Step connector
  stepConnector: string
  // Benefit card hover
  benefitHoverBorder: string
}

export const themeColors: Record<NicheTheme, ThemeColors> = {
  clinicas: {
    heroBadgeBg: 'bg-teal-500/10',
    heroBadgeBorder: 'border border-teal-400/20',
    heroBadgeText: 'text-teal-300',
    heroGlow: 'rgba(20,184,166,0.08)',
    gradientFrom: '#34d399', // emerald-400
    gradientTo: '#60a5fa',   // blue-400
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
    gradientFrom: '#fb7185', // rose-400
    gradientTo: '#fbbf24',   // amber-400
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
