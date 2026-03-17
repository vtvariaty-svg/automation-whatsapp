import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getOrderWithDetails, updateOrderStatus, normalizeStatus } from '@/src/services/orderService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const order = await getOrderWithDetails(id, auth.tenantId);
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status) {
      return NextResponse.json({ error: 'status é obrigatório' }, { status: 400 });
    }

    const newStatus = normalizeStatus(status);
    const updated = await updateOrderStatus(id, auth.tenantId, newStatus, auth.userId, reason);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar pedido:', error);
    const statusCode = error.message.includes('não encontrado') ? 404 : error.message.includes('Transição inválida') ? 422 : 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }
}
