// Clinic Professionals API
// GET  /api/clinic/professionals  → list professionals for tenant's clinic
// POST /api/clinic/professionals  → create a professional

import { NextResponse } from 'next/server';
import { requireClinicAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  try {
    const profile = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) return NextResponse.json([], { status: 200 });

    const professionals = await prisma.clinicProfessional.findMany({
      where: { tenantId: auth.tenantId, clinicProfileId: profile.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(professionals);
  } catch (error: any) {
    console.error('[clinic/professionals GET]', error);
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
        { error: 'Crie um perfil de clínica antes de adicionar profissionais.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, role, bio, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
    }

    const professional = await prisma.clinicProfessional.create({
      data: {
        tenantId: auth.tenantId,
        clinicProfileId: profile.id,
        name: String(name),
        role: role ? String(role) : undefined,
        bio: bio ? String(bio) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error: any) {
    console.error('[clinic/professionals POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
