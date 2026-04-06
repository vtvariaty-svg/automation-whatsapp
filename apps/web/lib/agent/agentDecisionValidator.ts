/**
 * Agent Decision Validator
 *
 * Validates every response from OpenCrow before it reaches any business logic.
 * Invalid output from the agent MUST NEVER propagate into core business actions.
 *
 * Uses manual validation (no new npm dependencies required).
 */

import {
  AGENT_DECISION_TYPES,
  type AgentDecision,
  type AgentDecisionType,
  type AgentConfidence,
} from './agentDecisionSchema';

const VALID_CONFIDENCE: AgentConfidence[] = ['high', 'medium', 'low'];

export interface ValidationResult {
  valid: boolean;
  decision?: AgentDecision;
  errors: string[];
}

/**
 * Validates raw OpenCrow output and returns a typed, safe AgentDecision.
 * Any field that doesn't conform is either rejected or stripped.
 * Returns valid=false with errors if the core contract is violated.
 */
export function validateAgentDecision(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Response is not an object'] };
  }

  const obj = raw as Record<string, unknown>;

  // ── decisionType ──────────────────────────────────────────────────────────
  const decisionType = obj['decisionType'];
  if (typeof decisionType !== 'string') {
    return { valid: false, errors: ['decisionType is required and must be a string'] };
  }
  if (!AGENT_DECISION_TYPES.includes(decisionType as AgentDecisionType)) {
    return {
      valid: false,
      errors: [`decisionType "${decisionType}" is not a known type. Valid: ${AGENT_DECISION_TYPES.join(', ')}`],
    };
  }

  // ── confidence ────────────────────────────────────────────────────────────
  const confidence = obj['confidence'];
  if (typeof confidence !== 'string' || !VALID_CONFIDENCE.includes(confidence as AgentConfidence)) {
    errors.push(`confidence "${confidence}" is invalid — defaulting to 'low'`);
  }

  // ── replyText (required for reply, clarify) ───────────────────────────────
  const dt = decisionType as AgentDecisionType;
  if ((dt === 'reply' || dt === 'clarify') && (!obj['replyText'] || typeof obj['replyText'] !== 'string')) {
    return { valid: false, errors: [`decisionType "${dt}" requires replyText`] };
  }

  // ── productId (required for prepare_checkout) ─────────────────────────────
  if (dt === 'prepare_checkout' && (!obj['productId'] || typeof obj['productId'] !== 'string')) {
    errors.push('prepare_checkout without productId — will attempt catalog fallback');
  }

  // ── Unsafe action block: agent must never claim to have executed provider calls ──
  const explanation = typeof obj['explanation'] === 'string' ? obj['explanation'] : undefined;
  if (explanation) {
    const unsafePatterns = [
      /charged?\s+the\s+customer/i,
      /payment\s+(was\s+)?processed/i,
      /stripe\s+called/i,
      /asaas\s+called/i,
      /sent\s+to\s+meta\s+api/i,
    ];
    for (const pattern of unsafePatterns) {
      if (pattern.test(explanation)) {
        errors.push(`Unsafe claim in explanation blocked: ${explanation.slice(0, 80)}`);
      }
    }
  }

  // ── Build safe decision object ────────────────────────────────────────────
  const safeReplyText = typeof obj['replyText'] === 'string' ? obj['replyText'].slice(0, 4000) : undefined;
  const safeProductId = typeof obj['productId'] === 'string' ? obj['productId'] : undefined;
  const safeServiceId = typeof obj['serviceId'] === 'string' ? obj['serviceId'] : undefined;
  const safeServiceName = typeof obj['serviceName'] === 'string' ? obj['serviceName'] : undefined;
  const safeToolTrace = Array.isArray(obj['toolTrace'])
    ? (obj['toolTrace'] as unknown[]).filter((t) => typeof t === 'string').slice(0, 20) as string[]
    : undefined;

  const flags = obj['flags'];
  const safeFlags = flags && typeof flags === 'object' && !Array.isArray(flags)
    ? {
        requiresHumanConfirmation: !!(flags as Record<string, unknown>)['requiresHumanConfirmation'],
        unsafeActionBlocked: errors.length > 0,
        fallbackTriggered: !!(flags as Record<string, unknown>)['fallbackTriggered'],
        timeoutTriggered: !!(flags as Record<string, unknown>)['timeoutTriggered'],
      }
    : { unsafeActionBlocked: errors.length > 0 };

  const decision: AgentDecision = {
    decisionType: dt,
    confidence: VALID_CONFIDENCE.includes(confidence as AgentConfidence)
      ? (confidence as AgentConfidence)
      : 'low',
    replyText: safeReplyText,
    productId: safeProductId,
    serviceId: safeServiceId,
    serviceName: safeServiceName,
    explanation: explanation?.slice(0, 500),
    toolTrace: safeToolTrace,
    flags: safeFlags,
  };

  return { valid: true, decision, errors };
}
