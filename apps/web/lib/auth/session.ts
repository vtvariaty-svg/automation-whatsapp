/**
 * Canonical server-side authentication helper — SINGLE SOURCE OF TRUTH.
 *
 * All API route handlers must use requireAuth() instead of ad-hoc
 * verifyToken / getAuthUser / getAuthTenant calls.
 *
 * Validation chain (in order):
 *   1. JWT signature verification (jsonwebtoken)
 *   2. Token revocation check (tokenBlacklist)
 *   3. sessionVersion match (invalidates sessions after password change)
 *   4. user.isActive check (blocks accounts deactivated by superadmin)
 *
 * Token extraction priority:
 *   1. Authorization: Bearer <token>  (API calls from client)
 *   2. auth_token cookie              (browser navigation / httpOnly cookie)
 */

import jwt from 'jsonwebtoken';
import { isRevoked } from '@/lib/tokenBlacklist';
import { prisma } from '@/lib/prisma';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required');
const JWT_SECRET = process.env.JWT_SECRET;

export interface SessionPayload {
  userId: string;
  tenantId: string;
  role: string;
}

interface JwtClaims extends SessionPayload {
  sessionVersion?: number;
  exp?: number;
}

/**
 * Fully validates a request's auth token.
 * Returns the verified session payload, or null on any failure.
 * Callers must return 401 when null is returned.
 */
export async function requireAuth(req: Request): Promise<SessionPayload | null> {
  // ── 1. Extract token ──────────────────────────────────────────────────
  let token: string | null = null;

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const m = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }

  if (!token) return null;

  // ── 2. Verify JWT signature ───────────────────────────────────────────
  let decoded: JwtClaims;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as JwtClaims;
  } catch {
    return null;
  }

  // ── 3. Revocation check ───────────────────────────────────────────────
  if (await isRevoked(token)) return null;

  // ── 4. DB: sessionVersion + isActive ─────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { sessionVersion: true, isActive: true },
  });

  if (!dbUser)          return null; // user deleted
  if (!dbUser.isActive) return null; // account deactivated by superadmin

  // JWTs issued before sessionVersion existed carry undefined — treat as 1.
  const tokenVersion = decoded.sessionVersion ?? 1;
  if (dbUser.sessionVersion !== tokenVersion) return null; // session invalidated

  return {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    role: decoded.role ?? 'user',
  };
}
