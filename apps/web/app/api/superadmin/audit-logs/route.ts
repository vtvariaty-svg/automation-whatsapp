import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const { searchParams } = new URL(req.url);
    const action  = searchParams.get('action') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const targetId = searchParams.get('targetId') || undefined;
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit   = Math.min(100, parseInt(searchParams.get('limit') || '50'));
    const skip    = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (actorId) where.actorUserId = actorId;
    if (targetId) {
      where.OR = [
        { targetUserId: targetId },
        { targetTenantId: targetId },
        { entityId: targetId }
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.superAdminLog.count({ where }),
      prisma.superAdminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
    ]);

    return NextResponse.json({ data: logs, total, page, limit });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/audit-logs GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
