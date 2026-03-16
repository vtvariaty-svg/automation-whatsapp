/**
 * L4 – In-memory circuit breaker per tenant:channel.
 *
 * OPEN  = too many recent failures → calls rejected immediately.
 * CLOSED = normal operation.
 *
 * Trips at FAILURE_THRESHOLD errors within WINDOW_MS.
 * Auto-resets after RESET_MS (half-open not implemented — keep it simple).
 *
 * Also exposes isKillSwitched() which reads Tenant.channelKillSwitch for
 * manual, operator-controlled channel pauses (persisted in DB).
 */

const FAILURE_THRESHOLD = 5;
const WINDOW_MS = 5 * 60 * 1000;  // 5 minutes
const RESET_MS  = 10 * 60 * 1000; // 10 minutes

interface BreakerState {
  failures: number;
  windowStart: number;
  openSince: number | null;
}

const breakers = new Map<string, BreakerState>();

function key(tenantId: string, channel: string): string {
  return `${tenantId}:${channel}`;
}

function getState(k: string): BreakerState {
  let s = breakers.get(k);
  if (!s) {
    s = { failures: 0, windowStart: Date.now(), openSince: null };
    breakers.set(k, s);
  }
  return s;
}

/** Returns true if the circuit is OPEN (calls should be rejected). */
export function isCircuitOpen(tenantId: string, channel: string): boolean {
  const s = getState(key(tenantId, channel));
  if (s.openSince === null) return false;
  if (Date.now() - s.openSince > RESET_MS) {
    // Auto-reset
    s.openSince = null;
    s.failures = 0;
    s.windowStart = Date.now();
    return false;
  }
  return true;
}

/** Record a send failure — may trip the breaker. */
export function recordFailure(tenantId: string, channel: string): void {
  const s = getState(key(tenantId, channel));
  const now = Date.now();
  if (now - s.windowStart > WINDOW_MS) {
    s.failures = 0;
    s.windowStart = now;
  }
  s.failures += 1;
  if (s.failures >= FAILURE_THRESHOLD && s.openSince === null) {
    s.openSince = now;
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        channel,
        tenantId,
        msg: `[CircuitBreaker] OPEN — ${s.failures} failures in ${WINDOW_MS / 1000}s`,
      }),
    );
  }
}

/** Record a send success — resets the failure counter. */
export function recordSuccess(tenantId: string, channel: string): void {
  const s = getState(key(tenantId, channel));
  s.failures = 0;
  s.openSince = null;
  s.windowStart = Date.now();
}

/**
 * Check Tenant.channelKillSwitch (comma-separated channel names).
 * Pass the raw tenant object — reads .channelKillSwitch field.
 */
export function isKillSwitched(tenant: { channelKillSwitch?: string | null }, channel: string): boolean {
  if (!tenant.channelKillSwitch) return false;
  return tenant.channelKillSwitch.split(',').map((c) => c.trim()).includes(channel);
}

/** Snapshot of all circuit states — for the admin API. */
export function getCircuitSnapshot(): Record<string, { open: boolean; failures: number; openSince: string | null }> {
  const out: Record<string, { open: boolean; failures: number; openSince: string | null }> = {};
  for (const [k, s] of breakers.entries()) {
    out[k] = {
      open: s.openSince !== null && Date.now() - s.openSince <= RESET_MS,
      failures: s.failures,
      openSince: s.openSince ? new Date(s.openSince).toISOString() : null,
    };
  }
  return out;
}
