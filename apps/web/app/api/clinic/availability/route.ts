// Clinic Availability API
// GET  /api/clinic/availability     → list availability slots for tenant's clinic
// POST /api/clinic/availability     → create an availability slot

import { NextResponse } from 'next/server';
import { requireClinicAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';

const VALID_DAY_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];
const TIME_REGEX = /^\d{2}:\d{2}$/;

export async function GET(request: Request) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  try {
    const profile = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) return NextResponse.json([], { status: 200 });

    const slots = await prisma.clinicAvailability.findMany({
      where: { tenantId: auth.tenantId, clinicProfileId: profile.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { professional: { select: { id: true, name: true } } },
    });
    return NextResponse.json(slots);
  } catch (error: any) {
    console.error('[clinic/availability GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  try {
    const profile = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) {
      return NextResponse.json(
        { error: 'Crie um perfil de clínica antes de configurar disponibilidade.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime, professionalId } = body;

    if (!VALID_DAY_OF_WEEK.includes(Number(dayOfWeek))) {
      return NextResponse.json({ error: 'dayOfWeek deve ser um número entre 0 (domingo) e 6 (sábado).' }, { status: 400 });
    }
    if (!startTime || !TIME_REGEX.test(String(startTime))) {
      return NextResponse.json({ error: 'startTime deve estar no formato HH:MM.' }, { status: 400 });
    }
    if (!endTime || !TIME_REGEX.test(String(endTime))) {
      return NextResponse.json({ error: 'endTime deve estar no formato HH:MM.' }, { status: 400 });
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'startTime deve ser anterior a endTime.' }, { status: 400 });
    }

    // Validate professionalId belongs to same tenant if provided
    if (professionalId) {
      const prof = await prisma.clinicProfessional.findFirst({
        where: { id: String(professionalId), tenantId: auth.tenantId },
      });
      if (!prof) {
        return NextResponse.json({ error: 'Profissional não encontrado neste tenant.' }, { status: 404 });
      }
    }

    const slot = await prisma.clinicAvailability.create({
      data: {
        tenantId: auth.tenantId,
        clinicProfileId: profile.id,
        dayOfWeek: Number(dayOfWeek),
        startTime: String(startTime),
        endTime: String(endTime),
        professionalId: professionalId ? String(professionalId) : undefined,
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error: any) {
    console.error('[clinic/availability POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
