/**
 * Agent Assist Service — primary orchestration entry point.
 *
 * Called from the WhatsApp webhook and the SupportCopilot backend.
 * Coordinates: context building → OpenCrow call → validation → decision return.
 *
 * Resilience contract:
 * 1. If OpenCrow is misconfigured (missing env vars) → immediate fallback, no delay
 * 2. If circuit breaker is open → immediate fallback, no delay
 * 3. If OpenCrow times out → fallback, circuit breaker records failure
 * 4. If response is invalid → fallback, circuit breaker records failure
 * 5. If response is valid 'fallback_to_legacy' → clean fallback, no circuit trip
 *
 * Callers must handle null return as "use legacy path".
 */

import type { AgentDecision, AgentInput } from './agentDecisionSchema';
import { buildAgentContext } from './agentContextBuilder';
import { callOpenCrow, checkOpenCrowConfig } from './openCrowClient';
import { validateAgentDecision } from './agentDecisionValidator';
import { agentCircuitBreaker } from './agentCircuitBreaker';
import { agentTelemetry } from './agentTelemetry';

export interface AgentAssistInput {
  tenantId: string;
  from: string;             // customer phone
  textBody: string;         // inbound message
  contactId?: string;
  channel?: string;
}

export interface AgentAssistResult {
  decision: AgentDecision;
  durationMs: number;
}

/**
 * Runs the OpenCrow agent assist.
 * Returns null if OpenCrow is unavailable/invalid — caller must fall back to legacy.
 */
export async function runAgentAssist(
  input: AgentAssistInput
): Promise<AgentAssistResult | null> {
  const channel = input.channel ?? 'whatsapp';
  const start = Date.now();

  // ── 1. Config guard (no delay) ────────────────────────────────────────────
  const configErr = checkOpenCrowConfig();
  if (configErr) {
    // Not logged as error — expected during local dev without OpenCrow configured
    return null;
  }

  // ── 2. Circuit breaker guard ──────────────────────────────────────────────
  if (!agentCircuitBreaker.isCallAllowed()) {
    agentTelemetry.circuitBreakerOpen(input.tenantId);
    return null;
  }

  agentTelemetry.callStarted(input.tenantId, channel);

  // ── 3. Build compact context (best-effort) ────────────────────────────────
  let tenantContext;
  try {
    tenantContext = await buildAgentContext(input.tenantId, input.from, input.contactId);
  } catch (ctxErr) {
    // Context building failed — fallback gracefully
    agentTelemetry.fallbackTriggered(input.tenantId, channel, 'context_build_failed');
    agentCircuitBreaker.onFailure();
    return null;
  }

  // ── 4. Call OpenCrow ──────────────────────────────────────────────────────
  const agentInput: AgentInput = {
    tenantId: input.tenantId,
    channel,
    customerPhone: input.from,
    customerMessage: input.textBody,
    contactId: input.contactId,
    tenantContext,
  };

  let rawResponse;
  try {
    rawResponse = await callOpenCrow(agentInput);
  } catch (callErr: any) {
    const durationMs = Date.now() - start;
    const isTimeout = callErr?.name === 'AbortError' || callErr?.message?.includes('abort');

    if (isTimeout) {
      agentTelemetry.callTimedOut(input.tenantId, channel, durationMs);
    } else {
      agentTelemetry.callFailed(input.tenantId, channel, callErr?.message ?? 'unknown', durationMs);
    }
    agentCircuitBreaker.onFailure();
    return null;
  }

  // ── 5. Validate response ──────────────────────────────────────────────────
  const validation = validateAgentDecision(rawResponse.decision);

  if (!validation.valid) {
    agentTelemetry.validationFailed(input.tenantId, validation.errors);
    agentCircuitBreaker.onFailure();
    return null;
  }

  if (validation.errors.length > 0) {
    // Validation passed but had non-fatal warnings
    agentTelemetry.validationFailed(input.tenantId, validation.errors);
  }

  const durationMs = Date.now() - start;
  const decision = validation.decision!;

  // ── 6. Record outcome ─────────────────────────────────────────────────────
  if (decision.decisionType === 'fallback_to_legacy') {
    // Clean fallback requested by agent — don't trip circuit breaker
    agentTelemetry.fallbackTriggered(input.tenantId, channel, 'agent_requested_fallback');
    agentCircuitBreaker.onSuccess();
    return { decision, durationMs };
  }

  agentCircuitBreaker.onSuccess();
  agentTelemetry.callSucceeded(
    input.tenantId,
    channel,
    decision.decisionType,
    decision.confidence,
    durationMs,
    decision.toolTrace
  );

  return { decision, durationMs };
}

/**
 * Support Copilot variant — returns a text answer for dashboard use.
 * Uses the same agent layer but expects a 'reply' decision with replyText.
 */
export async function runAgentCopilotAssist(input: {
  tenantId: string;
  userId: string;
  role: string;
  question: string;
  route?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<{ answer: string; confidence: string; usedAgent: boolean } | null> {
  const start = Date.now();

  const configErr = checkOpenCrowConfig();
  if (configErr) return null;

  if (!agentCircuitBreaker.isCallAllowed()) {
    agentTelemetry.circuitBreakerOpen(input.tenantId);
    return null;
  }

  let tenantContext;
  try {
    tenantContext = await buildAgentContext(input.tenantId, '', undefined);
    // Augment with copilot-specific context
    (tenantContext as any).dashboardRoute = input.route;
    (tenantContext as any).userRole = input.role;
    if (input.history?.length) {
      (tenantContext as any).conversationHistory = input.history.slice(-4);
    }
  } catch {
    return null;
  }

  const agentInput: AgentInput = {
    tenantId: input.tenantId,
    channel: 'dashboard_copilot',
    customerPhone: '',
    customerMessage: input.question,
    tenantContext,
  };

  let rawResponse;
  try {
    rawResponse = await callOpenCrow(agentInput);
  } catch {
    agentCircuitBreaker.onFailure();
    return null;
  }

  const validation = validateAgentDecision(rawResponse.decision);
  if (!validation.valid) {
    agentCircuitBreaker.onFailure();
    return null;
  }

  agentCircuitBreaker.onSuccess();
  const decision = validation.decision!;

  if (!decision.replyText) return null;

  return {
    answer: decision.replyText,
    confidence: decision.confidence,
    usedAgent: true,
  };
}
