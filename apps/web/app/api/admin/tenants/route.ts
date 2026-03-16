/**
 * GET /api/admin/tenants
 * Superadmin only — list all tenants with basic info for dropdowns / dashboards.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      isDemo: true,
      createdAt: true,
      subscription: {
        select: { plan: true, status: true },
      },
    },
  });

  return NextResponse.json(tenants);
}
