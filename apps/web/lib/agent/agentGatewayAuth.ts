/**
 * Agent Gateway Authentication
 *
 * Agent tool routes (/api/agent/*) accept three principals:
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
 *   3. Crow MCP server (tool calls originating from Crow's MCP layer)
 *      → validated via Authorization: Bearer <MCP_SERVICE_KEY>
 *      → tenantId comes from X-Tenant-Id header (set by Crow connection config)
 *
 * Security rules:
 * - Secrets NEVER logged or exposed
 * - tenantId from header only accepted after secret validation
 * - No mutation endpoints exposed via agent/mcp-only auth
 */

import { requireAuth } from '@/lib/auth/session';

export interface GatewayAuthResult {
  tenantId: string;
  source: 'user' | 'agent' | 'mcp';
  userId?: string;
  role?: string;
}

/**
 * Validates the request as a trusted user, internal agent, or Crow MCP server.
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

  // ── 2. Try Crow MCP service key (Authorization: Bearer <MCP_SERVICE_KEY>) ─
  const mcpServiceKey = process.env.MCP_SERVICE_KEY;
  if (mcpServiceKey) {
    const authHeader = req.headers.get('authorization') ?? '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (bearerToken && bearerToken === mcpServiceKey) {
      const tenantId = req.headers.get('x-tenant-id')?.trim();
      if (tenantId) {
        return { tenantId, source: 'mcp' };
      }
      // MCP key valid but no tenant — reject to prevent cross-tenant access
      return null;
    }
  }

  // ── 3. Try internal agent secret (X-Agent-Secret) ────────────────────────
  const agentSecret = process.env.AGENT_GATEWAY_SECRET;
  if (!agentSecret) return null;

  const incomingSecret = req.headers.get('x-agent-secret');
  if (!incomingSecret || incomingSecret !== agentSecret) return null;

  const tenantId = req.headers.get('x-agent-tenant-id')?.trim();
  if (!tenantId) return null;

  return { tenantId, source: 'agent' };
}
