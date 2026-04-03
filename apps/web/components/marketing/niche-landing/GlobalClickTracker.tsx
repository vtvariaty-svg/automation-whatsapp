'use client'

import { useEffect } from 'react'
import { pushMarketingEvent, trackWhatsAppSpecialistClick } from '@/lib/marketing/tracking'

interface GlobalClickTrackerProps {
  niche: string
  lpSlug: string
}

/** Attaches a single delegated click listener to the document.
 *  Intercepts clicks on any element with [data-track] and fires the
 *  appropriate marketing event with a full structured payload.
 *  Renders nothing. */
export function GlobalClickTracker({ niche, lpSlug }: GlobalClickTrackerProps) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-track]') as HTMLElement | null
      if (!el) return

      const trackId = el.dataset.track ?? 'unknown'
      const rawHref =
        (el as HTMLAnchorElement).href ||
        el.dataset.href ||
        el.closest('a')?.href ||
        ''

      // Normalise to relative or absolute href
      let href = rawHref
      try {
        const url = new URL(rawHref)
        // Keep only pathname + search for internal links
        if (url.hostname === window.location.hostname) {
          href = url.pathname + url.search
        }
      } catch { /* not a URL */ }

      const isWhatsApp = href.includes('wa.me') || rawHref.includes('wa.me')
      const isAnchor = href.startsWith('#')
      const isRegister = href.includes('/register')
      const destinationType = isWhatsApp
        ? 'whatsapp'
        : isAnchor
        ? 'anchor'
        : isRegister
        ? 'register'
        : 'internal'

      const label =
        el.dataset.trackLabel ||
        el.getAttribute('aria-label') ||
        el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 60) ||
        ''

      if (isWhatsApp) {
        trackWhatsAppSpecialistClick(niche, lpSlug, trackId)
        return
      }

      pushMarketingEvent('lp_cta_click', {
        niche,
        lpSlug,
        ctaPosition: trackId,
        ctaLabel: label,
        destinationType,
        destinationHref: href,
      })
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [niche, lpSlug])

  return null
}
