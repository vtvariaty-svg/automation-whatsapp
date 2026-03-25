import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight JWT structural check for Edge Runtime.
 *
 * Edge Runtime does not support Node.js crypto APIs needed by jsonwebtoken,
 * so full signature verification is not possible here. This check:
 *   - Validates JWT structure (3 parts)
 *   - Rejects clearly expired tokens (via `exp` claim)
 *   - Rejects tokens missing required claims (userId, tenantId)
 *
 * Full validation (signature + revocation + sessionVersion + isActive) is
 * enforced by every API route handler via requireAuth() in lib/auth/session.ts.
 */
function isTokenStructurallyValid(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    // base64url → base64 → JSON
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padded));

    // Reject expired tokens
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return false;

    // Require core identity claims
    if (!payload.userId || !payload.tenantId) return false;

    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    const tokenCookie = request.cookies.get('auth_token');

    if (!tokenCookie?.value || !isTokenStructurallyValid(tokenCookie.value)) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);

      // Clear the invalid/expired cookie so the browser doesn't keep re-sending it
      if (tokenCookie?.value) {
        response.cookies.set('auth_token', '', {
          path: '/',
          maxAge: 0,
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
