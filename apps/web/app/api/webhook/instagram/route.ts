import { createHmac, timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { isRateLimited, getClientIp } from '@/lib/webhookRateLimit';
import { normalizeInstagramDMInbound } from '@/lib/channels/normalizer';
import { isChannelEnabled } from '@/lib/channels/featureFlags';
import { channelLog } from '@/lib/channels/logger';
import { sendInstagramMessage } from '@/src/services/instagramService';
import { processInstagramComment } from '@/src/services/instagramCommentService';
// @ts-ignore
import { generateAIResponse } from '@/src/services/aiService';
// @ts-ignore
import { saveUserMessage, saveAIMessage, getConversationHistory, getConversationStatus } from '@/src/services/conversationService';
import { buildCustomerContext, upsertCustomerMemory, extractNameFromText } from '@/src/services/customerMemoryService';
import { checkAutomationMatch } from '@/src/services/automationService';
import { verifyAiLimits } from '@/src/services/billingService';

function mask(id: string) { return id?.length > 4 ? `****${id.slice(-4)}` : '****'; }

async function verifyHmac(raw: string, header: string | null): Promise<boolean> {
  const secret = process.env.INSTAGRAM_APP_SECRET || process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!header?.startsWith('sha256=')) return false;
  const received = header.slice(7);
  const expected = createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  try { return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex')); } catch { return false; }
}

// Resolves tenant primarily by instagramAccountId (IG professional account ID),
// which is entry[0].id when the app is subscribed via /{igAccountId}/subscribed_apps.
// Falls back to instagramPageId for backward compatibility with old subscriptions.
async function getTenantByIgAccountId(id: string) {
  const byAccount = await prisma.tenant.findFirst({ where: { instagramAccountId: id } });
  if (byAccount) return byAccount;
  return prisma.tenant.findFirst({ where: { instagramPageId: id } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = process.env.INSTAGRAM_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === token) {
    return new Response(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req))) return new Response('Too Many Requests', { status: 429 });

  let rawBody: string;
  try { rawBody = await req.text(); } catch { return new Response('Bad Request', { status: 400 }); }

  const hmacValid = await verifyHmac(rawBody, (req.headers as any).get?.('x-hub-signature-256') ?? null);
  if (!hmacValid) {
    console.error('[IG_WEBHOOK] hmac=invalid — rejecting request');
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody);
    if (body.object !== 'instagram') return new Response('OK', { status: 200 });

    const entryCount: number = body.entry?.length ?? 0;
    const hasMessaging: boolean = !!(body.entry?.[0]?.messaging);
    const hasChanges: boolean = !!(body.entry?.[0]?.changes);
    const field: string | undefined = body.entry?.[0]?.changes?.[0]?.field;
    const entryId: string = body.entry?.[0]?.id;

    console.log(
      `[IG_WEBHOOK] hmac=valid received object=${body.object} entryCount=${entryCount} hasMessaging=${hasMessaging} hasChanges=${hasChanges} entryId=${mask(entryId)} field=${field ?? 'none'}`,
    );

    if (hasMessaging || field === 'messages') {
      await handleDM(body, entryId);
    } else if (field === 'comments') {
      await handleComment(body, entryId);
    } else {
      console.log(`[IG_WEBHOOK] unhandled field=${field ?? 'none'} — no action taken`);
    }
  } catch (e) {
    channelLog.error({ channel: 'instagram' }, `Webhook error: ${e}`);
  }

  return new Response('OK', { status: 200 });
}

