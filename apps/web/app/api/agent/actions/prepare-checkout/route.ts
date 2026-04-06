/**
 * POST /api/agent/actions/prepare-checkout
 *
 * Validates that a checkout CAN be initiated for a product.
 * Returns parameters — does NOT execute the checkout.
 * Actual execution happens in the webhook handler via conversationalCheckoutService.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { productId, customerPhone, contactId } = body ?? {};

  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
  if (!customerPhone) return NextResponse.json({ error: 'customerPhone required' }, { status: 400 });

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: auth.tenantId, active: true },
      select: { id: true, name: true, price: true, currency: true, requiresHumanApproval: true, externalSalesUrl: true, salesMode: true, serviceId: true },
    });

    if (!product) {
      return NextResponse.json({ ready: false, blockedReason: 'Product not found or inactive' });
    }

    if ((product as any).requiresHumanApproval) {
      return NextResponse.json({
        ready: false,
        productId: product.id,
        productName: product.name,
        blockedReason: 'requires_human_approval',
      });
    }

    if (product.serviceId) {
      return NextResponse.json({
        ready: false,
        productId: product.id,
        productName: product.name,
        blockedReason: 'product_is_service_use_schedule',
      });
    }

    // Check contact exists (required for order trail)
    const contact = contactId
      ? await prisma.contact.findFirst({ where: { id: contactId, tenantId: auth.tenantId }, select: { id: true } })
      : await prisma.contact.findFirst({ where: { tenantId: auth.tenantId, normalizedPhone: customerPhone.replace(/\D/g, '') }, select: { id: true } });

    return NextResponse.json({
      ready: true,
      productId: product.id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
      requiresContact: !contact,
      blockedReason: null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
