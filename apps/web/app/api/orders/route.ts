import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, customerPhone, customerName, product, price } = body;

    if (!tenantId || !customerPhone) {
      return NextResponse.json({ error: 'tenantId e customerPhone são obrigatórios' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        tenantId,
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
