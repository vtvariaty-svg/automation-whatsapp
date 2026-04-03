import { getPersistedAttribution, pushDataLayerEvent } from './utm'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DestinationType = 'internal' | 'whatsapp' | 'anchor' | 'register'

export interface TrackingContext {
  niche: string
  lpSlug: string
  ctaPosition: string
  ctaLabel: string
  destinationType: DestinationType
  destinationHref: string
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export function pushMarketingEvent(
  eventName: string,
  ctx: TrackingContext,
  extra?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  const a = getPersistedAttribution()
  pushDataLayerEvent(eventName, {
    page_type: 'niche_lp',
    niche: ctx.niche,
    lp_slug: ctx.lpSlug,
    cta_position: ctx.ctaPosition,
    cta_label: ctx.ctaLabel,
    destination_type: ctx.destinationType,
    destination_href: ctx.destinationHref,
    pathname: window.location.pathname,
    utm_source: a.utm_source ?? null,
    utm_medium: a.utm_medium ?? null,
    utm_campaign: a.utm_campaign ?? null,
    utm_content: a.utm_content ?? null,
    utm_term: a.utm_term ?? null,
    gclid: a.gclid ?? null,
    fbclid: a.fbclid ?? null,
    ...extra,
  })
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

export function trackCTAClick(ctx: TrackingContext): void {
  pushMarketingEvent('lp_cta_click', ctx)
}

export function trackSectionView(
  sectionId: string,
  niche: string,
  lpSlug: string
): void {
  if (typeof window === 'undefined') return
  const a = getPersistedAttribution()
  pushDataLayerEvent('lp_section_view', {
    page_type: 'niche_lp',
    section_id: sectionId,
    niche,
    lp_slug: lpSlug,
    pathname: window.location.pathname,
    utm_source: a.utm_source ?? null,
    utm_medium: a.utm_medium ?? null,
    utm_campaign: a.utm_campaign ?? null,
  })
}

export function trackFAQOpen(
  questionText: string,
  faqIndex: number,
  niche: string,
  lpSlug: string
): void {
  if (typeof window === 'undefined') return
  const a = getPersistedAttribution()
  pushDataLayerEvent('lp_faq_open', {
    page_type: 'niche_lp',
    question: questionText,
    faq_index: faqIndex,
    niche,
    lp_slug: lpSlug,
    pathname: window.location.pathname,
    utm_source: a.utm_source ?? null,
    utm_campaign: a.utm_campaign ?? null,
  })
}

export function trackCrossNicheClick(
  sourceNiche: string,
  targetNiche: string,
  targetHref: string
): void {
  if (typeof window === 'undefined') return
  const a = getPersistedAttribution()
  pushDataLayerEvent('lp_cross_niche_click', {
    page_type: 'niche_lp',
    source_niche: sourceNiche,
    target_niche: targetNiche,
    destination_href: targetHref,
    pathname: window.location.pathname,
    utm_source: a.utm_source ?? null,
    utm_campaign: a.utm_campaign ?? null,
  })
}

export function trackWhatsAppSpecialistClick(
  niche: string,
  lpSlug: string,
  position: string
): void {
  if (typeof window === 'undefined') return
  const a = getPersistedAttribution()
  pushDataLayerEvent('lp_whatsapp_specialist_click', {
    page_type: 'niche_lp',
    niche,
    lp_slug: lpSlug,
    cta_position: position,
    pathname: window.location.pathname,
    utm_source: a.utm_source ?? null,
    utm_campaign: a.utm_campaign ?? null,
  })
}

/** Track a click on the demo bridge (from /whatsapp page or demo page). */
export function trackDemoBridgeClick(
  position: string,
  destinationHref: string
): void {
  if (typeof window === 'undefined') return
  const a = getPersistedAttribution()
  pushDataLayerEvent('lp_demo_bridge_click', {
    page_type: 'bridge',
    cta_position: position,
    destination_href: destinationHref,
    pathname: window.location.pathname,
    utm_source: a.utm_source ?? null,
    utm_campaign: a.utm_campaign ?? null,
  })
}
