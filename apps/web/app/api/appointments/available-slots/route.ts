import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getAvailableSlots } from '@/src/services/schedulingService';

export async function GET(request: Request) {
  // FIX C1: require authentication — tenantId comes from JWT, not query param
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const service = searchParams.get('service');

  if (!date || !service) {
    return NextResponse.json({ error: 'date and service are required' }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(auth.tenantId, date, service);
    return NextResponse.json(slots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
