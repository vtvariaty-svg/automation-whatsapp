import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getSubscription } from '@/lib/services/subscriptionService';
import { planAtLeast } from '@/lib/config/plans';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sub = await getSubscription(auth.tenantId);
  const tenantPlan = sub?.plan ?? 'free';
  if (!planAtLeast(tenantPlan, 'pro')) {
    return NextResponse.json(
      { error: 'Módulo Fiscal disponível a partir do plano Pro.' },
      { status: 403 }
    );
  }

  try {
    const records = await prisma.fiscalEmissionRecord.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(records);
  } catch (err: any) {
    console.error('Erro ao buscar registros fiscais:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