async function handleDM(body: any, entryId: string) {
  const event = normalizeInstagramDMInbound(body);

  if (!event) {
    console.log(`[IG_WEBHOOK] normalized=false reason=no_messaging_or_message entryId=${mask(entryId)}`);
    return;
  }
  if (!event.text) {
    console.log(
      `[IG_WEBHOOK] normalized=true hasText=false accountId=${mask(event.accountId)} senderId=${mask(event.from)} mid=${event.messageId} — skipping`,
    );
    return;
  }

  console.log(
    `[IG_WEBHOOK] normalized=true hasText=true accountId=${mask(event.accountId)} senderId=${mask(event.from)} mid=${event.messageId}`,
  );

  // Resolve tenant primarily by IG account ID (entry[0].id = igAccountId after subscription fix).
  // Falls back to instagramPageId for backward compat with old subscriptions.
  const resolveId = event.accountId || entryId;
  console.log(`[IG_WEBHOOK] tenant lookup accountId=${mask(resolveId)}`);
  const tenant = await getTenantByIgAccountId(resolveId);

  if (!tenant) {
    console.log(`[IG_WEBHOOK] tenant found=false accountId=${mask(resolveId)}`);
    return;
  }
  console.log(`[IG_WEBHOOK] tenant found=true tenantId=${tenant.id} accountId=${mask(resolveId)}`);

  if (!isChannelEnabled(tenant, 'instagram')) {
    console.log(`[IG_WEBHOOK] channel disabled tenantId=${tenant.id} — skipping`);
    return;
  }

  const pageToken = tenant.instagramToken ? decrypt(tenant.instagramToken) : null;
  if (!pageToken) {
    console.error(`[IG_WEBHOOK] no pageToken tenantId=${tenant.id} — cannot send`);
    return;
  }

  // Runtime send target: Instagram professional account ID
  const igAccountId = tenant.instagramAccountId!;

  const { from, text: textBody, messageId } = event;

  // Idempotency
  if (messageId) {
    try {
      await prisma.processedMessage.create({ data: { messageId } });
      prisma.processedMessage.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 86400000) } } }).catch(() => {});
    } catch {
      channelLog.warn({ channel: 'instagram', tenantId: tenant.id, messageId }, 'Duplicate ignored');
      return;
    }
  }

  channelLog.info({ channel: 'instagram', tenantId: tenant.id, from: mask(from) }, 'DM received');

  // Welcome
  try {
    const history = await getConversationHistory(from, tenant.id);
    if (history.length === 0 && tenant.welcomeMessage) {
      console.log(`[IG_WEBHOOK] reply attempt started (welcome) tenantId=${tenant.id} senderId=${mask(from)}`);
      await sendInstagramMessage(from, tenant.welcomeMessage, igAccountId, pageToken);
      await saveAIMessage(from, tenant.welcomeMessage, tenant.id, 'open', true, 'instagram');
    }
  } catch {}

  let status = await getConversationStatus(from, tenant.id, 'instagram');
  if (status === 'closed') status = 'open';
  await saveUserMessage(from, textBody, tenant.id, status, 'instagram');
  console.log(`[IG_WEBHOOK] message persisted=true tenantId=${tenant.id} senderId=${mask(from)} status=${status}`);

  if (status !== 'open' && status !== 'ai') return;

  // Automation
  const automation = await checkAutomationMatch(textBody, tenant.id);
  console.log(`[IG_WEBHOOK] automation matched=${!!automation} tenantId=${tenant.id}`);
  if (automation) {
    await saveAIMessage(from, automation.responseText, tenant.id, status, false, 'instagram');
    try {
      console.log(`[IG_WEBHOOK] reply attempt started (automation) tenantId=${tenant.id} senderId=${mask(from)}`);
      await sendInstagramMessage(from, automation.responseText, igAccountId, pageToken);
    } catch (e: any) {
      channelLog.error({ channel: 'instagram', tenantId: tenant.id }, `Automation send failed: ${e?.message}`);
    }
    return;
  }

  // AI limits
  let canUseAI = true;
  try { canUseAI = await verifyAiLimits(tenant.id); } catch {}
  if (!canUseAI) {
    const msg = 'Seu limite de respostas da IA foi atingido neste mês.';
    console.log(`[IG_WEBHOOK] AI used=false (limit reached) tenantId=${tenant.id}`);
    await sendInstagramMessage(from, msg, igAccountId, pageToken);
    await saveAIMessage(from, msg, tenant.id, status, false, 'instagram');
    return;
  }

  console.log(`[IG_WEBHOOK] AI used=true tenantId=${tenant.id}`);

  let customerContext = '';
  try { customerContext = await buildCustomerContext(tenant.id, from); } catch {}
  const detectedName = extractNameFromText(textBody);
  if (detectedName) upsertCustomerMemory(tenant.id, from, { name: detectedName }).catch(() => {});

  const aiResponse = await generateAIResponse(textBody, tenant.openaiKey || '', tenant.aiPrompt || '', tenant.businessHours || '', tenant.id, from, customerContext);
  await saveAIMessage(from, aiResponse, tenant.id, status, true, 'instagram');

  try {
    console.log(`[IG_WEBHOOK] reply attempt started (AI) tenantId=${tenant.id} senderId=${mask(from)}`);
    await sendInstagramMessage(from, aiResponse, igAccountId, pageToken);
    channelLog.info({ channel: 'instagram', tenantId: tenant.id, from: mask(from) }, 'DM sent');
  } catch (e: any) {
    channelLog.error({ channel: 'instagram', tenantId: tenant.id }, `Send failed: ${e?.message}`);
  }
}

async function handleComment(body: any, entryId: string) {
  const change = body.entry?.[0]?.changes?.[0]?.value;
  if (!change) return;

  console.log(`[IG_WEBHOOK] comment received entryId=${mask(entryId)}`);
  console.log(`[IG_WEBHOOK] tenant lookup accountId=${mask(entryId)}`);

  const tenant = await getTenantByIgAccountId(entryId);
  if (!tenant) {
    console.log(`[IG_WEBHOOK] tenant found=false accountId=${mask(entryId)}`);
    return;
  }
  if (!isChannelEnabled(tenant, 'instagram')) return;

  console.log(`[IG_WEBHOOK] tenant found=true tenantId=${tenant.id} (comment)`);

  await processInstagramComment(tenant, change).catch((e) =>
    channelLog.error({ channel: 'instagram', tenantId: tenant.id }, `Comment error: ${e?.message}`),
  );
}
