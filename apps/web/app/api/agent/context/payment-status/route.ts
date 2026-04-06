import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireGatewayAuth } from '@/lib/agent/agentGatewayAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireGatewayAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone')?.replace(/\D/g, '') ?? null;
  const contactId = searchParams.get('contactId') ?? null;

  if (!phone && !contactId) {
    return NextResponse.json({ error: 'phone or contactId required' }, { status: 400 });
  }

  try {
    // Resolve contactId if only phone provided
    let resolvedContactId = contactId;
    if (!resolvedContactId && phone) {
      const contact = await prisma.contact.findFirst({
        where: { tenantId: auth.tenantId, normalizedPhone: phone },
        select: { id: true },
      });
      resolvedContactId = contact?.id ?? null;
    }

    if (!resolvedContactId) {
      return NextResponse.json({ recentOrders: [], recentPayments: [] });
    }

    const [orders, payments] = await Promise.all([
      prisma.order.findMany({
        where: { tenantId: auth.tenantId, contactId: resolvedContactId },
        select: { id: true, status: true, price: true, currency: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.payment.findMany({
        where: { tenantId: auth.tenantId, contactId: resolvedContactId },
        select: {
          id: true, status: true, amount: true, provider: true, currency: true, createdAt: true,
          // Never expose providerPaymentId, raw tokens, or webhook secrets
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      recentOrders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        total: o.price,
        currency: o.currency,
        createdAt: o.createdAt.toISOString(),
      })),
      recentPayments: payments.map((p) => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        provider: p.provider,
        currency: p.currency,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
