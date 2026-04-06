/**
 * OpenCrow Client — server-side only.
 *
 * Sends the agent assist request to OpenCrow and returns raw JSON output.
 * This module does NOT validate the response — that's the validator's job.
 *
 * Environment variables:
 *   OPENCROW_BASE_URL      — e.g. https://api.opencrow.ai
 *   OPENCROW_API_KEY       — secret API key for OpenCrow
 *   OPENCROW_PROJECT_ID    — identifies our agent project in OpenCrow
 *   OPENCROW_TIMEOUT_MS    — hard timeout (default: 2800ms)
 *   AGENT_GATEWAY_BASE_URL — public base URL of this app (for tool callbacks)
 *   AGENT_GATEWAY_SECRET   — secret OpenCrow uses when calling our agent tools
 *
 * Security:
 * - Secrets are NEVER logged
 * - NEVER exposed to client
 * - AbortController enforces hard timeout
 */

import type { AgentInput } from './agentDecisionSchema';

const DEFAULT_TIMEOUT_MS = 2800;

export interface OpenCrowRawResponse {
  /** The decision object returned by OpenCrow — must be validated before use. */
  decision: unknown;
  /** Internal metadata from OpenCrow (run id, latency, etc.). */
  meta?: Record<string, unknown>;
}

/**
 * Checks that required environment variables are present.
 * Returns an error string if missing, null if OK.
 */
export function checkOpenCrowConfig(): string | null {
  const missing: string[] = [];
  if (!process.env.OPENCROW_BASE_URL) missing.push('OPENCROW_BASE_URL');
  if (!process.env.OPENCROW_API_KEY) missing.push('OPENCROW_API_KEY');
  if (!process.env.OPENCROW_PROJECT_ID) missing.push('OPENCROW_PROJECT_ID');
  if (!process.env.AGENT_GATEWAY_BASE_URL) missing.push('AGENT_GATEWAY_BASE_URL');
  if (!process.env.AGENT_GATEWAY_SECRET) missing.push('AGENT_GATEWAY_SECRET');
  return missing.length ? `Missing env vars: ${missing.join(', ')}` : null;
}

/**
 * Calls OpenCrow with the structured agent input.
 * Throws on network failure, timeout, or non-2xx response.
 * Returns raw (unvalidated) JSON.
 */
export async function callOpenCrow(input: AgentInput): Promise<OpenCrowRawResponse> {
  const baseUrl = process.env.OPENCROW_BASE_URL!;
  const apiKey = process.env.OPENCROW_API_KEY!;
  const projectId = process.env.OPENCROW_PROJECT_ID!;
  const gatewayBase = process.env.AGENT_GATEWAY_BASE_URL!;
  const gatewaySecret = process.env.AGENT_GATEWAY_SECRET!;
  const timeoutMs = Number(process.env.OPENCROW_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const payload = {
    project_id: projectId,
    input: {
      tenant_id: input.tenantId,
      channel: input.channel,
      customer_message: input.customerMessage,
      contact_id: input.contactId ?? null,
      tenant_context: input.tenantContext,
    },
    // Tool endpoints — OpenCrow calls these during decision
    tools_config: {
      base_url: gatewayBase,
      secret_header: 'x-agent-secret',
      secret_value: gatewaySecret,
      tenant_id: input.tenantId,
      spec_url: `${gatewayBase}/api/agent/openapi`,
    },
    // We request a structured JSON response matching our AgentDecision schema
    response_format: {
      type: 'agent_decision',
      schema: {
        required: ['decisionType', 'confidence'],
        properties: {
          decisionType: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          replyText: { type: 'string' },
          productId: { type: 'string' },
          serviceId: { type: 'string' },
          serviceName: { type: 'string' },
          explanation: { type: 'string' },
          toolTrace: { type: 'array', items: { type: 'string' } },
          flags: { type: 'object' },
        },
      },
    },
  };

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/v1/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-OpenCrow-Version': '2024-01',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown error');
    throw new Error(`OpenCrow API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();

  // Normalize: OpenCrow may return the decision at top-level or nested under 'decision'
  const decision = json?.decision ?? json?.output?.decision ?? json;

  return {
    decision,
    meta: json?.meta ?? json?.metadata ?? undefined,
  };
}
