import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!candidate) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });

  const suppressions = await prisma.leadSuppression.findMany({
    where: { leadCandidateId: id, tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ suppressions });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!candidate) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const { channel, reason, source = 'manual' } = body;

  if (!channel || !['email', 'whatsapp', 'all'].includes(channel)) {
    return NextResponse.json({ error: 'Canal inválido ou não informado (email, whatsapp, all)' }, { status: 400 });
  }

  if (!reason || typeof reason !== 'string') {
    return NextResponse.json({ error: 'Razão da supressão é obrigatória' }, { status: 400 });
  }

  // Check if an active suppression already exists for this channel
  const existingActive = await prisma.leadSuppression.findFirst({
    where: {
      leadCandidateId: id,
      tenantId: auth.tenantId,
      channel,
      active: true
    }
  });

  if (existingActive) {
    return NextResponse.json({ suppression: existingActive });
  }

  const newSuppression = await prisma.leadSuppression.create({
    data: {
      tenantId: auth.tenantId,
      leadCandidateId: id,
      channel,
      reason,
      source,
      active: true
    }
  });

  return NextResponse.json({ suppression: newSuppression });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const { suppressionId, active } = body;

  if (!suppressionId) {
    return NextResponse.json({ error: 'ID da supressão (suppressionId) obrigatório' }, { status: 400 });
  }

  if (typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Campo active inválido' }, { status: 400 });
  }

  const existing = await prisma.leadSuppression.findFirst({
    where: {
      id: suppressionId,
      leadCandidateId: id,
      tenantId: auth.tenantId
    }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Registro de supressão não encontrado' }, { status: 404 });
  }

  const updatedSuppression = await prisma.leadSuppression.update({
    where: { id: suppressionId },
    data: { active }
  });

  return NextResponse.json({ suppression: updatedSuppression });
}
