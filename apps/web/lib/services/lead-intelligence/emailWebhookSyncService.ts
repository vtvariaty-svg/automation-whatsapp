import { prisma } from '@/lib/prisma';

export async function processResendWebhook(payload: any) {
  if (!payload || !payload.type) {
    return { error: 'Invalid payload' };
  }

  const eventType = payload.type; 
  const data = payload.data || {};
  const providerMessageId = data.email_id || null;
  const eventCreatedAt = payload.created_at ? new Date(payload.created_at) : new Date();
  
  // Use payload.id as externalEventId if available, otherwise generate a stable fallback
  const externalEventId = payload.id || `${eventType}_${providerMessageId || 'no_msg'}_${eventCreatedAt.getTime()}`;

  // Idempotency check
  const existingEvent = await prisma.leadProviderEventLog.findUnique({
    where: {
      provider_externalEventId: {
        provider: 'resend',
        externalEventId
      }
    }
  });

  if (existingEvent) {
    return {
      duplicate: true,
      processed: false,
      eventId: existingEvent.id,
      message: 'Event already processed'
    };
  }

  if (!providerMessageId) {
    // Cannot match an execution item without providerMessageId
    await persistLog('resend', externalEventId, eventType, providerMessageId, 'ignored_unmatched', payload, null, 'No valid email_id found');
    return { processed: false, message: 'Ignored unmatched: no providerMessageId' };
  }

  // Find execution item
  const executionItem = await prisma.leadCampaignExecutionItem.findFirst({
    where: {
      channel: 'email',
      providerMessageId
    },
    include: {
      leadCandidate: true
    }
  });

  if (!executionItem) {
    await persistLog('resend', externalEventId, eventType, providerMessageId, 'ignored_unmatched', payload, null, 'No matching execution item found');
    return { processed: false, message: 'Ignored unmatched: execution item not found' };
  }

  // Safe mapping rules
  const currentStatus = executionItem.responseStatus;
  const highLevelStatuses = ['qualified', 'converted'];
  let newStatus = currentStatus;
  let newNotes = executionItem.outcomeNotes;
  let createSuppression = false;
  let suppressionReason = '';
  let suppressionSource = 'compliance';

  switch (eventType) {
    case 'email.delivered':
      if (currentStatus === 'unknown') newStatus = 'delivered';
      break;

    case 'email.opened':
      if (currentStatus === 'unknown' || currentStatus === 'delivered') newStatus = 'opened';
      break;

    case 'email.delivery_delayed':
      newNotes = appendNote(newNotes, `Email sofreu delay em ${eventCreatedAt.toISOString().substring(0, 10)}.`);
      break;

    case 'email.failed':
      if (!highLevelStatuses.includes(currentStatus)) newStatus = 'lost';
      newNotes = appendNote(newNotes, `Falha de envio provida pelo Resend.`);
      break;

    case 'email.bounced':
      if (!highLevelStatuses.includes(currentStatus)) newStatus = 'lost';
      createSuppression = true;
      suppressionReason = 'Bounce detectado pelo provedor de email';
      suppressionSource = 'bounce';
      break;

    case 'email.complained':
      if (!highLevelStatuses.includes(currentStatus)) newStatus = 'unsubscribed';
      createSuppression = true;
      suppressionReason = 'Complaint detectado pelo provedor de email';
      break;

    case 'email.suppressed':
      if (!highLevelStatuses.includes(currentStatus)) newStatus = 'unsubscribed';
      createSuppression = true;
      suppressionReason = 'Email suprimido pelo provedor';
      break;
  }

  // Apply updates if there is a change
  if (newStatus !== currentStatus || newNotes !== executionItem.outcomeNotes) {
    await prisma.leadCampaignExecutionItem.update({
      where: { id: executionItem.id },
      data: {
        responseStatus: newStatus,
        outcomeNotes: newNotes,
        outcomeSource: 'provider_webhook',
        lastProviderEventType: eventType,
        lastProviderEventAt: eventCreatedAt,
        outcomeUpdatedAt: new Date()
      }
    });
  } else {
    // If no state change, still update the last event markers
    await prisma.leadCampaignExecutionItem.update({
      where: { id: executionItem.id },
      data: {
        lastProviderEventType: eventType,
        lastProviderEventAt: eventCreatedAt
      }
    });
  }

  let suppressionCreatedOrReactivated = false;

  if (createSuppression) {
    const activeSupp = await prisma.leadSuppression.findFirst({
      where: {
        leadCandidateId: executionItem.leadCandidateId,
        tenantId: executionItem.tenantId,
        channel: 'email',
        active: true
      }
    });

    if (!activeSupp) {
      await prisma.leadSuppression.create({
        data: {
          tenantId: executionItem.tenantId,
          leadCandidateId: executionItem.leadCandidateId,
          channel: 'email',
          reason: suppressionReason,
          source: suppressionSource,
          active: true
        }
      });
      suppressionCreatedOrReactivated = true;
    }
  }

  await persistLog(
    'resend',
    externalEventId,
    eventType,
    providerMessageId,
    'processed',
    payload,
    executionItem,
    null
  );

  return {
    matched: true,
    processed: true,
    duplicate: false,
    eventType,
    executionItemId: executionItem.id,
    suppressionCreatedOrReactivated,
    message: 'Processed successfully'
  };
}

function appendNote(existing: string | null, text: string) {
  if (!existing) return text;
  if (existing.includes(text)) return existing;
  return `${existing}\n[Resend]: ${text}`;
}

async function persistLog(
  provider: string,
  externalEventId: string,
  eventType: string,
  providerMessageId: string | null,
  processingStatus: string,
  payload: any,
  executionItem: any | null,
  errorMessage: string | null
) {
  return prisma.leadProviderEventLog.create({
    data: {
      provider,
      channel: 'email',
      externalEventId,
      eventType,
      providerMessageId,
      processingStatus,
      payload,
      errorMessage,
      processedAt: new Date(),
      tenantId: executionItem?.tenantId || null,
      executionItemId: executionItem?.id || null
    }
  });
}
