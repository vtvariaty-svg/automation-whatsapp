import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { cancelOrder } from '@/src/services/orderService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const order = await cancelOrder(id, auth.tenantId, auth.userId, body.reason);
    return NextResponse.json(order);
  } catch (error: any) {
    const statusCode = error.message.includes('não encontrado') ? 404 : error.message.includes('Transição') ? 422 : 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }
}
