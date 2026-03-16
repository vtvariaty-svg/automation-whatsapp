/**
 * GET  /api/admin/churn          – list all churn signals grouped by tenant
 * POST /api/admin/churn/scan     – run detection for all tenants
 *
 * Superadmin only.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { runChurnDetectionForAll } from '@/lib/churnDetection';

const SEVERITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

function maxSeverity(signals: { severity: string }[]): string {
  return signals.reduce(
    (best, s) =>
      (SEVERITY_ORDER[s.severity] ?? 0) > (SEVERITY_ORDER[best] ?? 0)
        ? s.severity
        : best,
    'low',
  );
}

// ─── GET /api/admin/churn ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const resolvedParam = searchParams.get('resolved');
  const severityParam = searchParams.get('severity') ?? 'all';

  // Default: show unresolved signals
  const resolvedFilter =
    resolvedParam === 'true' ? true : resolvedParam === 'false' ? false : false;

  const where: Record<string, unknown> = { resolved: resolvedFilter };
  if (severityParam !== 'all') {
    where.severity = severityParam;
  }

  const signals = await prisma.churnSignal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  if (signals.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch tenant names in one query
  const tenantIds = [...new Set(signals.map((s) => s.tenantId))];
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  // Group by tenantId
  const grouped = new Map<
    string,
    { tenantId: string; tenantName: string; signals: typeof signals }
  >();

  for (const signal of signals) {
    if (!grouped.has(signal.tenantId)) {
      grouped.set(signal.tenantId, {
        tenantId: signal.tenantId,
        tenantName: tenantMap.get(signal.tenantId) ?? signal.tenantId,
        signals: [],
      });
    }
    grouped.get(signal.tenantId)!.signals.push(signal);
  }

  // Sort groups: highest severity first
  const result = [...grouped.values()].sort((a, b) => {
    const aMax = SEVERITY_ORDER[maxSeverity(a.signals)] ?? 0;
    const bMax = SEVERITY_ORDER[maxSeverity(b.signals)] ?? 0;
    return bMax - aMax;
  });

  return NextResponse.json(result);
}
