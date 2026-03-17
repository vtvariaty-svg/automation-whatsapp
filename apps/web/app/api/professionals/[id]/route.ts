import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, openingHours, closedWeekdays, active } = body;

  try {
    const updated = await prisma.professional.update({
      where: { id, tenantId: auth.tenantId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(openingHours !== undefined ? { openingHours } : {}),
        ...(closedWeekdays !== undefined ? { closedWeekdays } : {}),
        ...(active !== undefined ? { active } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.professional.delete({ where: { id, tenantId: auth.tenantId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
  }
}
