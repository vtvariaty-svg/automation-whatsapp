import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getSubscription } from '@/lib/services/subscriptionService';
import { planAtLeast } from '@/lib/config/plans';
import { getExternalNfeStatusByReference } from '@/lib/integrations/fiscal/nfeClient';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
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

  if (process.env.NFE_EXTERNAL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Integração fiscal não habilitada.' }, { status: 503 });
  }

  try {
    const { ref } = await params;
    const status = await getExternalNfeStatusByReference(ref, auth.tenantId);
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? 'Erro ao consultar status' },
      { status: err.statusCode ?? 500 }
    );
  }
}
