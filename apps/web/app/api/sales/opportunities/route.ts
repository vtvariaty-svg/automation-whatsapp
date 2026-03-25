import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';
import { checkFeature } from '@/lib/services/entitlementsService';

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const check = await checkFeature(session.tenantId, 'advancedCRM', session.role);
    if (!check.allowed) return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });

    const opportunities = await prisma.salesOpportunity.findMany({
      where: { tenantId: session.tenantId },
      include: {
        product: { select: { name: true, price: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(opportunities);
  } catch (error: any) {
    console.error('Failure fetching opportunities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
