import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { createPaymentLink, listPayments } from '@/src/services/paymentService';

// GET /api/payments — list payments for the authenticated tenant
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const filters = {
    status:         searchParams.get('status')         || undefined,
    conversationId: searchParams.get('conversationId') || undefined,
    contactId:      searchParams.get('contactId')      || undefined,
    dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
    dateTo:   searchParams.get('dateTo')   ? new Date(searchParams.get('dateTo')!)   : undefined,
    page:     searchParams.get('page')     ? parseInt(searchParams.get('page')!)     : 1,
    limit:    searchParams.get('limit')    ? parseInt(searchParams.get('limit')!)    : 20,
  };

  try {
    const result = await listPayments(auth.tenantId, filters);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[GET /api/payments]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/payments — create a new charge
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { customerData, amount, description, dueDate, billingType, orderId, appointmentId, contactId, conversationId } = body;

  if (!customerData?.name || !customerData?.phone) {
    return NextResponse.json({ error: 'customerData.name e customerData.phone são obrigatórios' }, { status: 400 });
  }
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount deve ser um número positivo' }, { status: 400 });
  }
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return NextResponse.json({ error: 'dueDate é obrigatório no formato YYYY-MM-DD' }, { status: 400 });
  }

  try {
    const payment = await createPaymentLink({
      tenantId:       auth.tenantId,
      orderId:        orderId        ?? undefined,
      appointmentId:  appointmentId  ?? undefined,
      contactId:      contactId      ?? undefined,
      conversationId: conversationId ?? undefined,
      customerData: {
        name:      customerData.name,
        phone:     customerData.phone,
        email:     customerData.email,
        cpfCnpj:   customerData.cpfCnpj,
      },
      amount,
      description,
      dueDate,
      billingType:  billingType ?? 'UNDEFINED',
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/payments]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
