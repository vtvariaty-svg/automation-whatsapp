import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

// GET /api/contacts/[id]/payments — payment history for a contact
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page  = parseInt(searchParams.get('page')  ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '20');
  const skip  = (page - 1) * limit;

  // Verify contact belongs to this tenant
  const contact = await prisma.contact.findFirst({
    where: { id, tenantId: auth.tenantId },
    select: { id: true },
  });
  if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

  const where = { tenantId: auth.tenantId, contactId: id };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id:                true,
        status:            true,
        sourceType:        true,
        amount:            true,
        currency:          true,
        billingType:       true,
        description:       true,
        invoiceUrl:        true,
        dueDate:           true,
        paidAt:            true,
        createdAt:         true,
        orderId:           true,
        appointmentId:     true,
        conversationId:    true,
        providerPaymentId: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return NextResponse.json({ payments, total, page, limit });
}
