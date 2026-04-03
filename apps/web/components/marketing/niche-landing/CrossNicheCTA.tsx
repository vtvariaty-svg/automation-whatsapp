'use client'

import Link from 'next/link'
import { trackCrossNicheClick } from '@/lib/marketing/tracking'

interface CrossNicheCTAProps {
  sourceNiche: string
  targetNiche: string
  targetHref: string
  text: string
  ctaLabel: string
}

/** Subtle wrong-fit escape hatch linking to the other niche LP.
 *  Placed after the objections section. Low visual dominance. */
export function CrossNicheCTA({
  sourceNiche,
  targetNiche,
  targetHref,
  text,
  ctaLabel,
}: CrossNicheCTAProps) {
  return (
    <section
      className="py-6 bg-slate-50 border-t border-slate-100"
      data-section="cross_niche"
      aria-label="Outro segmento"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500 font-medium text-center sm:text-left flex-1 leading-relaxed">
            {text}
          </p>
          <Link
            href={targetHref}
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
            data-track="cross_niche_cta"
            onClick={() => trackCrossNicheClick(sourceNiche, targetNiche, targetHref)}
          >
            {ctaLabel}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
