/**
 * GET /api/crow-token
 * Returns a short-lived signed JWT for the Crow widget identity system.
 * Crow uses this to associate widget conversations with real users.
 * Secret: CROW_VERIFICATION_SECRET (HS256) — must be set in Render env.
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const secret = process.env.CROW_VERIFICATION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CROW_VERIFICATION_SECRET not configured' }, { status: 500 });
  }

  // Fetch user email for identity (best-effort)
  let email: string | null = null;
  let name: string | null = null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, name: true },
    });
    email = user?.email ?? null;
    name = user?.name ?? null;
  } catch { /* best-effort */ }

  const payload = {
    user_id: auth.userId,
    tenant_id: auth.tenantId,
    role: auth.role,
    ...(email ? { email } : {}),
    ...(name ? { name } : {}),
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };

  const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
  return NextResponse.json({ token });
}
