import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

/** PUT /api/professionals/[id]/services — replace full list of assigned service IDs */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: professionalId } = await params;
  const body = await request.json();
  const { serviceIds }: { serviceIds: string[] } = body;

  if (!Array.isArray(serviceIds)) {
    return NextResponse.json({ error: 'serviceIds must be an array' }, { status: 400 });
  }

  // Verify professional belongs to tenant
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId, tenantId: auth.tenantId },
  });
  if (!professional) return NextResponse.json({ error: 'Professional not found' }, { status: 404 });

  // Verify all services belong to tenant
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, tenantId: auth.tenantId },
    select: { id: true },
  });
  const validIds = new Set(services.map(s => s.id));

  await prisma.$transaction([
    prisma.professionalService.deleteMany({ where: { professionalId } }),
    prisma.professionalService.createMany({
      data: [...validIds].map(serviceId => ({ professionalId, serviceId })),
      skipDuplicates: true,
    }),
  ]);

  return NextResponse.json({ success: true, assignedCount: validIds.size });
}
