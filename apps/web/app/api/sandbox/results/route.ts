/**
 * GET /api/sandbox/results?scenario=&limit=20
 * Returns recent sandbox run results for the authenticated tenant.
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get('scenario') ?? undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);

  const runs = await prisma.sandboxRun.findMany({
    where: { tenantId: auth.tenantId, ...(scenario ? { scenario } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(runs);
}

export async function DELETE(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.sandboxRun.deleteMany({ where: { tenantId: auth.tenantId } });
  return NextResponse.json({ ok: true });
}
