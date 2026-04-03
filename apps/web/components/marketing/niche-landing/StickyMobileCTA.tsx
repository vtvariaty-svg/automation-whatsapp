'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { pushMarketingEvent } from '@/lib/marketing/tracking'

interface StickyMobileCTAProps {
  label: string
  href: string
  niche: string
  lpSlug: string
}

/** Fixed bottom CTA strip visible only on mobile (hidden sm:hidden).
 *  Appears after 320px of scroll. Does not jitter — uses a single
 *  passive scroll listener with minimal state transitions. */
export function StickyMobileCTA({ label, href, niche, lpSlug }: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const threshold = 320
    const onScroll = () => {
      setVisible(window.scrollY > threshold)
    }
    // Check immediately in case the page loads already scrolled
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden transition-transform duration-300 will-change-transform ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      {/* Safe-area aware padding */}
      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))]">
        <Link
          href={href}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm py-3.5 rounded-xl transition-colors active:scale-[0.98]"
          data-track="sticky_cta"
          onClick={() =>
            pushMarketingEvent('lp_cta_click', {
              niche,
              lpSlug,
              ctaPosition: 'sticky_cta',
              ctaLabel: label,
              destinationType: 'internal',
              destinationHref: href,
            })
          }
        >
          {label}
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
