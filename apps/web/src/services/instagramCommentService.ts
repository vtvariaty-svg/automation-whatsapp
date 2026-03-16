import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { replyToInstagramComment, hideInstagramComment, sendInstagramMessage } from './instagramService';
import { channelLog } from '@/lib/channels/logger';
// @ts-ignore
import { generateAIResponse } from './aiService';
import { saveUserMessage, saveAIMessage } from './conversationService';

export async function processInstagramComment(tenant: any, change: any): Promise<void> {
  const commentId: string = change.id;
  const postId: string = change.media?.id || change.parent_id || 'unknown';
  const fromId: string = change.from?.id || '';
  const fromUsername: string | null = change.from?.username || null;
  const text: string = change.text || '';

  if (!commentId || !text) return;

  // Idempotency
  const existing = await prisma.instagramModerationItem.findUnique({ where: { commentId } });
  if (existing) return;

  const item = await prisma.instagramModerationItem.create({
    data: { tenantId: tenant.id, commentId, postId, from: fromId, fromUsername, text, status: 'pending' },
  });

  channelLog.info({ channel: 'instagram', tenantId: tenant.id }, `Comment: ${commentId}`);

  const pageToken = tenant.instagramToken ? decrypt(tenant.instagramToken) : null;
  if (!pageToken || !tenant.instagramPageId) return;

  const rules = await prisma.instagramCommentRule.findMany({
    where: { tenantId: tenant.id, active: true },
    orderBy: [{ scope: 'desc' }, { createdAt: 'asc' }],
  });

  const textLower = text.toLowerCase().trim();
  let matchedRule: any = null;

  for (const rule of rules) {
    if (rule.scope === 'post' && rule.postId && rule.postId !== postId) continue;
    if (rule.triggerType === 'keyword' || rule.triggerType === 'contains') {
      const trigger = rule.triggerValue.toLowerCase().trim();
      const matched = rule.matchType === 'exact' ? textLower === trigger : textLower.includes(trigger);
      if (matched) { matchedRule = rule; break; }
    }
  }

  // AI intent fallback — only when no keyword matched
  if (!matchedRule && tenant.openaiKey) {
    const aiRules = rules.filter((r: any) => r.triggerType === 'ai_intent');
    if (aiRules.length > 0) {
      try {
        const intents = aiRules.map((r: any) => r.triggerValue).join(', ');
        const prompt = `Classify this comment into one of: [${intents}]. Reply ONLY with the matching intent or "none".\nComment: "${text}"`;
        const result = await generateAIResponse(prompt, tenant.openaiKey, '', '', tenant.id, fromId, '');
        const detected = result?.trim().toLowerCase();
        matchedRule = aiRules.find((r: any) => r.triggerValue.toLowerCase() === detected) || null;
      } catch {}
    }
  }

  if (!matchedRule) return; // left as pending for manual moderation

  const actions = matchedRule.actions as any;
  let finalStatus = 'dismissed';

  try {
    if (actions.hide) {
      await hideInstagramComment(commentId, true, pageToken);
      finalStatus = 'hidden';
    }
    if (actions.reply_text) {
      await replyToInstagramComment(commentId, actions.reply_text, pageToken);
      finalStatus = 'replied';
    }
    if (actions.send_dm && fromId) {
      const dmText = actions.dm_text || actions.reply_text || '';
      if (dmText) {
        await sendInstagramMessage(fromId, dmText, tenant.instagramPageId, pageToken);
        await saveUserMessage(fromId, text, tenant.id, 'ai', 'instagram');
        await saveAIMessage(fromId, dmText, tenant.id, 'ai', false, 'instagram');
      }
    }
    // M3: enroll in conversion sequence
    if (actions.start_sequence) {
      const { enrollLead } = await import('./conversionSequenceService');
      await enrollLead(tenant.id, actions.start_sequence, fromId, 'instagram').catch(() => {});
    }
  } catch (e: any) {
    channelLog.error({ channel: 'instagram', tenantId: tenant.id }, `Comment action error: ${e?.message}`);
  }

  await prisma.instagramModerationItem.update({
    where: { id: item.id },
    data: { status: finalStatus, ruleTriggeredId: matchedRule.id },
  });
}
