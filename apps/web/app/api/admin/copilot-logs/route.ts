import { NextRequest, NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') ?? '7', 10);
  const onlyFallback = searchParams.get('fallback') === 'true';
  const since = startOfDay(subDays(new Date(), days));

  const where = {
    createdAt: { gte: since },
    ...(onlyFallback ? { fallbackNeeded: true } : {}),
  };

  const [logs, total, fallbackCount, byRoute, byPlan] = await Promise.all([
    prisma.supportCopilotLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, tenantId: true, question: true, answer: true,
        route: true, plan: true, role: true, confidence: true,
        fallbackNeeded: true, source: true, helpful: true, createdAt: true,
      },
    }),
    prisma.supportCopilotLog.count({ where: { createdAt: { gte: since } } }),
    prisma.supportCopilotLog.count({ where: { createdAt: { gte: since }, fallbackNeeded: true } }),
    prisma.supportCopilotLog.groupBy({
      by: ['route'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.supportCopilotLog.groupBy({
      by: ['plan'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  const resolutionRate = total > 0 ? Math.round(((total - fallbackCount) / total) * 100) : 0;

  return NextResponse.json({
    stats: {
      total,
      fallbackCount,
      resolutionRate,
      faqHits: logs.filter((l) => l.source === 'faq').length,
    },
    byRoute: byRoute.map((r) => ({ route: r.route ?? '(unknown)', count: r._count.id })),
    byPlan: byPlan.map((p) => ({ plan: p.plan ?? 'unknown', count: p._count.id })),
    logs,
  });
}
