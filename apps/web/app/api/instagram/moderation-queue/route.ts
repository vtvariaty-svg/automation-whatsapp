import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const items = await prisma.instagramModerationItem.findMany({
    where: { tenantId: auth.tenantId, status },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(items);
}

export async function PATCH(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  const valid = ['pending', 'replied', 'hidden', 'dismissed'];
  if (!valid.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  await prisma.instagramModerationItem.updateMany({ where: { id, tenantId: auth.tenantId }, data: { status } });
  return NextResponse.json({ success: true });
}
