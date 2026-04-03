'use client'

import { useEffect } from 'react'
import { trackSectionView } from '@/lib/marketing/tracking'

interface SectionViewTrackerProps {
  niche: string
  lpSlug: string
}

/** Observes all elements with [data-section] and fires lp_section_view events
 *  once per section per page view via IntersectionObserver. Renders nothing. */
export function SectionViewTracker({ niche, lpSlug }: SectionViewTrackerProps) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const seen = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const sectionId = (entry.target as HTMLElement).dataset.section
          if (!sectionId || seen.has(sectionId)) continue
          seen.add(sectionId)
          trackSectionView(sectionId, niche, lpSlug)
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
    )

    const sections = document.querySelectorAll('[data-section]')
    sections.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [niche, lpSlug])

  return null
}
