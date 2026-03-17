import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { createOrder, listOrders } from '@/src/services/orderService';
import { getSubscription } from '@/lib/services/subscriptionService';
import { planAtLeast } from '@/lib/config/plans';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      origin: searchParams.get('origin') || undefined,
      contactId: searchParams.get('contactId') || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
    };

    const orders = await listOrders(auth.tenantId, filters);
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Plan gate: orders require Standard+
  const sub = await getSubscription(auth.tenantId);
  const tenantPlan = sub?.plan || 'free';
  if (!planAtLeast(tenantPlan, 'standard')) {
    return NextResponse.json(
      { error: 'Pedidos disponíveis a partir do plano Standard. Faça upgrade para continuar.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    if (!body.customerPhone) {
      return NextResponse.json({ error: 'customerPhone é obrigatório' }, { status: 400 });
    }

    const order = await createOrder(
      {
        tenantId: auth.tenantId,
        customerPhone: body.customerPhone,
        customerName: body.customerName,
        contactId: body.contactId,
        conversationId: body.conversationId,
        origin: body.origin ?? 'manual',
        currency: body.currency,
        notes: body.notes,
        status: body.status,
        items: body.items,
        // Legacy compat
        product: body.product,
        price: body.price ? parseFloat(body.price) : undefined,
      },
      auth.userId
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
