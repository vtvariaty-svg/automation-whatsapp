import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { isRateLimited, getClientIp } from '@/lib/webhookRateLimit';
import { normalizeFacebookDMInbound } from '@/lib/channels/normalizer';
import { isChannelEnabled } from '@/lib/channels/featureFlags';
import { channelLog } from '@/lib/channels/logger';
import { sendFacebookMessage } from '@/src/services/facebookService';
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

async function getTenantByFacebookPageId(pageId: string) {
  return prisma.tenant.findFirst({ where: { facebookPageId: pageId } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = process.env.FACEBOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
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
    channelLog.warn({ channel: 'facebook' }, 'Invalid HMAC');
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody);
    if (body.object !== 'page') return new Response('OK', { status: 200 });

    const event = normalizeFacebookDMInbound(body);
    if (!event || !event.text) return new Response('OK', { status: 200 });

    const tenant = await getTenantByFacebookPageId(event.accountId);
    if (!tenant || !isChannelEnabled(tenant, 'facebook')) return new Response('OK', { status: 200 });

    const pageToken = tenant.facebookToken ? decrypt(tenant.facebookToken) : null;
    if (!pageToken) return new Response('OK', { status: 200 });

    const { from, text: textBody, messageId } = event;

    // Idempotency
    if (messageId) {
      try {
        await prisma.processedMessage.create({ data: { messageId } });
        prisma.processedMessage.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 86400000) } } }).catch(() => {});
      } catch {
        return new Response('OK', { status: 200 });
      }
    }

    channelLog.info({ channel: 'facebook', tenantId: tenant.id, from: mask(from) }, 'Message received');

    try {
      const history = await getConversationHistory(from, tenant.id);
      if (history.length === 0 && tenant.welcomeMessage) {
        await sendFacebookMessage(from, tenant.welcomeMessage, tenant.facebookPageId!, pageToken);
        await saveAIMessage(from, tenant.welcomeMessage, tenant.id, 'open', true, 'facebook');
      }
    } catch {}

    let status = await getConversationStatus(from, tenant.id);
    if (status === 'closed') status = 'open';
    await saveUserMessage(from, textBody, tenant.id, status, 'facebook');
    if (status !== 'open' && status !== 'ai') return new Response('OK', { status: 200 });

    const automation = await checkAutomationMatch(textBody, tenant.id);
    if (automation) {
      await sendFacebookMessage(from, automation.responseText, tenant.facebookPageId!, pageToken);
      await saveAIMessage(from, automation.responseText, tenant.id, status, false, 'facebook');
      return new Response('OK', { status: 200 });
    }

    let canUseAI = true;
    try { canUseAI = await verifyAiLimits(tenant.id); } catch {}
    if (!canUseAI) {
      const msg = 'Seu limite de respostas da IA foi atingido neste mês.';
      await sendFacebookMessage(from, msg, tenant.facebookPageId!, pageToken);
      await saveAIMessage(from, msg, tenant.id, status, false, 'facebook');
      return new Response('OK', { status: 200 });
    }

    let customerContext = '';
    try { customerContext = await buildCustomerContext(tenant.id, from); } catch {}
    const detectedName = extractNameFromText(textBody);
    if (detectedName) upsertCustomerMemory(tenant.id, from, { name: detectedName }).catch(() => {});

    const aiResponse = await generateAIResponse(textBody, tenant.openaiKey || '', tenant.aiPrompt || '', tenant.businessHours || '', tenant.id, from, customerContext);
    await saveAIMessage(from, aiResponse, tenant.id, status, true, 'facebook');

    try {
      await sendFacebookMessage(from, aiResponse, tenant.facebookPageId!, pageToken);
    } catch (e: any) {
      channelLog.error({ channel: 'facebook', tenantId: tenant.id }, `Send failed: ${e?.message}`);
    }
  } catch (e) {
    channelLog.error({ channel: 'facebook' }, `Webhook error: ${e}`);
  }

  return new Response('OK', { status: 200 });
}
