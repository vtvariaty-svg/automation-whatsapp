'use client'

import { useEffect } from 'react'
import { persistUTMFromURL } from '@/lib/marketing/utm'

export function UTMPersist() {
  useEffect(() => {
    persistUTMFromURL()
  }, [])

  return null
}
