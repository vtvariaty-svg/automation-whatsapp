import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/authService';
import { getEntitlements } from '@/lib/services/entitlementsService';

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const entitlements = await getEntitlements(payload.tenantId, payload.role);
  return NextResponse.json(entitlements);
}
