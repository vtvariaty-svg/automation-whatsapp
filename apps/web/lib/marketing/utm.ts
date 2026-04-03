const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
] as const

const STORAGE_KEY = '__mkv'

export function persistUTMFromURL(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const captured: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const val = params.get(key)
    if (val) captured[key] = val
  }
  if (!Object.keys(captured).length) return
  try {
    const prev = getPersistedUTM()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...captured }))
  } catch {
    // ignore storage errors
  }
}

export function getPersistedUTM(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

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
