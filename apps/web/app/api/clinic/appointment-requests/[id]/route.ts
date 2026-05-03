// Clinic Appointment Request [id] API (admin-only)
// GET   /api/clinic/appointment-requests/[id]  → get single request
// PATCH /api/clinic/appointment-requests/[id]  → update status / admin notes

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

const VALID_STATUS = ['NEW', 'CONTACTED', 'SCHEDULED', 'CANCELED', 'ARCHIVED'];

export async function GET(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const req = await prisma.appointmentRequest.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        service:      { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
        clinicProfile: { select: { id: true, displayName: true, slug: true } },
      },
    });
    if (!req) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });
    return NextResponse.json(req);
  } catch (error: any) {
    console.error('[clinic/appointment-requests/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.appointmentRequest.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Solicitação não encontrada.' }, { status: 404 });

    const body = await request.json();
    const { status, notes } = body;

    // Only admin-safe fields allowed — no clinical data
    if (status !== undefined && !VALID_STATUS.includes(String(status))) {
      return NextResponse.json(
        { error: `status inválido. Valores aceitos: ${VALID_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await prisma.appointmentRequest.update({
      where: { id },
      data: {
        ...(status !== undefined && { status: String(status) }),
        // notes is free text for admin use (scheduling details, contact notes)
        // NOT for clinical data — no diagnosis, prescription, or medical records
        ...(notes  !== undefined && { notes: String(notes) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[clinic/appointment-requests/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
