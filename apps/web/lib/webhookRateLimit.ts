/**
 * Rate limiter in-memory para o webhook do WhatsApp.
 * Usa sliding window por IP. Adequado para instância única no Render.
 * Para múltiplas instâncias no futuro: substituir pelo Upstash Redis.
 */

const WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS = 30;   // máx 30 requisições por IP por minuto

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Limpar entradas expiradas periodicamente para não vazar memória
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
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
