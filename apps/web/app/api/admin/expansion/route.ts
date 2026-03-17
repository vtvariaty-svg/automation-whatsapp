import { NextRequest, NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { PLANS, PLAN_ORDER } from '@/lib/config/plans';

function suggestNextPlan(plan: string): string | null {
  const idx = PLAN_ORDER.indexOf(plan);
  if (idx !== -1 && idx < PLAN_ORDER.length - 1) return PLAN_ORDER[idx + 1];
  // Legacy: starter → standard
  if (plan === 'starter') return 'standard';
  return null;
}

function potentialRevenue(currentPlan: string, suggestedPlan: string): number {
  const current = PLANS[currentPlan]?.price ?? 0;
  const suggested = PLANS[suggestedPlan]?.price ?? 0;
  return Math.max(0, suggested - current);
}

// GET /api/admin/expansion?converted=false
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const convertedParam = url.searchParams.get('converted');
  const filterConverted =
    convertedParam === 'false' ? false : convertedParam === 'true' ? true : false;

  // Find all unconverted expansion events grouped by tenantId
  const events = await prisma.expansionEvent.findMany({
    where: { converted: filterConverted },
    orderBy: { createdAt: 'desc' },
  });

  // Group by tenantId
  const byTenant = new Map<
    string,
    { events: typeof events; topTrigger: string; suggestedPlan: string | null }
  >();

  const TRIGGER_PRIORITY = [
    'limit_hit',
    'premium_blocked',
    'wants_multichannel',
    'high_lead_volume',
    'multi_agent',
  ];

  for (const event of events) {
    if (!byTenant.has(event.tenantId)) {
      byTenant.set(event.tenantId, { events: [], topTrigger: '', suggestedPlan: null });
    }
    byTenant.get(event.tenantId)!.events.push(event);
  }

  // Determine topTrigger and suggestedPlan per tenant
  for (const [, data] of byTenant) {
    let topTrigger = data.events[0]?.trigger ?? '';
    let suggestedPlan: string | null = null;

    for (const t of TRIGGER_PRIORITY) {
      const found = data.events.find((e: any) => e.trigger === t);
      if (found) {
        topTrigger = t;
        suggestedPlan = found.suggestedPlan ?? null;
        break;
      }
    }

    data.topTrigger = topTrigger;
    data.suggestedPlan = suggestedPlan;
  }

  // Load tenant + subscription info for all tenant IDs
  const tenantIds = Array.from(byTenant.keys());

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: {
      id: true,
      name: true,
      subscription: { select: { plan: true } },
    },
  });

  const tenantMap = new Map<string, { name: string; plan: string }>();
  for (const t of tenants) {
    tenantMap.set(t.id, {
      name: t.name,
      plan: t.subscription?.plan ?? 'free',
    });
  }

  // Build result array
  const result = Array.from(byTenant.entries())
    .map(([tenantId, data]) => {
      const tenant = tenantMap.get(tenantId);
      const plan = tenant?.plan ?? 'free';
      const suggested = data.suggestedPlan ?? suggestNextPlan(plan);

      return {
        tenantId,
        tenantName: tenant?.name ?? tenantId,
        plan,
        events: data.events,
        topTrigger: data.topTrigger,
        estimatedUpgrade: suggested ?? plan,
        potentialRevenue: suggested ? potentialRevenue(plan, suggested) : 0,
      };
    })
    // Order by event count desc
    .sort((a, b) => b.events.length - a.events.length)
    .slice(0, 50);

  return NextResponse.json({ opportunities: result });
}
