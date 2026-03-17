import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getAppointments, createAppointment } from '@/src/services/schedulingService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  try {
    const list = await getAppointments(auth.tenantId, { date, status });
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { phone, customerName, service, date, time, notes } = body;

    if (!phone || !service || !date || !time) {
      return NextResponse.json({ error: 'phone, service, date and time are required' }, { status: 400 });
    }

    const appt = await createAppointment(auth.tenantId, {
      phone,
      customerName,
      service,
      date,
      time,
      notes,
    });
    return NextResponse.json(appt, { status: 201 });
  } catch (error: any) {
    // Conflict errors are 409, others 500
    const isConflict = error.message?.includes('já está ocupado');
    return NextResponse.json({ error: error.message }, { status: isConflict ? 409 : 500 });
  }
}
