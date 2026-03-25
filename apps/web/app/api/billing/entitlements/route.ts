import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getEntitlements } from '@/lib/services/entitlementsService';

export async function GET(request: Request) {
  const session = await requireAuth(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entitlements = await getEntitlements(session.tenantId, session.role);
  return NextResponse.json(entitlements);
}
