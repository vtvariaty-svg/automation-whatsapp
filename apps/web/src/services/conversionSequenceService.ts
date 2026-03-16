import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { channelLog } from '@/lib/channels/logger';
import type { Channel } from '@/lib/channels/types';
import { sendChannelMessage } from '@/lib/channels/sender';

export async function enrollLead(
  tenantId: string,
  sequenceId: string,
  contactId: string,
  channel: Channel = 'whatsapp',
): Promise<void> {
  const sequence = await prisma.conversionSequence.findFirst({
    where: { id: sequenceId, tenantId, active: true },
    include: { steps: { orderBy: { order: 'asc' }, take: 1 } },
  });
  if (!sequence) return;

  const firstStep = sequence.steps[0];
  const nextStepAt = firstStep
    ? new Date(Date.now() + firstStep.delayMinutes * 60 * 1000)
    : null;

  await prisma.conversionLead.upsert({
    where: { sequenceId_contactId: { sequenceId, contactId } },
    create: { tenantId, sequenceId, contactId, channel, currentStep: 0, status: 'active', nextStepAt },
    update: { status: 'active', currentStep: 0, nextStepAt, updatedAt: new Date() },
  });

  channelLog.info({ channel, tenantId }, `Lead enrolled in sequence ${sequenceId}: ${contactId}`);
}

export async function processSequences(): Promise<void> {
  const now = new Date();
  const dueLeads = await prisma.conversionLead.findMany({
    where: { status: 'active', nextStepAt: { lte: now } },
    include: { sequence: { include: { steps: { orderBy: { order: 'asc' } } } } },
    take: 100,
  });

  for (const lead of dueLeads) {
    await processLeadStep(lead).catch((e) =>
      channelLog.error({ channel: lead.channel as Channel, tenantId: lead.tenantId }, `Sequence step error: ${e?.message}`),
    );
  }
}

async function processLeadStep(lead: any): Promise<void> {
  const steps = lead.sequence?.steps ?? [];
  const step = steps.find((s: any) => s.order === lead.currentStep);

  if (!step) {
    await prisma.conversionLead.update({
      where: { id: lead.id },
      data: { status: 'converted', updatedAt: new Date() },
    });
    return;
  }

  // Check stop condition: human takeover
  const { getConversationStatus } = await import('./conversationService');
  const convStatus = await getConversationStatus(lead.contactId, lead.tenantId).catch(() => 'ai');
  if (convStatus === 'human') {
    await prisma.conversionLead.update({ where: { id: lead.id }, data: { status: 'paused', updatedAt: new Date() } });
    return;
  }

  // Condition check
  if (step.condition === 'no_reply') {
    const { getConversationHistory } = await import('./conversationService');
    const history = await getConversationHistory(lead.contactId, lead.tenantId);
    const lastUserMsg = [...history].reverse().find((m: any) => m.sender === 'user');
    if (lastUserMsg && new Date(lastUserMsg.timestamp) > new Date(lead.lastStepAt)) {
      // User replied — skip this step
      await advanceLead(lead, steps, 'skipped');
      return;
    }
  }

  // Execute action
  const tenant = await prisma.tenant.findUnique({ where: { id: lead.tenantId } });
  if (!tenant) return;

  let result: 'sent' | 'error' = 'sent';
  try {
    const config = buildSendConfig(tenant, lead.channel);
    if (config) {
      await sendChannelMessage({ channel: lead.channel as Channel, to: lead.contactId, text: step.messageText, config });
      const { saveAIMessage } = await import('./conversationService');
      await saveAIMessage(lead.contactId, step.messageText, lead.tenantId, 'ai', false, lead.channel);
    }
  } catch {
    result = 'error';
  }

  await prisma.conversionLeadEvent.create({
    data: { leadId: lead.id, stepOrder: step.order, action: step.action, result },
  });

  await advanceLead(lead, steps, result);
}

async function advanceLead(lead: any, steps: any[], _result: string): Promise<void> {
  const nextStep = steps.find((s: any) => s.order === lead.currentStep + 1);
  if (!nextStep) {
    await prisma.conversionLead.update({ where: { id: lead.id }, data: { status: 'converted', updatedAt: new Date() } });
    return;
  }
  const nextStepAt = new Date(Date.now() + nextStep.delayMinutes * 60 * 1000);
  await prisma.conversionLead.update({
    where: { id: lead.id },
    data: { currentStep: nextStep.order, nextStepAt, lastStepAt: new Date(), updatedAt: new Date() },
  });
}

function buildSendConfig(tenant: any, channel: string) {
  if (channel === 'whatsapp' && tenant.whatsappToken) {
    return {
      phoneId: tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId,
      token: decrypt(tenant.whatsappToken),
    };
  }
  if (channel === 'instagram' && tenant.instagramToken) {
    return { pageId: tenant.instagramPageId, token: decrypt(tenant.instagramToken) };
  }
  if (channel === 'facebook' && tenant.facebookToken) {
    return { pageId: tenant.facebookPageId, token: decrypt(tenant.facebookToken) };
  }
  return null;
}
