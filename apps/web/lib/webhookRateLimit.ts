/**
 * Rate limiter in-memory para webhooks.
 * Usa sliding window por IP ou por tenant:canal.
 * Adequado para instância única no Render.
 * Para múltiplas instâncias no futuro: substituir pelo Upstash Redis.
 */

const WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS = 30;   // máx 30 requisições por IP por minuto

// L4 – tenant-level limits (more granular than IP)
const TENANT_WINDOW_MS = 60_000;
const TENANT_MAX_REQUESTS = 60; // 60 msgs/min per tenant:channel

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const tenantStore = new Map<string, Entry>(); // L4

// Limpar entradas expiradas periodicamente para não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
  for (const [key, entry] of tenantStore.entries()) {
    if (now > entry.resetAt) tenantStore.delete(key);
  }
}, WINDOW_MS);

/**
 * Retorna true se a requisição deve ser bloqueada (limite excedido).
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) return true;

  return false;
}

/**
 * Extrai o IP real da requisição, considerando proxy reverso do Render.
 */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as any).get?.('x-forwarded-for') ?? '';
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

/**
 * L4 – Rate limit per tenant:channel (60 req/min).
 * More precise than IP-based limiting for multi-tenant workloads.
 */
export function isRateLimitedByTenant(tenantId: string, channel: string): boolean {
  const k = `${tenantId}:${channel}`;
  const now = Date.now();
  const entry = tenantStore.get(k);

  if (!entry || now > entry.resetAt) {
    tenantStore.set(k, { count: 1, resetAt: now + TENANT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > TENANT_MAX_REQUESTS;
}
