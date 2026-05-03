// Clinic Services API
// GET  /api/clinic/services     → list all services for tenant's clinic
// POST /api/clinic/services     → create a service

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) return NextResponse.json([], { status: 200 });

    const services = await prisma.clinicService.findMany({
      where: { tenantId: auth.tenantId, clinicProfileId: profile.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(services);
  } catch (error: any) {
    console.error('[clinic/services GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.clinicProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) {
      return NextResponse.json(
        { error: 'Crie um perfil de clínica antes de adicionar serviços.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, durationMinutes, priceDescription, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
    }

    const service = await prisma.clinicService.create({
      data: {
        tenantId: auth.tenantId,
        clinicProfileId: profile.id,
        name: String(name),
        description: description ? String(description) : undefined,
        durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
        priceDescription: priceDescription ? String(priceDescription) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    console.error('[clinic/services POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
