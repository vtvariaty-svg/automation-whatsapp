// Food Order [id] API (admin-only)
// GET   /api/restaurant/orders/[id]  → get order with items and addons
// PATCH /api/restaurant/orders/[id]  → update status

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

const VALID_STATUS = [
  'NEW', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELED',
];

export async function GET(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const order = await prisma.foodOrder.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        items: {
          include: {
            addons: true,
          },
        },
        restaurantProfile: { select: { id: true, displayName: true, slug: true } },
      },
    });
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('[restaurant/orders/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const order = await prisma.foodOrder.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'status é obrigatório.' }, { status: 400 });
    }
    if (!VALID_STATUS.includes(String(status))) {
      return NextResponse.json(
        { error: `status inválido. Valores aceitos: ${VALID_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    // Admin only updates status — no payment, no financial changes
    const updated = await prisma.foodOrder.update({
      where: { id },
      data: { status: String(status) },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[restaurant/orders/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
