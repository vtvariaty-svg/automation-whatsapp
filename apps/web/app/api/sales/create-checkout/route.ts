import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function POST(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { product_id, contact_id } = body;

    if (!product_id || !contact_id) {
      return NextResponse.json({ error: 'product_id and contact_id are required' }, { status: 400 });
    }

    // Verify product belongs to tenant
    const product = await prisma.product.findFirst({
      where: { id: product_id, tenantId: auth.tenantId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delegate URL generation to checkoutService (Stripe → Asaas → placeholder)
    const { generateCheckoutUrl } = await import('@/lib/services/checkoutService');
    const { checkoutUrl: checkout_url } = await generateCheckoutUrl(auth.tenantId, product_id, contact_id);

    // Save sales event
    await prisma.salesEvent.create({
      data: {
        tenantId: auth.tenantId,
        contactId: contact_id,
        productId: product_id,
        checkoutUrl: checkout_url,
        status: 'created',
      },
    });

    // Update opportunity to checkout_enviado
    const openOpp = await prisma.salesOpportunity.findFirst({
      where: { tenantId: auth.tenantId, contactId: contact_id, status: { in: ['novo_lead', 'interessado'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (openOpp) {
      await prisma.salesOpportunity.update({
        where: { id: openOpp.id },
        data: { status: 'checkout_enviado', productId: product.id, value: product.price },
      });
    }

    // Create draft order linked to checkout
    const { createOrder } = await import('@/src/services/orderService');

    // Resolve real phone and conversation — contact_id is a UUID, never a phone number
    const checkoutContact = await prisma.contact.findFirst({
      where: { id: contact_id, tenantId: auth.tenantId },
      select: { phone: true, name: true },
    });
    const conversation = await prisma.conversation.findFirst({
      where: { tenantId: auth.tenantId, customerPhone: checkoutContact?.phone ?? '' },
      orderBy: { lastMessageAt: 'desc' },
    });

    await createOrder({
      tenantId: auth.tenantId,
      customerPhone: checkoutContact?.phone ?? '',
      customerName: checkoutContact?.name ?? undefined,
      contactId: contact_id,
      conversationId: conversation?.id,
      origin: 'checkout',
      status: 'pending_payment',
      items: [{ productId: product.id, name: product.name, quantity: 1, unitPrice: product.price }],
    }, auth.userId);

    return NextResponse.json({ checkout_url });
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
