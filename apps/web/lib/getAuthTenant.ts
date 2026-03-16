import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { isRevoked } from '@/lib/tokenBlacklist';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthResult {
  tenantId: string;
  userId: string;
}

/**
 * Extracts tenantId from auth cookie OR Bearer header.
 * Works for both cookie-based (middleware) and header-based (client API calls) auth.
 */
export async function getAuthTenant(request?: Request): Promise<AuthResult | null> {
  let token: string | null = null;

  // Try 1: Bearer header (from client-side API calls)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  // Try 2: Cookie (from server-side or middleware)
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value || null;
    } catch {
      // cookies() may fail outside request context
    }
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; tenantId: string; role?: string };
    if (await isRevoked(token)) return null;
    return { tenantId: decoded.tenantId, userId: decoded.userId };
  } catch {
    return null;
  }
}
