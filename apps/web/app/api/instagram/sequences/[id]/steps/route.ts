import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const seq = await prisma.conversionSequence.findFirst({ where: { id, tenantId: auth.tenantId } });
  if (!seq) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const steps = await prisma.conversionSequenceStep.findMany({ where: { sequenceId: id }, orderBy: { order: 'asc' } });
  return NextResponse.json(steps);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const seq = await prisma.conversionSequence.findFirst({ where: { id, tenantId: auth.tenantId } });
  if (!seq) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { steps } = await request.json();
  // Replace all steps
  await prisma.conversionSequenceStep.deleteMany({ where: { sequenceId: id } });
  const created = await prisma.conversionSequenceStep.createMany({
    data: steps.map((s: any, i: number) => ({
      sequenceId: id,
      order: i,
      delayMinutes: s.delayMinutes ?? 0,
      messageText: s.messageText,
      condition: s.condition || null,
      action: s.action || 'send_dm',
      actionData: s.actionData || null,
    })),
  });
  return NextResponse.json({ updated: created.count });
}
