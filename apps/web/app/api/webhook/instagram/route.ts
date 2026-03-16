import { createHmac, timingSafeEqual } from 'crypto';
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
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!header?.startsWith('sha256=')) return false;
  const received = header.slice(7);
  const expected = createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  try { return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex')); } catch { return false; }
}

async function getTenantByInstagramPageId(pageId: string) {
  return prisma.tenant.findFirst({ where: { instagramPageId: pageId } });
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

  if (!await verifyHmac(rawBody, (req.headers as any).get?.('x-hub-signature-256') ?? null)) {
    channelLog.warn({ channel: 'instagram' }, 'Invalid HMAC');
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody);
    if (body.object !== 'instagram') return new Response('OK', { status: 200 });

    const field = body.entry?.[0]?.changes?.[0]?.field;
    const pageId = body.entry?.[0]?.id;

    if (body.entry?.[0]?.messaging || field === 'messages') {
      await handleDM(body, pageId);
    } else if (field === 'comments') {
      await handleComment(body, pageId);
    }
  } catch (e) {
    channelLog.error({ channel: 'instagram' }, `Webhook error: ${e}`);
  }

  return new Response('OK', { status: 200 });
}

async function handleDM(body: any, pageId: string) {
  const event = normalizeInstagramDMInbound(body);
  if (!event || !event.text) return;

  const tenant = await getTenantByInstagramPageId(pageId || event.accountId);
  if (!tenant) return;
  if (!isChannelEnabled(tenant, 'instagram')) return;

  const pageToken = tenant.instagramToken ? decrypt(tenant.instagramToken) : null;
  if (!pageToken) return;

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
      await sendInstagramMessage(from, tenant.welcomeMessage, tenant.instagramPageId!, pageToken);
      await saveAIMessage(from, tenant.welcomeMessage, tenant.id, 'open', true, 'instagram');
    }
  } catch {}

  let status = await getConversationStatus(from, tenant.id);
  if (status === 'closed') status = 'open';
  await saveUserMessage(from, textBody, tenant.id, status, 'instagram');

  if (status !== 'open' && status !== 'ai') return;

  // Automation
  const automation = await checkAutomationMatch(textBody, tenant.id);
  if (automation) {
    await sendInstagramMessage(from, automation.responseText, tenant.instagramPageId!, pageToken);
    await saveAIMessage(from, automation.responseText, tenant.id, status, false, 'instagram');
    return;
  }

  // AI limits
  let canUseAI = true;
  try { canUseAI = await verifyAiLimits(tenant.id); } catch {}
  if (!canUseAI) {
    const msg = 'Seu limite de respostas da IA foi atingido neste mês.';
    await sendInstagramMessage(from, msg, tenant.instagramPageId!, pageToken);
    await saveAIMessage(from, msg, tenant.id, status, false, 'instagram');
    return;
  }

  let customerContext = '';
  try { customerContext = await buildCustomerContext(tenant.id, from); } catch {}
  const detectedName = extractNameFromText(textBody);
  if (detectedName) upsertCustomerMemory(tenant.id, from, { name: detectedName }).catch(() => {});

  const aiResponse = await generateAIResponse(textBody, tenant.openaiKey || '', tenant.aiPrompt || '', tenant.businessHours || '', tenant.id, from, customerContext);
  await saveAIMessage(from, aiResponse, tenant.id, status, true, 'instagram');

  try {
    await sendInstagramMessage(from, aiResponse, tenant.instagramPageId!, pageToken);
    channelLog.info({ channel: 'instagram', tenantId: tenant.id, from: mask(from) }, 'DM sent');
  } catch (e: any) {
    channelLog.error({ channel: 'instagram', tenantId: tenant.id }, `Send failed: ${e?.message}`);
  }
}

async function handleComment(body: any, pageId: string) {
  const change = body.entry?.[0]?.changes?.[0]?.value;
  if (!change) return;
  const tenant = await getTenantByInstagramPageId(pageId);
  if (!tenant || !isChannelEnabled(tenant, 'instagram')) return;
  await processInstagramComment(tenant, change).catch((e) =>
    channelLog.error({ channel: 'instagram', tenantId: tenant.id }, `Comment error: ${e?.message}`),
  );
}
