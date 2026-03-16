import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sequences = await prisma.conversionSequence.findMany({
    where: { tenantId: auth.tenantId },
    include: { steps: { orderBy: { order: 'asc' } }, _count: { select: { leads: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(sequences);
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, trigger, triggerValue, active = true, steps = [] } = await request.json();
  if (!name || !trigger) return NextResponse.json({ error: 'name and trigger required' }, { status: 400 });

  const sequence = await prisma.conversionSequence.create({
    data: {
      tenantId: auth.tenantId,
      name,
      trigger,
      triggerValue,
      active,
      steps: {
        create: steps.map((s: any, i: number) => ({
          order: i,
          delayMinutes: s.delayMinutes ?? 0,
          messageText: s.messageText,
          condition: s.condition || null,
          action: s.action || 'send_dm',
          actionData: s.actionData || null,
        })),
      },
    },
    include: { steps: true },
  });
  return NextResponse.json(sequence, { status: 201 });
}
