import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { customerPhone, customerName, product, price } = body;

    if (!customerPhone) {
      return NextResponse.json({ error: 'customerPhone é obrigatório' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        tenantId: auth.tenantId,
        customerPhone,
        customerName,
        product,
        price: price ? parseFloat(price) : 0,
        status: 'novo'
      }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
