/**
 * getAuthTenant — thin wrapper over requireAuth.
 *
 * Kept for backward compatibility with routes that already import it.
 * All validation logic lives in lib/auth/session.ts (requireAuth).
 *
 * Previously this function checked JWT signature + revocation only.
 * It now also validates sessionVersion and user.isActive via requireAuth.
 */

import { cookies } from 'next/headers';
import { requireAuth, SessionPayload } from '@/lib/auth/session';

export type AuthResult = SessionPayload;

export async function getAuthTenant(request?: Request): Promise<AuthResult | null> {
  if (request) return requireAuth(request);

  // Fallback: no Request object available (called from server component context).
  // Read the cookie via Next.js cookies() and construct a synthetic request.
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const syntheticReq = new Request('http://localhost', {
      headers: { cookie: `auth_token=${encodeURIComponent(token)}` },
    });
    return requireAuth(syntheticReq);
  } catch {
    return null;
  }
}
