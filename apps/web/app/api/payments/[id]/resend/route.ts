import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

// POST /api/payments/[id]/resend — return the invoice URL for resending to the customer
// Does NOT create a new charge; just returns the existing invoiceUrl.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payment = await prisma.payment.findFirst({
    where: { id: params.id, tenantId: auth.tenantId },
    select: { id: true, status: true, invoiceUrl: true, pixCopiaECola: true },
  });

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

  if (!payment.invoiceUrl && !payment.pixCopiaECola) {
    return NextResponse.json(
      { error: 'Nenhum link de pagamento disponível para este registro.' },
      { status: 422 }
    );
  }

  return NextResponse.json({
    invoiceUrl:    payment.invoiceUrl,
    pixCopiaECola: payment.pixCopiaECola,
    status:        payment.status,
  });
}
