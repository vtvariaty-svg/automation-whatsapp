import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getPayment } from '@/src/services/paymentService';

// GET /api/payments/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const payment = await getPayment(auth.tenantId, id);
    if (!payment) return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
    return NextResponse.json(payment);
  } catch (err: any) {
    console.error('[GET /api/payments/[id]]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
