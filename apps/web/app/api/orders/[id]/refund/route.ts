import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { refundOrder } from '@/src/services/orderService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const order = await refundOrder(id, auth.tenantId, auth.userId);
    return NextResponse.json(order);
  } catch (error: any) {
    const statusCode = error.message.includes('não encontrado') ? 404 : error.message.includes('Transição') ? 422 : 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }
}
