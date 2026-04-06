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
    const contact = contactId
      ? await prisma.contact.findFirst({
          where: { id: contactId, tenantId: auth.tenantId },
          select: {
            id: true, name: true, status: true, tags: true, lastInteractionAt: true,
            createdAt: true, source: true,
            _count: { select: { orders: true, appointments: true } },
          },
        })
      : await prisma.contact.findFirst({
          where: { tenantId: auth.tenantId, normalizedPhone: phone },
          select: {
            id: true, name: true, status: true, tags: true, lastInteractionAt: true,
            createdAt: true, source: true,
            _count: { select: { orders: true, appointments: true } },
          },
        });

    if (!contact) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      contactId: contact.id,
      name: contact.name,
      status: contact.status,
      tags: contact.tags ?? [],
      totalOrders: contact._count.orders,
      totalAppointments: contact._count.appointments,
      lastInteractionAt: contact.lastInteractionAt?.toISOString() ?? null,
      createdAt: contact.createdAt.toISOString(),
      source: contact.source,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
