import { NextResponse } from 'next/server';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';
import { getEntitlements } from '@/lib/services/entitlementsService';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [sub, ent] = await Promise.all([
      prisma.subscription.findUnique({
        where: { tenantId: auth.tenantId },
        select: { plan: true, status: true, trialEnd: true },
      }),
      getEntitlements(auth.tenantId, auth.role),
    ]);

    const trialDaysLeft = sub?.trialEnd
      ? Math.max(0, Math.ceil((sub.trialEnd.getTime() - Date.now()) / 86400000))
      : null;

    return NextResponse.json({
      plan: sub?.plan ?? 'free',
      status: sub?.status ?? 'unknown',
      trialDaysLeft,
      features: ent.features,
      limits: ent.limits,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
