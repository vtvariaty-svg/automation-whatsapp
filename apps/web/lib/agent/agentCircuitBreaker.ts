/**
 * Agent Circuit Breaker — in-memory, module-level state.
 *
 * States:
 *   closed   — normal operation (default)
 *   open     — OpenCrow failing; reject calls immediately, fallback to legacy
 *   half-open — one probe call allowed after cooldown
 *
 * Thresholds (tunable via env vars or hardcoded defaults):
 *   AGENT_CB_FAILURE_THRESHOLD  — consecutive failures before opening (default: 3)
 *   AGENT_CB_COOLDOWN_MS        — cooldown before half-open probe (default: 30000ms)
 *
 * Usage:
 *   if (!agentCircuitBreaker.isCallAllowed()) return fallback
 *   try { ... agentCall ... agentCircuitBreaker.onSuccess() }
 *   catch { agentCircuitBreaker.onFailure() }
 */

type BreakerState = 'closed' | 'open' | 'half-open';

class AgentCircuitBreaker {
  private state: BreakerState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold: number;
  private readonly cooldownMs: number;

  constructor() {
    this.threshold = Number(process.env.AGENT_CB_FAILURE_THRESHOLD ?? 3);
    this.cooldownMs = Number(process.env.AGENT_CB_COOLDOWN_MS ?? 30_000);
  }

  isCallAllowed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'half-open';
        return true; // Allow one probe attempt
      }
      return false; // Still in cooldown
    }
    // half-open: one probe already allowed, don't allow concurrent probes
    return true;
  }

  onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  onFailure(): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Probe failed — reopen the circuit
      this.state = 'open';
      return;
    }

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  getState(): BreakerState {
    // Re-check if cooldown has expired
    if (this.state === 'open' && Date.now() - this.lastFailureTime >= this.cooldownMs) {
      this.state = 'half-open';
    }
    return this.state;
  }

  /** For telemetry/logging. */
  snapshot(): { state: BreakerState; failureCount: number; lastFailureMs: number } {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      lastFailureMs: this.lastFailureTime ? Date.now() - this.lastFailureTime : 0,
    };
  }
}

// Singleton — shared across all webhook invocations in this process.
export const agentCircuitBreaker = new AgentCircuitBreaker();
