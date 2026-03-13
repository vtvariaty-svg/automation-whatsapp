import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, contact_id } = body;

    if (!product_id || !contact_id) {
      return NextResponse.json({ error: 'product_id and contact_id are required' }, { status: 400 });
    }

    // 1. buscar produto na tabela products
    const product = await prisma.product.findUnique({
      where: { id: product_id },
      include: { tenant: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. gerar checkout_url
    const checkout_url = `https://checkout.exemplo.com/${product_id}?c=${contact_id}`;

    // 3. salvar registro em sales_events
    await prisma.salesEvent.create({
      data: {
        tenantId: product.tenantId,
        contactId: contact_id,
        productId: product_id,
        checkoutUrl: checkout_url,
        status: 'created'
      }
    });

    // 4. retornar checkout_url
    return NextResponse.json({ checkout_url });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
