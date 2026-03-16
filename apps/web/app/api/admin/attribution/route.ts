/**
 * GET /api/admin/attribution?period=7days|30days|all&tenantId= (optional filter)
 * Superadmin only — cross-tenant attribution summary.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { subDays, startOfDay } from 'date-fns';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodStart(period: string): Date | null {
  if (period === '7days') return startOfDay(subDays(new Date(), 7));
  if (period === '30days') return startOfDay(subDays(new Date(), 30));
  return null;
}

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'all';
  const filterTenantId = searchParams.get('tenantId') ?? null;
  const periodStart = getPeriodStart(period);

  // Fetch up to 50 tenants
  const tenants = await prisma.tenant.findMany({
    take: 50,
    where: filterTenantId ? { id: filterTenantId } : undefined,
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
  });

  const tenantIds = tenants.map((t) => t.id);
  const tenantNameMap = new Map(tenants.map((t) => [t.id, t.name]));

  // Fetch all attribution records for these tenants in one query
  const records = await prisma.leadAttribution.findMany({
    where: {
      tenantId: { in: tenantIds },
      ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
    },
    select: {
      tenantId: true,
      converted: true,
      revenueAmount: true,
      lastSource: true,
    },
  });

  // Group by tenantId
  const tenantMap = new Map<
    string,
    { leads: number; converted: number; revenue: number; sourceCount: Map<string, number> }
  >();

  for (const r of records) {
    const existing = tenantMap.get(r.tenantId) ?? {
      leads: 0,
      converted: 0,
      revenue: 0,
      sourceCount: new Map<string, number>(),
    };
    existing.leads += 1;
    if (r.converted) {
      existing.converted += 1;
      existing.revenue += r.revenueAmount ?? 0;
    }
    const src = r.lastSource ?? 'unknown';
    existing.sourceCount.set(src, (existing.sourceCount.get(src) ?? 0) + 1);
    tenantMap.set(r.tenantId, existing);
  }

  const result = tenants.map((tenant) => {
    const data = tenantMap.get(tenant.id);
    if (!data) {
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        totalLeads: 0,
        totalConverted: 0,
        conversionRate: 0,
        totalRevenue: 0,
        topSource: null,
      };
    }

    const topSource =
      data.sourceCount.size > 0
        ? Array.from(data.sourceCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    return {
      tenantId: tenant.id,
      tenantName: tenantNameMap.get(tenant.id) ?? tenant.id,
      totalLeads: data.leads,
      totalConverted: data.converted,
      conversionRate:
        data.leads > 0 ? Math.round((data.converted / data.leads) * 10000) / 100 : 0,
      totalRevenue: data.revenue,
      topSource,
    };
  });

  return NextResponse.json(result);
}
