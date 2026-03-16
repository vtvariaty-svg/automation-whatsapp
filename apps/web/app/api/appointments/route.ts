import { NextResponse } from 'next/server';
import { getAppointments, createAppointment } from '@/src/services/schedulingService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const list = await getAppointments(auth.tenantId);
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
    const { phone, customerName, service, date, time } = body;

    if (!phone || !service || !date || !time) {
      return NextResponse.json({ error: 'Missing required scheduling fields' }, { status: 400 });
    }

    const newAppt = await createAppointment(auth.tenantId, { phone, customerName, service, date, time });
    return NextResponse.json(newAppt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
