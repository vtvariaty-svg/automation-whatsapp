import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

interface OutcomeBody {
  responseStatus?: unknown;
  outcomeNotes?: unknown;
  conversionValue?: unknown;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  let body: OutcomeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const validStatuses = ['unknown', 'delivered', 'opened', 'replied', 'qualified', 'converted', 'lost', 'unsubscribed'];

  const responseStatus  = typeof body.responseStatus === 'string'  ? body.responseStatus  : undefined;
  const outcomeNotes    = body.outcomeNotes    === null ? null
    : typeof body.outcomeNotes    === 'string'  ? body.outcomeNotes    : undefined;
  const conversionValue = body.conversionValue === null ? null
    : typeof body.conversionValue === 'number'  ? body.conversionValue : undefined;

  if (responseStatus !== undefined && !validStatuses.includes(responseStatus)) {
    return NextResponse.json({ error: 'Status de resposta inválido' }, { status: 400 });
  }

  const existingItem = await prisma.leadCampaignExecutionItem.findFirst({
    where: { id, tenantId: auth.tenantId },
    include: {
      execution: true,
      draft: true,
      leadCandidate: true,
    },
  });

  if (!existingItem) {
    return NextResponse.json({ error: 'Item de execução não encontrado' }, { status: 404 });
  }

  if (existingItem.status !== 'sent') {
    return NextResponse.json({ error: 'Apenas itens enviados podem ter seu resultado comercial alterado' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    outcomeUpdatedAt: new Date(),
  };

  if (responseStatus  !== undefined) updates.responseStatus  = responseStatus;
  if (outcomeNotes    !== undefined) updates.outcomeNotes    = outcomeNotes;
  if (conversionValue !== undefined) updates.conversionValue = conversionValue;

  const finalStatus = responseStatus ?? existingItem.responseStatus;

  if (['replied', 'qualified', 'converted'].includes(finalStatus) && !existingItem.respondedAt) {
    updates.respondedAt = new Date();
  }

  if (finalStatus === 'converted' && !existingItem.convertedAt) {
    updates.convertedAt = new Date();
  }

  const updatedItem = await prisma.leadCampaignExecutionItem.update({
    where: { id },
    data: updates,
  });

  let createdSuppression = null;

  if (finalStatus === 'unsubscribed') {
    const activeSupp = await prisma.leadSuppression.findFirst({
      where: {
        leadCandidateId: existingItem.leadCandidateId,
        tenantId: auth.tenantId,
        channel: existingItem.channel,
        active: true,
      },
    });

    if (!activeSupp) {
      createdSuppression = await prisma.leadSuppression.create({
        data: {
          tenantId: auth.tenantId,
          leadCandidateId: existingItem.leadCandidateId,
          channel: existingItem.channel,
          reason: 'Opt-out registrado na campanha',
          source: 'unsubscribe',
          active: true,
        },
      });
    } else {
      createdSuppression = activeSupp;
    }
  }

  return NextResponse.json({
    executionItem: updatedItem,
    candidate: {
      id: existingItem.leadCandidate.id,
      companyName: existingItem.leadCandidate.companyName,
    },
    suppression: createdSuppression,
  });
}
