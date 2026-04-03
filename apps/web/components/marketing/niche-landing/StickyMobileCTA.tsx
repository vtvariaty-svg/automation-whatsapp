'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { pushDataLayerEvent } from '@/lib/marketing/utm'

interface StickyMobileCTAProps {
  label: string
  href: string
}

export function StickyMobileCTA({ label, href }: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 sm:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 pb-safe">
        <Link
          href={href}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all active:scale-[0.98]"
          data-track="sticky_cta"
          onClick={() => pushDataLayerEvent('cta_click', { track_id: 'sticky_cta', label })}
        >
          {label}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
