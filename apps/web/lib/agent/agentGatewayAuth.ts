/**
 * Agent Gateway Authentication
 *
 * Agent tool routes (/api/agent/*) can be called by two principals:
 *
 *   1. Authenticated users (dashboard / copilot)
 *      → validated via existing requireAuth() / JWT
 *      → tenantId comes from the JWT payload
 *
 *   2. OpenCrow agent (automated tool calls during a run)
 *      → validated via X-Agent-Secret header
 *      → tenantId comes from X-Agent-Tenant-Id header
 *      → AGENT_GATEWAY_SECRET must match
 *
 * Security rules:
 * - Agent secret NEVER logged or exposed
 * - tenantId from header is used only after secret validation
 * - No write/mutation endpoints are exposed via agent-only auth
 *   (agent routes are read-only context + prepare-* which are read-heavy)
 */

import { requireAuth } from '@/lib/auth/session';

export interface GatewayAuthResult {
  tenantId: string;
  source: 'user' | 'agent';
  userId?: string;
  role?: string;
}

/**
 * Validates the request as either an authenticated user or a trusted agent call.
 * Returns null if authentication fails — callers must return 401.
 */
export async function requireGatewayAuth(req: Request): Promise<GatewayAuthResult | null> {
  // ── 1. Try user JWT first ─────────────────────────────────────────────────
  const userSession = await requireAuth(req);
  if (userSession) {
    return {
      tenantId: userSession.tenantId,
      source: 'user',
      userId: userSession.userId,
      role: userSession.role,
    };
  }

  // ── 2. Try internal agent secret ──────────────────────────────────────────
  const agentSecret = process.env.AGENT_GATEWAY_SECRET;
  if (!agentSecret) {
    // Gateway secret not configured — agent tool calls not supported
    return null;
  }

  const incomingSecret = req.headers.get('x-agent-secret');
  if (!incomingSecret || incomingSecret !== agentSecret) {
    return null;
  }

  const tenantId = req.headers.get('x-agent-tenant-id');
  if (!tenantId?.trim()) {
    return null;
  }

  return {
    tenantId: tenantId.trim(),
    source: 'agent',
  };
}
