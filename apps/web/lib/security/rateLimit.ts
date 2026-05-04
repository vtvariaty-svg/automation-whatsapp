/**
 * In-memory rate limiter — temporary anti-abuse mitigation for public POST endpoints.
 *
 * Persists across hot reloads via globalThis, but is reset on cold starts.
 * In a serverless environment (Vercel) each function instance has its own Map —
 * this is NOT a reliable distributed rate limit. Upgrade to Upstash Redis or
 * Vercel KV before high-traffic production use.
 */

interface BucketEntry {
  count: number;
  resetAt: number;
}

declare const globalThis: typeof global & {
  __rateLimitStore?: Map<string, BucketEntry>;
};

function getStore(): Map<string, BucketEntry> {
  if (!globalThis.__rateLimitStore) {
    globalThis.__rateLimitStore = new Map();
  }
  return globalThis.__rateLimitStore;
}

function pruneExpired(store: Map<string, BucketEntry>): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  const cf = headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();

  const xri = headers.get('x-real-ip');
  if (xri) return xri.trim();

  return 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const store = getStore();
  // Opportunistic cleanup to avoid unbounded memory growth
  if (store.size > 5000) pruneExpired(store);

  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= options.limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
