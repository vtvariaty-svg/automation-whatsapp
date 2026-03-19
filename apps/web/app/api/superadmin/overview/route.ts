import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const now = new Date();
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const d7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const d30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalTenants,
      activeUsers24hData,
      activeUsers7dData,
      activeUsers30dData,
      newUsers30d,
      planBreakdown,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.loginEvent.groupBy({ by: ['userId'], where: { createdAt: { gte: d24h } }, _count: true }),
      prisma.loginEvent.groupBy({ by: ['userId'], where: { createdAt: { gte: d7d  } }, _count: true }),
      prisma.loginEvent.groupBy({ by: ['userId'], where: { createdAt: { gte: d30d } }, _count: true }),
      prisma.user.count({ where: { createdAt: { gte: d30d } } }),
      prisma.subscription.groupBy({ by: ['plan'], _count: { plan: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalTenants,
      activeUsers24h: activeUsers24hData.length,
      activeUsers7d: activeUsers7dData.length,
      activeUsers30d: activeUsers30dData.length,
      newUsers30d,
      planBreakdown: planBreakdown.map(p => ({ plan: p.plan, count: p._count.plan })),
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/overview]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
