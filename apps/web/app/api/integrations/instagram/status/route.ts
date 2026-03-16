import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const conn = await prisma.instagramConnection.findUnique({ where: { tenantId: auth.tenantId } });
  return NextResponse.json({
    connected: !!(conn?.status === 'connected'),
    pageId: conn?.pageId || null,
    igAccountId: conn?.igAccountId || null,
    username: conn?.username || null,
  });
}
