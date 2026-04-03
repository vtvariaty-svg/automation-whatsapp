'use client'

import { useState } from 'react'
import { pushDataLayerEvent } from '@/lib/marketing/utm'

interface FAQItem {
  q: string
  a: string
}

interface NicheLandingFAQProps {
  items: FAQItem[]
  sectionBadge: string
  sectionBadgeRing: string
  accentText: string
}

export function NicheLandingFAQ({
  items,
  sectionBadge,
  sectionBadgeRing,
  accentText,
}: NicheLandingFAQProps) {
  const [open, setOpen] = useState<number | null>(null)

  const toggle = (i: number) => {
    const next = open === i ? null : i
    setOpen(next)
    if (next !== null) {
      pushDataLayerEvent('faq_open', { faq_index: i, question: items[i].q })
    }
  }

  return (
    <section className="py-16 lg:py-24 bg-[#f8fafc] border-t border-slate-100" data-track="section_view" data-section="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className={`inline-block text-xs font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-5 ${sectionBadge} ${sectionBadgeRing}`}>
            Perguntas frequentes
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
            Dúvidas sobre a plataforma
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
                aria-expanded={open === i}
                data-track="faq_open"
              >
                <span className={`font-semibold text-[#0f172a] text-sm sm:text-base leading-snug group-hover:${accentText} transition-colors`}>
                  {item.q}
                </span>
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border border-slate-200 transition-all duration-200 ${open === i ? `${sectionBadge} rotate-45 border-transparent` : 'bg-slate-50'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  open === i ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-5 text-sm sm:text-base text-slate-500 leading-relaxed font-medium border-t border-slate-100 pt-4">
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
