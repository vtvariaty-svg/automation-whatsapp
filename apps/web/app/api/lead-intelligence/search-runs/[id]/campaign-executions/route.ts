import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { dispatchEmailCampaign } from '@/lib/services/lead-intelligence/emailCampaignDispatchService';
import { dispatchWhatsAppCampaign } from '@/lib/services/lead-intelligence/whatsappCampaignDispatchService';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const searchRun = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!searchRun) {
    return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });
  }

  const executions = await prisma.leadCampaignExecution.findMany({
    where: { searchRunId: id, tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { items: true }
      }
    }
  });

  return NextResponse.json({ executions });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const searchRun = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!searchRun) {
    return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const { channel, batchSize = 10, draftIds, notes } = body;

  if (channel !== 'email' && channel !== 'whatsapp') {
    return NextResponse.json({ error: 'Canal inválido' }, { status: 400 });
  }

  let cappedBatchSize = Number(batchSize);
  if (isNaN(cappedBatchSize) || cappedBatchSize < 1) cappedBatchSize = 1;
  if (cappedBatchSize > 20) cappedBatchSize = 20;

  const draftsWhere: any = {
    searchRunId: id,
    tenantId: auth.tenantId,
    channel,
    status: 'approved'
  };

  if (Array.isArray(draftIds) && draftIds.length > 0) {
    draftsWhere.id = { in: draftIds };
  }

  const drafts = await prisma.leadCampaignDraft.findMany({
    where: draftsWhere,
    include: {
      leadCandidate: {
        include: {
          suppressions: { where: { active: true } }
        }
      },
      tenant: true
    }
  });

  if (drafts.length === 0) {
    return NextResponse.json({ error: 'Nenhum rascunho elegível encontrado' }, { status: 400 });
  }

  const selectedDraftsToProcess = drafts.slice(0, cappedBatchSize);

  const execution = await prisma.leadCampaignExecution.create({
    data: {
      tenantId: auth.tenantId,
      searchRunId: id,
      channel,
      status: 'running',
      requestedCount: drafts.length,
      eligibleCount: selectedDraftsToProcess.length,
      batchSize: cappedBatchSize,
      notes: notes || null,
      startedAt: new Date(),
    }
  });

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const draft of selectedDraftsToProcess) {
    const candidate = draft.leadCandidate;
    let allowedToSend = false;
    let skippedReason = '';

    const hasSuppression = candidate.suppressions.some((s: any) => s.channel === 'all' || s.channel === channel);

    if (hasSuppression) {
      skippedReason = channel === 'email' ? 'Lead suprimido para email' : 'Lead suprimido para WhatsApp';
      if (candidate.suppressions.some((s: any) => s.channel === 'all')) {
        skippedReason = 'Lead suprimido para todos os canais';
      }
    } else if (channel === 'email') {
      if (candidate.emailConsentStatus !== 'granted') skippedReason = 'Sem consentimento de email';
      else if (!candidate.email) skippedReason = 'Sem endereço de email';
      else if (candidate.outreachStatus !== 'ready_email' && candidate.outreachStatus !== 'ready_multichannel') skippedReason = 'Prontidão bloqueada';
      else allowedToSend = true;
    } else {
      if (candidate.whatsappConsentStatus !== 'granted') skippedReason = 'Sem consentimento de WhatsApp';
      else if (!candidate.phone && !candidate.mobilePhone) skippedReason = 'Sem telefone';
      else if (candidate.outreachStatus !== 'ready_whatsapp' && candidate.outreachStatus !== 'ready_multichannel') skippedReason = 'Prontidão bloqueada';
      else allowedToSend = true;
    }

    if (!allowedToSend) {
      skippedCount++;
      await prisma.leadCampaignExecutionItem.create({
        data: {
          tenantId: auth.tenantId,
          executionId: execution.id,
          draftId: draft.id,
          leadCandidateId: candidate.id,
          channel,
          status: 'skipped',
          reason: skippedReason,
        }
      });
      continue;
    }

    let dispatchResult;
    if (channel === 'email') {
      dispatchResult = await dispatchEmailCampaign(draft, candidate);
    } else {
      dispatchResult = await dispatchWhatsAppCampaign(draft, candidate, draft.tenant);
    }

    let deliveredToValue: string | null = null;
    if (channel === 'whatsapp') {
      deliveredToValue = (dispatchResult as any).deliveredTo || null;
    } else {
      deliveredToValue = candidate.email || null;
    }

    if (dispatchResult.success) {
      sentCount++;
      await prisma.leadCampaignExecutionItem.create({
        data: {
          tenantId: auth.tenantId,
          executionId: execution.id,
          draftId: draft.id,
          leadCandidateId: candidate.id,
          channel,
          status: 'sent',
          providerMessageId: dispatchResult.providerMessageId || null,
          deliveredTo: deliveredToValue,
        }
      });
      await prisma.leadCampaignDraft.update({
        where: { id: draft.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          providerMessageId: dispatchResult.providerMessageId,
          providerChannel: channel,
          deliveryMeta: deliveredToValue ? { deliveredTo: deliveredToValue } : Prisma.DbNull,
          errorMessage: null,
        }
      });
    } else {
      failedCount++;
      await prisma.leadCampaignExecutionItem.create({
        data: {
          tenantId: auth.tenantId,
          executionId: execution.id,
          draftId: draft.id,
          leadCandidateId: candidate.id,
          channel,
          status: 'failed',
          reason: dispatchResult.errorMessage || 'Error',
        }
      });
      await prisma.leadCampaignDraft.update({
        where: { id: draft.id },
        data: {
          status: 'failed',
          providerChannel: channel,
          errorMessage: dispatchResult.errorMessage,
        }
      });
    }
  }

  const processedTotal = sentCount + failedCount + skippedCount;
  let executionStatus = 'completed';
  if (processedTotal > 0 && sentCount === 0) executionStatus = 'failed';
  else if (failedCount > 0 || skippedCount > 0) executionStatus = 'partial';
  if (processedTotal === 0) executionStatus = 'failed';

  const updatedExecution = await prisma.leadCampaignExecution.update({
    where: { id: execution.id },
    data: {
      status: executionStatus,
      sentCount,
      failedCount,
      skippedCount,
      finishedAt: new Date()
    }
  });

  return NextResponse.json({
    execution: updatedExecution,
    summary: {
      requested: drafts.length,
      eligible: selectedDraftsToProcess.length,
      processed: processedTotal,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      executionId: execution.id
    }
  });
}
