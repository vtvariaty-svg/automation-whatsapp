/**
 * getAuthUser — thin wrapper over requireAuth.
 *
 * Kept for backward compatibility with routes that already import it.
 * All validation logic lives in lib/auth/session.ts (requireAuth).
 */

import { requireAuth, SessionPayload } from '@/lib/auth/session';

export type AuthUser = SessionPayload;

export const getAuthUser = (req: Request): Promise<AuthUser | null> => requireAuth(req);
