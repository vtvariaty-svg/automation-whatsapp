'use client'

import { useEffect } from 'react'
import { persistAttribution } from '@/lib/marketing/utm'

interface UTMPersistProps {
  niche?: string
  lpSlug?: string
}

/** Persists UTM params + niche context to localStorage on mount.
 *  Renders nothing. Should be placed early in the component tree. */
export function UTMPersist({ niche, lpSlug }: UTMPersistProps = {}) {
  useEffect(() => {
    persistAttribution({
      ...(niche ? { niche } : {}),
      ...(lpSlug ? { lp_slug: lpSlug } : {}),
      origin_path: window.location.pathname,
    })
  }, [niche, lpSlug])

  return null
}
