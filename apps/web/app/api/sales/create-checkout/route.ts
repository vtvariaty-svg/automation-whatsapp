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

    // Use real Stripe checkout if STRIPE_SECRET_KEY is configured
    let checkout_url: string;

    if (process.env.STRIPE_SECRET_KEY) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' as any });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: (product.currency || 'BRL').toLowerCase(),
            product_data: {
              name: product.name,
              ...(product.description && { description: product.description }),
            },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: 1,
        }],
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/cancel`,
        metadata: { tenantId: auth.tenantId, contactId: contact_id, productId: product_id },
      });

      checkout_url = session.url!;
    } else {
      // Fallback placeholder when Stripe is not configured
      checkout_url = `https://checkout.exemplo.com/${product_id}?c=${contact_id}`;
    }

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
    const conversation = await prisma.conversation.findFirst({
      where: { tenantId: auth.tenantId, customerPhone: contact_id },
      orderBy: { lastMessageAt: 'desc' },
    });

    await createOrder({
      tenantId: auth.tenantId,
      customerPhone: contact_id,
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
