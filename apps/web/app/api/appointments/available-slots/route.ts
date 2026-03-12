import { NextResponse } from 'next/server';
import { getAvailableSlots } from '@/src/services/schedulingService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const date = searchParams.get('date');
  const service = searchParams.get('service');

  if (!tenantId || !date || !service) {
    return NextResponse.json({ error: 'tenantId, date and service are required' }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(tenantId, date, service);
    return NextResponse.json(slots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
