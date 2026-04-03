'use client'

import { useState } from 'react'
import { trackFAQOpen } from '@/lib/marketing/tracking'

interface FAQItem {
  q: string
  a: string
}

interface NicheLandingFAQProps {
  items: FAQItem[]
  sectionBadge: string
  sectionBadgeRing: string
  accentText: string
  niche: string
  lpSlug: string
}

export function NicheLandingFAQ({
  items,
  sectionBadge,
  sectionBadgeRing,
  accentText,
  niche,
  lpSlug,
}: NicheLandingFAQProps) {
  const [open, setOpen] = useState<number | null>(null)

  const toggle = (i: number) => {
    const next = open === i ? null : i
    setOpen(next)
    if (next !== null) {
      trackFAQOpen(items[i].q, i, niche, lpSlug)
    }
  }

  return (
    <section
      className="py-16 lg:py-24 bg-[#f8fafc] border-t border-slate-100"
      data-section="faq"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span
            className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${sectionBadge} ${sectionBadgeRing}`}
          >
            Perguntas frequentes
          </span>
          <h2
            id="faq-heading"
            className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight"
          >
            Dúvidas sobre a plataforma
          </h2>
        </div>

        <dl className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <dt>
                <button
                  onClick={() => toggle(i)}
                  className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset`}
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
                  id={`faq-question-${i}`}
                  data-track="faq_item"
                >
                  <span
                    className={`font-semibold text-[#0f172a] text-sm sm:text-base leading-snug transition-colors ${open === i ? accentText : 'group-hover:' + accentText}`}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 ${
                      open === i
                        ? `${sectionBadge} border-transparent rotate-45`
                        : 'bg-slate-50 border-slate-200'
                    }`}
                    aria-hidden="true"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>
              </dt>

              <dd
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  open === i ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-5 text-sm sm:text-base text-slate-500 leading-relaxed font-medium border-t border-slate-100 pt-4">
                  {item.a}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
