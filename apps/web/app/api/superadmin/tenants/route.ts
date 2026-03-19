import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);

    const { searchParams } = new URL(req.url);
    const search  = searchParams.get('search') || '';
    const plan    = searchParams.get('plan')   || undefined;
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit   = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip    = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { id:   { equals: search } },
      ];
    }
    if (plan) {
      where.subscription = { plan };
    }

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, createdAt: true, operationalStatus: true,
          _count: { select: { users: true } },
          subscription: {
            select: { plan: true, status: true, currentPeriodEnd: true }
          }
        }
      })
    ]);

    return NextResponse.json({ data: tenants, total, page, limit });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/tenants GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
