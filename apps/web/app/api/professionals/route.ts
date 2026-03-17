import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const professionals = await prisma.professional.findMany({
    where: { tenantId: auth.tenantId },
    include: {
      services: { include: { service: { select: { id: true, name: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(professionals);
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, openingHours, closedWeekdays } = body;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const professional = await prisma.professional.create({
    data: {
      tenantId: auth.tenantId,
      name,
      openingHours: openingHours ?? null,
      closedWeekdays: closedWeekdays ?? '',
    },
  });

  return NextResponse.json(professional, { status: 201 });
}
