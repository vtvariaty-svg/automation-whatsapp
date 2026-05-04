// Clinic Availability [id] API
// PATCH  /api/clinic/availability/[id]  → update slot
// DELETE /api/clinic/availability/[id]  → hard delete (simple slot, no dependent records)

import { NextResponse } from 'next/server';
import { requireClinicAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

const TIME_REGEX = /^\d{2}:\d{2}$/;
const VALID_DAY_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const slot = await prisma.clinicAvailability.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!slot) return NextResponse.json({ error: 'Slot de disponibilidade não encontrado.' }, { status: 404 });

    const body = await request.json();
    const { dayOfWeek, startTime, endTime, isActive, professionalId } = body;

    if (dayOfWeek !== undefined && !VALID_DAY_OF_WEEK.includes(Number(dayOfWeek))) {
      return NextResponse.json({ error: 'dayOfWeek deve ser entre 0 e 6.' }, { status: 400 });
    }
    if (startTime !== undefined && !TIME_REGEX.test(String(startTime))) {
      return NextResponse.json({ error: 'startTime deve estar no formato HH:MM.' }, { status: 400 });
    }
    if (endTime !== undefined && !TIME_REGEX.test(String(endTime))) {
      return NextResponse.json({ error: 'endTime deve estar no formato HH:MM.' }, { status: 400 });
    }

    // If professionalId provided, validate cross-tenant ownership
    if (professionalId !== undefined && professionalId !== null) {
      const prof = await prisma.clinicProfessional.findFirst({
        where: { id: String(professionalId), tenantId: auth.tenantId },
      });
      if (!prof) {
        return NextResponse.json({ error: 'Profissional não encontrado neste tenant.' }, { status: 404 });
      }
    }

    const updated = await prisma.clinicAvailability.update({
      where: { id },
      data: {
        ...(dayOfWeek      !== undefined && { dayOfWeek: Number(dayOfWeek) }),
        ...(startTime      !== undefined && { startTime: String(startTime) }),
        ...(endTime        !== undefined && { endTime: String(endTime) }),
        ...(isActive       !== undefined && { isActive: Boolean(isActive) }),
        ...(professionalId !== undefined && { professionalId: professionalId || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[clinic/availability/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const slot = await prisma.clinicAvailability.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!slot) return NextResponse.json({ error: 'Slot de disponibilidade não encontrado.' }, { status: 404 });

    await prisma.clinicAvailability.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[clinic/availability/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
