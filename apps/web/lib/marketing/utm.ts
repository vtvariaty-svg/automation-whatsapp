// ─── Attribution field keys ────────────────────────────────────────────────
const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
] as const

const CONTEXT_KEYS = ['niche', 'lp_slug', 'origin_path'] as const

const STORAGE_KEY = '__mkv'
const PHONE = '5519995993220'

export type UTMKey = (typeof UTM_KEYS)[number]
export type ContextKey = (typeof CONTEXT_KEYS)[number]
export type AttributionData = Partial<Record<UTMKey | ContextKey | string, string>>

// ─── Persist ────────────────────────────────────────────────────────────────

/** Read UTM + context keys from current URL and persist to localStorage.
 *  Pass `extras` to also store niche/lp_slug that are known server-side. */
export function persistAttribution(extras?: AttributionData): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const captured: AttributionData = {}

  for (const key of [...UTM_KEYS, ...CONTEXT_KEYS]) {
    const val = params.get(key)
    if (val) captured[key] = val
  }

  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v) captured[k] = v
    }
  }

  if (!Object.keys(captured).length) return
  try {
    const prev = getPersistedAttribution()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...captured }))
  } catch {
    // ignore storage errors
  }
}

/** Backward-compatible alias. */
export function persistUTMFromURL(): void {
  persistAttribution()
}

// ─── Read ────────────────────────────────────────────────────────────────────

export function getPersistedAttribution(): AttributionData {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Backward-compatible alias. */
export function getPersistedUTM(): Record<string, string> {
  return getPersistedAttribution() as Record<string, string>
}

// ─── Merge ────────────────────────────────────────────────────────────────────

/** Merge stored attribution with current URL params and optional overrides.
 *  Current URL params win over stored; overrides win over both. */
export function mergeAttribution(override?: AttributionData): AttributionData {
  const stored = getPersistedAttribution()
  const current: AttributionData = {}

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    for (const key of [...UTM_KEYS, ...CONTEXT_KEYS]) {
      const val = params.get(key)
      if (val) current[key] = val
    }
  }

  return { ...stored, ...current, ...override }
}

// ─── Href builders ───────────────────────────────────────────────────────────

/** Build a niche-aware demo href. Safe for server-side use. */
export function buildNicheDemoHref(niche: string, lpSlug: string): string {
  return `/demo?niche=${encodeURIComponent(niche)}&lp=${encodeURIComponent(lpSlug)}`
}

/** Build an internal href carrying stored + current attribution params + extras.
 *  On SSR (no window) only appends the static `extra` params. */
export function buildInternalHrefWithAttribution(
  base: string,
  extra?: AttributionData
): string {
  if (typeof window === 'undefined') {
    if (!extra || !Object.keys(extra).length) return base
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v)
    }
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }
  const merged = mergeAttribution(extra)
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

/** Build a WhatsApp href with a pre-filled niche-specific message. */
export function buildWhatsAppHrefWithContext(message: string): string {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`
}

// ─── GTM ─────────────────────────────────────────────────────────────────────

export function pushDataLayerEvent(
  event: string,
  data?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  try {
    const w = window as typeof window & { dataLayer?: unknown[] }
    if (!Array.isArray(w.dataLayer)) return
    w.dataLayer.push({ event, ...data })
  } catch {
    // ignore
  }
}
