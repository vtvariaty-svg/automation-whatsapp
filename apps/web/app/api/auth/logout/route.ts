import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { revokeToken } from '@/lib/tokenBlacklist';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { exp?: number };
      const expiresAt = decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // fallback: +24h
      await revokeToken(token, expiresAt);
    } catch {
      // Token inválido ou expirado — não precisa revogar, mas prosseguir com o logout
    }
  }

  const response = NextResponse.json({ ok: true });
  // Limpar cookie server-side (cobre fluxo de login social)
  response.cookies.set('auth_token', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
}
