/**
 * Agent Decision Contract — shared by OpenCrow client, validator, and webhook executor.
 *
 * OpenCrow returns a JSON object that must match AgentDecision.
 * The webhook executor maps each decisionType to an existing backend service call.
 *
 * Design invariants:
 * - decisionType drives execution; all other fields are optional enrichment
 * - 'fallback_to_legacy' instructs the webhook to use the existing I+K path
 * - No decision directly calls providers — it only prepares the parameters
 *   for execution by the existing deterministic backend services
 */

export const AGENT_DECISION_TYPES = [
  'reply',           // Send replyText to customer (pure language/clarification)
  'clarify',         // Ask customer for clarification (replyText required)
  'send_catalog',    // Present product catalog (deterministic catalog build)
  'send_offer',      // Present single product offer (productId required)
  'prepare_checkout',// Initiate checkout flow (productId required, executes via conversationalCheckoutService)
  'schedule_service',// Route to appointment booking flow (serviceId or serviceName)
  'handoff_human',   // Escalate to human agent (executeHandoff)
  'diagnostic',      // Internal explanation only — no outbound message (debug/telemetry)
  'fallback_to_legacy', // Signal: OpenCrow yielded, use existing I+K path
] as const;

export type AgentDecisionType = (typeof AGENT_DECISION_TYPES)[number];

export type AgentConfidence = 'high' | 'medium' | 'low';

export interface AgentDecisionFlags {
  requiresHumanConfirmation?: boolean;
  unsafeActionBlocked?: boolean;
  fallbackTriggered?: boolean;
  timeoutTriggered?: boolean;
}

export interface AgentDecision {
  decisionType: AgentDecisionType;
  confidence: AgentConfidence;
  /** Ready-to-send customer reply text (required for reply/clarify/send_offer/send_catalog). */
  replyText?: string;
  /** Matched product id — used with send_offer and prepare_checkout. */
  productId?: string;
  /** Service id for schedule_service. */
  serviceId?: string;
  /** Human-readable service name fallback when serviceId unavailable. */
  serviceName?: string;
  /** Pre-existing order id (context enrichment only). */
  orderId?: string;
  /** Pre-existing payment id (context enrichment only). */
  paymentId?: string;
  /** Human-readable explanation of the decision (for telemetry/debug). */
  explanation?: string;
  /** Names of tools OpenCrow called during this decision. */
  toolTrace?: string[];
  flags?: AgentDecisionFlags;
}

/** Compact input we send to OpenCrow with the customer message. */
export interface AgentInput {
  tenantId: string;
  channel: string;
  customerPhone: string;
  customerMessage: string;
  contactId?: string;
  tenantContext: AgentTenantContext;
}

export interface AgentTenantContext {
  businessType?: string | null;
  plan: string;
  channels: string[];
  setupCompleted: boolean;
  businessHours?: string | null;
  aiPrompt?: string | null;
  /** Recent conversation messages (last 6, newest first). */
  recentMessages?: Array<{ role: 'customer' | 'assistant'; text: string }>;
  /** Top-level contact info if resolved. */
  contact?: {
    id: string;
    name?: string | null;
    status?: string | null;
    tags?: string[];
  } | null;
  /** Catalog summary (top 12 products). */
  catalog?: Array<{
    id: string;
    name: string;
    price: number;
    category?: string | null;
    isService?: boolean;
  }>;
  /** Current commercial state (if any active flow). */
  commercialState?: Record<string, unknown> | null;
}
