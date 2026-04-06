/**
 * Agent Telemetry — best-effort structured logging for the OpenCrow integration.
 *
 * Design rules:
 * - NEVER block the main flow (all logs are best-effort)
 * - NEVER log secrets, tokens, provider credentials, or raw customer PII
 * - NEVER throw — wrap in try/catch at every entry point
 * - Structured JSON for log aggregation (Render, Datadog, etc.)
 */

type TelemetryLevel = 'info' | 'warn' | 'error';

interface AgentTelemetryEvent {
  level: TelemetryLevel;
  event: string;
  tenantId?: string;
  channel?: string;
  decisionType?: string;
  confidence?: string;
  durationMs?: number;
  fallback?: boolean;
  circuitBreaker?: string;
  validationErrors?: string[];
  toolTrace?: string[];
  error?: string;
}

function emit(evt: AgentTelemetryEvent): void {
  try {
    const prefix = `[Agent][${evt.event}]`;
    const structured = JSON.stringify({
      ...evt,
      ts: new Date().toISOString(),
    });
    if (evt.level === 'error') {
      console.error(prefix, structured);
    } else if (evt.level === 'warn') {
      console.warn(prefix, structured);
    } else {
      console.log(prefix, structured);
    }
  } catch {
    // Telemetry must never throw
  }
}

export const agentTelemetry = {
  callStarted(tenantId: string, channel: string): void {
    emit({ level: 'info', event: 'call_started', tenantId, channel });
  },

  callSucceeded(
    tenantId: string,
    channel: string,
    decisionType: string,
    confidence: string,
    durationMs: number,
    toolTrace?: string[]
  ): void {
    emit({ level: 'info', event: 'call_succeeded', tenantId, channel, decisionType, confidence, durationMs, toolTrace });
  },

  callFailed(tenantId: string, channel: string, error: string, durationMs: number): void {
    emit({ level: 'error', event: 'call_failed', tenantId, channel, error, durationMs });
  },

  callTimedOut(tenantId: string, channel: string, timeoutMs: number): void {
    emit({ level: 'warn', event: 'call_timeout', tenantId, channel, durationMs: timeoutMs });
  },

  validationFailed(tenantId: string, errors: string[]): void {
    emit({ level: 'warn', event: 'validation_failed', tenantId, validationErrors: errors });
  },

  fallbackTriggered(tenantId: string, channel: string, reason: string): void {
    emit({ level: 'warn', event: 'fallback_triggered', tenantId, channel, fallback: true, error: reason });
  },

  circuitBreakerOpen(tenantId: string): void {
    emit({ level: 'warn', event: 'circuit_breaker_open', tenantId, circuitBreaker: 'open', fallback: true });
  },

  decisionExecuted(tenantId: string, decisionType: string): void {
    emit({ level: 'info', event: 'decision_executed', tenantId, decisionType });
  },
};
