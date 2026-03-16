/**
 * GET /api/admin/go-live?status=all|setup|ready|live|paused|blocked
 * Superadmin only — list GoLiveStatus for all tenants.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { computeGoLiveStatus } from '@/lib/goLive';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') ?? 'all';

  const where =
    statusFilter && statusFilter !== 'all'
      ? { operationalStatus: statusFilter }
      : {};

  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true },
  });

  const statuses = await Promise.all(
    tenants.map((t) => computeGoLiveStatus(t.id)),
  );

  return NextResponse.json(statuses);
}
