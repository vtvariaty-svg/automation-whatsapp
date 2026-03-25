import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { revokeToken } from '@/lib/tokenBlacklist';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  // Extract token from Bearer header first, fall back to auth_token cookie.
  // This handles both: (a) explicit Bearer logout from client, and (b) cases
  // where the client's localStorage was cleared but the httpOnly cookie remains.
  let token: string | null = null;

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const m = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { exp?: number };
      const expiresAt = decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // fallback: +24h
      await revokeToken(token, expiresAt);
    } catch {
      // Invalid or already-expired token — no need to revoke, still proceed.
    }
  }

  const response = NextResponse.json({ ok: true });

  // Clear cookie with the same attributes used on login so the browser removes it.
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
