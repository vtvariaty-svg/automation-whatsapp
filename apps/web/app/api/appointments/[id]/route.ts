import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { updateAppointmentStatus, rescheduleAppointment, cancelAppointment } from '@/src/services/schedulingService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const { action, status, date, time, reason } = body;

    // AG4 — reschedule action
    if (action === 'reschedule') {
      if (!date || !time) {
        return NextResponse.json({ error: 'date and time are required for reschedule' }, { status: 400 });
      }
      const updated = await rescheduleAppointment(auth.tenantId, id, date, time);
      return NextResponse.json(updated);
    }

    // Status update (includes AG4 cancel-with-reason)
    if (!status) {
      return NextResponse.json({ error: 'status or action is required' }, { status: 400 });
    }

    const validStatuses = ['agendado', 'confirmado', 'concluido', 'cancelado', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // AG4 — cancellation with optional reason
    if (status === 'cancelado') {
      const updated = await cancelAppointment(auth.tenantId, id, reason);
      return NextResponse.json(updated);
    }

    const updated = await updateAppointmentStatus(auth.tenantId, id, status);
    return NextResponse.json(updated);
  } catch (error: any) {
    const isNotFound = error.message?.includes('não encontrado') || error.message?.includes('não podem');
    const isConflict = error.message?.includes('já está ocupado');
    return NextResponse.json(
      { error: error.message },
      { status: isNotFound ? 404 : isConflict ? 409 : 500 }
    );
  }
}
