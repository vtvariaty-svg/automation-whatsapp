// Clinic Service [id] API
// GET    /api/clinic/services/[id]  → get single service
// PATCH  /api/clinic/services/[id]  → update service
// DELETE /api/clinic/services/[id]  → soft delete (isActive=false)

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const service = await prisma.clinicService.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!service) return NextResponse.json({ error: 'Serviço não encontrado.' }, { status: 404 });
    return NextResponse.json(service);
  } catch (error: any) {
    console.error('[clinic/services/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const service = await prisma.clinicService.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!service) return NextResponse.json({ error: 'Serviço não encontrado.' }, { status: 404 });

    const body = await request.json();
    const { name, description, durationMinutes, priceDescription, isActive, sortOrder } = body;

    const updated = await prisma.clinicService.update({
      where: { id },
      data: {
        ...(name             !== undefined && { name: String(name) }),
        ...(description      !== undefined && { description: String(description) }),
        ...(durationMinutes  !== undefined && { durationMinutes: Number(durationMinutes) }),
        ...(priceDescription !== undefined && { priceDescription: String(priceDescription) }),
        ...(isActive         !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder        !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[clinic/services/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const service = await prisma.clinicService.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!service) return NextResponse.json({ error: 'Serviço não encontrado.' }, { status: 404 });

    // Soft delete — preserve history (appointment requests may reference this service)
    await prisma.clinicService.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[clinic/services/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
