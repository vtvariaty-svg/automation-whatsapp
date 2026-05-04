// Clinic Professional [id] API
// GET    /api/clinic/professionals/[id]  → get single professional
// PATCH  /api/clinic/professionals/[id]  → update professional
// DELETE /api/clinic/professionals/[id]  → soft delete (isActive=false)

import { NextResponse } from 'next/server';
import { requireClinicAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const professional = await prisma.clinicProfessional.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!professional) return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 });
    return NextResponse.json(professional);
  } catch (error: any) {
    console.error('[clinic/professionals/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const professional = await prisma.clinicProfessional.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!professional) return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 });

    const body = await request.json();
    const { name, role, bio, isActive, sortOrder } = body;

    const updated = await prisma.clinicProfessional.update({
      where: { id },
      data: {
        ...(name      !== undefined && { name: String(name) }),
        ...(role      !== undefined && { role: String(role) }),
        ...(bio       !== undefined && { bio: String(bio) }),
        ...(isActive  !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[clinic/professionals/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const access = await requireClinicAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const professional = await prisma.clinicProfessional.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!professional) return NextResponse.json({ error: 'Profissional não encontrado.' }, { status: 404 });

    // Soft delete — preserve availability and appointment request history
    await prisma.clinicProfessional.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[clinic/professionals/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
