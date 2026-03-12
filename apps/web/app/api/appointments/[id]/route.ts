import { NextResponse } from 'next/server';
import { updateAppointmentStatus } from '@/src/services/schedulingService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { tenantId, status } = body;

    if (!tenantId || !status) {
      return NextResponse.json({ error: 'tenantId and status are required' }, { status: 400 });
    }

    const updated = await updateAppointmentStatus(tenantId, id, status);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
