import { createHmac, timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { decrypt } from '@/lib/utils/crypto';
import { isRateLimited, getClientIp } from '@/lib/webhookRateLimit';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppInbound } from '@/lib/channels/normalizer';
import { isChannelEnabled } from '@/lib/channels/featureFlags';
import { channelLog } from '@/lib/channels/logger';
// @ts-ignore - Importing from JS/untyped service file
import { generateAIResponse } from '@/src/services/aiService';
// @ts-ignore - Importing from JS/untyped service file
import { sendWhatsAppMessage } from '@/src/services/whatsappService';
// @ts-ignore - Importing from JS/untyped service file
import { saveUserMessage, saveAIMessage, getConversationStatus, IdentityContext, isFirstInboundCustomerMessage } from '@/src/services/conversationService';
import { getTenantByPhoneId } from '@/src/services/tenantService';
import { buildCustomerContext, upsertCustomerMemory, extractNameFromText } from '@/src/services/customerMemoryService';
import { checkAutomationMatch, sendTemplateMessage } from '@/src/services/automationService';
import { verifyAiLimits } from '@/src/services/billingService';
import { handleAppointmentMessage } from '@/src/services/appointmentBookingService';
import { resolveWhatsAppIdentity } from '@/lib/services/identityResolver';
import { runCommercialOrchestrator } from '@/src/services/commercialOrchestratorService';
import { detectExplicitRequest, detectAiLowConfidence, executeHandoff } from '@/src/services/handoffService';
import { sendAndSave } from '@/lib/webhook/outboundSender';

// ── Utilities ────────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****';
  return `****${phone.slice(-4)}`;
}

function substitutePlaceholders(
  template: string,
  vars: { customerName?: string | null; tenantName?: string | null }
): string {
  return template
    .replace(/\[Nome do Cliente\]/gi, vars.customerName?.trim() || 'Cliente')
    .replace(/\[Nome da Empresa\]/gi, vars.tenantName?.trim() || 'nossa empresa')
    .replace(/\[Seu Nome\]/gi, vars.tenantName?.trim() || 'Assistente');
}

/** Returns the phone_number_id to use when sending outbound replies. */
function resolveReplyPhoneId(tenant: any): string | undefined {
  return tenant.whatsappConnection?.phoneNumberId || tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
}

// ── HMAC validation ──────────────────────────────────────────────────────────

/**
 * Validates the HMAC-SHA256 signature sent by Meta.
 * Returns true if valid, or if WHATSAPP_APP_SECRET is not configured (dev mode).
 */
async function verifyMetaSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.warn('[Webhook] WHATSAPP_APP_SECRET não configurado — validação HMAC desativada');
    return true;
  }
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const receivedHex = signatureHeader.slice('sha256='.length);
  const expectedHex = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  try {
    return timingSafeEqual(Buffer.from(receivedHex, 'hex'), Buffer.from(expectedHex, 'hex'));
  } catch {
    // Buffers of different length throw — signature is invalid.
    return false;
  }
}

// ── Idempotency ───────────────────────────────────────────────────────────────

/**
 * Attempts to acquire an idempotency lock for the given messageId.
 *
 * Strategy: optimistic lock via unique-constraint INSERT.
 *   - 'acquired'  → record created, safe to process.
 *   - 'duplicate' → already locked (processed or in-flight), caller should return 200 immediately.
 *
 * NOTE: The lock is acquired AFTER lightweight pre-checks (tenant resolution, channel guard,
 * self-echo guard) so that transient DB failures during those steps do not permanently consume
 * the messageId — Meta can still retry and the message will be processed.
 *
 * Lazy cleanup of records older than 7 days is fired non-blocking after acquisition.
 */
async function acquireIdempotencyLock(messageId: string): Promise<'acquired' | 'duplicate'> {
  try {
    await prisma.processedMessage.create({ data: { messageId } });
    // Non-blocking lazy cleanup of stale records.
    prisma.processedMessage
      .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
      .catch(() => {});
    return 'acquired';
  } catch {
    // Unique constraint violation = already processed or concurrent duplicate.
    return 'duplicate';
  }
}

// ── Echo coexistence handler ──────────────────────────────────────────────────

/**
 * Handles smb_message_echoes: messages sent from the business's own WhatsApp app.
 * These are outbound echoes, not customer messages — save to history without triggering AI.
 * Returns a Response if this event was an echo, or null if normal processing should continue.
 */
async function handleCoexistenceEcho(body: any): Promise<Response | null> {
  const changeField = body.entry?.[0]?.changes?.[0]?.field;
  if (changeField !== 'smb_message_echoes') return null;

  const value = body.entry?.[0]?.changes?.[0]?.value;
  const phoneId = value?.metadata?.phone_number_id;
  const msg = value?.messages?.[0];

  if (phoneId && msg?.type === 'text' && msg?.to && msg?.text?.body) {
    const tenant = await getTenantByPhoneId(phoneId);
    if (tenant && isChannelEnabled(tenant, 'whatsapp')) {
      try {
        await saveAIMessage(msg.to, msg.text.body, tenant.id, 'open', false, 'whatsapp');
        console.log(`[Webhook][coexistence] Echo do celular salvo — para: ${maskPhone(msg.to)}`);
      } catch (echoErr) {
        console.error('[Webhook][coexistence] Erro ao salvar echo:', echoErr);
      }
    }
  }
  return new Response('OK', { status: 200 });
}

// ── AI context builder ────────────────────────────────────────────────────────

/**
 * Builds the full context string for AI generation:
 * customer memory + active product catalog.
 * All failures are best-effort — returns whatever context was built so far.
 */
async function buildAIContext(tenantId: string, from: string): Promise<string> {
  let context = '';

  try {
    context = await buildCustomerContext(tenantId, from);
  } catch (memErr) {
    console.error('[Webhook] Erro ao carregar memória do cliente (continuando sem contexto):', memErr);
  }

  try {
    const catalogItems = await prisma.product.findMany({
      where: { tenantId, active: true },
      select: { name: true, description: true, price: true, currency: true, category: true },
      take: 30,
    });
    if (catalogItems.length > 0) {
      const catalogLines = catalogItems.map((p) => {
        const price = p.price > 0 ? ` — R$${p.price.toFixed(2)}` : '';
        const cat = p.category ? ` [${p.category}]` : '';
        const desc = p.description ? `: ${p.description}` : '';
        return `• ${p.name}${cat}${price}${desc}`;
      }).join('\n');
      context = `${context ? context + '\n\n' : ''}PRODUTOS DISPONÍVEIS NO CATÁLOGO:\n${catalogLines}`;
    }
  } catch (catErr) {
    console.error('[Webhook] Erro ao carregar catálogo (continuando sem catálogo):', catErr);
  }

  return context;
}

// ── Branch handlers ───────────────────────────────────────────────────────────

/**
 * Handles the welcome message branch (first inbound message from a customer).
 * Returns true if the welcome was triggered (caller should stop processing).
 */
async function handleWelcomeBranch(
  tenant: any,
  from: string,
  status: string,
  isFirstInbound: boolean,
  resolvedIdentityContext: IdentityContext | undefined
): Promise<boolean> {
  const welcomeTemplate = tenant.welcomeMessage?.trim() || null;

  channelLog.info({
    channel: 'whatsapp',
    tenantId: tenant.id,
    customerPhone: maskPhone(from),
    source: isFirstInbound && welcomeTemplate ? 'welcome_message' : isFirstInbound ? 'fallback_default' : 'ai_response',
    firstContactDetected: isFirstInbound,
    customWelcomeExists: !!welcomeTemplate,
  }, '[Webhook] First-interaction check');

  if (!isFirstInbound || !welcomeTemplate) return false;

  let customerName: string | null = null;
  if (resolvedIdentityContext?.contactId) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: resolvedIdentityContext.contactId },
        select: { name: true },
      });
      customerName = contact?.name?.trim() || null;
    } catch { /* best-effort */ }
  }

  const resolvedWelcome = substitutePlaceholders(welcomeTemplate, {
    customerName,
    tenantName: (tenant as any).name ?? null,
  });

  const result = await sendAndSave({
    to: from,
    message: resolvedWelcome,
    phoneId: resolveReplyPhoneId(tenant),
    token: tenant.whatsappToken,
    tenantId: tenant.id,
    status,
    aiGenerated: true,
    channel: 'whatsapp',
    identity: resolvedIdentityContext,
    logContext: { source: 'welcome_message', hasCustomerName: !!customerName },
  });

  channelLog.info({
    channel: 'whatsapp',
    tenantId: tenant.id,
    customerPhone: maskPhone(from),
    source: 'welcome_message',
    sent: result === 'sent',
    hasCustomerName: !!customerName,
  }, '[Webhook] Welcome message sent — AI skipped');

  if (result === 'send_failed') {
    // Welcome delivery failed — do NOT silence the customer.
    // Return false so processInboundMessage continues to the AI/automation pipeline.
    channelLog.warn({
      channel: 'whatsapp',
      tenantId: tenant.id,
      customerPhone: maskPhone(from),
      source: 'welcome_message',
    }, '[Webhook] Welcome message failed to send — falling through to AI pipeline');
    return false;
  }

  return true; // welcome sent successfully — stop pipeline
}

/**
 * Handles the automation branch (keyword-triggered rules).
 * Returns true if an automation was matched and handled (caller should stop processing).
 */
async function handleAutomationBranch(
  tenant: any,
  from: string,
  textBody: string,
  status: string,
  resolvedIdentityContext: IdentityContext | undefined
): Promise<boolean> {
  const automation = await checkAutomationMatch(textBody, tenant.id);
  if (!automation) return false;

  console.log(`[Webhook] Automação "${automation.name}" acionada para ${maskPhone(from)}`);
  const phoneId = resolveReplyPhoneId(tenant);

  // ── Extended actionType handlers ─────────────────────────────────────────
  if (automation.actionType) {
    const actionCfg = (automation.actionConfig ?? {}) as Record<string, any>;

    if (automation.actionType === 'handoff_human') {
      try {
        await executeHandoff({
          tenantId: tenant.id,
          customerPhone: from,
          channel: 'whatsapp',
          triggerReason: 'explicit_request',
          lastMessage: textBody,
          contactId: resolvedIdentityContext?.contactId,
        });
      } catch (hErr) {
        console.error('[Webhook] Handoff via automation error:', hErr);
      }
      return true;
    }

    if (automation.actionType === 'send_external_link' && actionCfg.url) {
      const msg = actionCfg.message ? `${actionCfg.message}\n${actionCfg.url}` : actionCfg.url;
      await sendAndSave({
        to: from, message: msg, phoneId, token: tenant.whatsappToken,
        tenantId: tenant.id, status, aiGenerated: false,
        logContext: { source: 'automation_external_link', automationName: automation.name },
      });
      return true;
    }

    if (automation.actionType === 'send_checkout' && actionCfg.productId) {
      const contactId = resolvedIdentityContext?.contactId;
      if (contactId) {
        try {
          const { generateCheckoutUrl, buildCheckoutMessage } = await import('@/lib/services/checkoutService');
          const { checkoutUrl } = await generateCheckoutUrl(tenant.id, actionCfg.productId, contactId);
          const product = await prisma.product.findUnique({ where: { id: actionCfg.productId } });
          const msg = buildCheckoutMessage(
            product?.name ?? 'Produto',
            product?.price ?? 0,
            product?.currency ?? 'BRL',
            checkoutUrl,
            actionCfg.ctaText
          );
          await sendAndSave({
            to: from, message: msg, phoneId, token: tenant.whatsappToken,
            tenantId: tenant.id, status, aiGenerated: false,
            logContext: { source: 'automation_checkout', automationName: automation.name },
          });
          return true;
        } catch (checkoutErr) {
          console.error('[Webhook] Automation send_checkout error:', checkoutErr);
          // Fall through to responseType handling below.
        }
      }
    }
  }

  // ── ResponseType handlers (template or plain text) ────────────────────────
  if (automation.responseType === 'template') {
    // Phase 1: send the template.
    // The fallback to plain text is ONLY triggered when the send itself fails.
    // A save failure after a successful send must NOT re-send — that would duplicate
    // the message from the customer's perspective.
    let templateSent = false;
    try {
      await sendTemplateMessage(from, automation.responseText, phoneId!, tenant.whatsappToken!);
      templateSent = true;
    } catch (tplErr) {
      console.error(`[Webhook] Falha ao enviar template "${automation.responseText}":`, tplErr);
      // Fallback fires only when the SEND failed — no template was delivered.
      await sendAndSave({
        to: from, message: automation.responseText, phoneId, token: tenant.whatsappToken,
        tenantId: tenant.id, status, aiGenerated: false,
        logContext: { source: 'automation_template_fallback', automationName: automation.name },
      });
    }

    // Phase 2: persist the marker (only reached when template was sent).
    // If this fails, log for reconciliation — no re-send.
    if (templateSent) {
      try {
        await saveAIMessage(from, `[Template: ${automation.responseText}]`, tenant.id, status, false);
      } catch (saveErr: any) {
        channelLog.error({
          channel: 'whatsapp' as any,
          tenantId: tenant.id,
          error: saveErr?.message ?? String(saveErr),
          automationName: automation.name,
        }, '[Webhook] Template enviado mas marcador não salvo — reconciliação manual necessária');
      }
    }
  } else {
    await sendAndSave({
      to: from, message: automation.responseText, phoneId, token: tenant.whatsappToken,
      tenantId: tenant.id, status, aiGenerated: false,
      logContext: { source: 'automation_text', automationName: automation.name },
    });
  }

  return true;
}

// ── Main inbound message processor ───────────────────────────────────────────

/**
 * Processes a single inbound customer text message after all guards have passed
 * (idempotency, tenant resolution, channel check, self-echo guard).
 *
 * Decision tree (first branch that fires wins):
 *   1. Welcome message (first ever contact)
 *   2. Status gate (human/waiting → ignore AI)
 *   3. Explicit handoff request
 *   4. Keyword automation
 *   5. Appointment booking
 *   6. Commercial orchestrator
 *   7. AI limit guard
 *   8. AI generation (default path)
 */
async function processInboundMessage(
  tenant: any,
  from: string,
  textBody: string,
  resolvedIdentityContext: IdentityContext | undefined
): Promise<void> {
  const phoneId = resolveReplyPhoneId(tenant);

  // isFirstInbound MUST be checked BEFORE saveUserMessage because
  // isFirstInboundCustomerMessage counts existing inbound records.
  const isFirstInbound = await isFirstInboundCustomerMessage(tenant.id, from, 'whatsapp');

  let status = await getConversationStatus(from, tenant.id);
  if (status === 'closed') status = 'open';

  // Persist the inbound message unconditionally.
  await saveUserMessage(from, textBody, tenant.id, status, 'whatsapp', resolvedIdentityContext);

  // ── 1. Welcome message ────────────────────────────────────────────────────
  const welcomeTriggered = await handleWelcomeBranch(
    tenant, from, status, isFirstInbound, resolvedIdentityContext
  );
  if (welcomeTriggered) return;

  // ── 2. Status gate ────────────────────────────────────────────────────────
  if (status !== 'open' && status !== 'ai') {
    console.log(`[Webhook] Conversa ${maskPhone(from)} em status "${status}" — IA ignorada`);
    return;
  }

  // ── 3. Explicit handoff request ───────────────────────────────────────────
  if (detectExplicitRequest(textBody)) {
    try {
      const handoffResult = await executeHandoff({
        tenantId: tenant.id,
        customerPhone: from,
        channel: 'whatsapp',
        triggerReason: 'explicit_request',
        lastMessage: textBody,
        contactId: resolvedIdentityContext?.contactId,
      });
      if (handoffResult.triggered && handoffResult.conversationSetToHuman) return;
    } catch (hErr) {
      console.error('[Webhook] Handoff explicit_request error:', hErr);
    }
  }

  // ── 4. Keyword automation ─────────────────────────────────────────────────
  const automationHandled = await handleAutomationBranch(
    tenant, from, textBody, status, resolvedIdentityContext
  );
  if (automationHandled) return;

  // ── 5. Appointment booking ────────────────────────────────────────────────
  try {
    const conv = await prisma.conversation.findFirst({
      where: { tenantId: tenant.id, customerPhone: from },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true },
    });
    const apptReply = await handleAppointmentMessage(tenant.id, from, textBody, conv?.id);
    if (apptReply) {
      await sendAndSave({
        to: from, message: apptReply, phoneId, token: tenant.whatsappToken,
        tenantId: tenant.id, status, aiGenerated: false, channel: 'whatsapp',
        logContext: { source: 'appointment' },
      });
      return;
    }
  } catch (apptErr) {
    console.error('[Webhook] Erro no fluxo de agendamentos (continuando para IA):', apptErr);
  }

  // ── 6. Commercial orchestrator ────────────────────────────────────────────
  try {
    const orchDecision = await runCommercialOrchestrator(
      tenant.id, from, textBody, resolvedIdentityContext?.contactId, 'whatsapp'
    );

    if (orchDecision.action !== 'none' && orchDecision.message) {
      console.log(`[Webhook] Orchestrator: action=${orchDecision.action} reason=${orchDecision.reason}`);

      if (orchDecision.action === 'handoff_human') {
        await executeHandoff({
          tenantId: tenant.id,
          customerPhone: from,
          channel: 'whatsapp',
          triggerReason: 'explicit_request',
          lastMessage: textBody,
          contactId: resolvedIdentityContext?.contactId,
        });
        return;
      }

      await sendAndSave({
        to: from,
        message: orchDecision.message,
        phoneId,
        token: tenant.whatsappToken,
        tenantId: tenant.id,
        status,
        aiGenerated: false,
        channel: 'whatsapp',
        identity: resolvedIdentityContext,
        logContext: { source: 'commercial_orchestrator', action: orchDecision.action },
      });
      return;
    }
  } catch (orchErr) {
    console.error('[Webhook] Commercial orchestrator error (falling through to AI):', orchErr);
  }

  // ── 7. AI limit guard ─────────────────────────────────────────────────────
  let canUseAI = true;
  try {
    canUseAI = await verifyAiLimits(tenant.id);
  } catch (e) {
    console.error('[Webhook] Erro ao verificar limites de IA (permitindo por segurança):', e);
  }

  if (!canUseAI) {
    console.log(`[Webhook] Limite de IA atingido — tenant: ${tenant.id}`);
    const limitMessage = 'Seu limite de respostas da IA foi atingido neste mês. Para continuar utilizando o atendimento automático, atualize seu plano.';
    await sendAndSave({
      to: from, message: limitMessage, phoneId, token: tenant.whatsappToken,
      tenantId: tenant.id, status, aiGenerated: false, channel: 'whatsapp',
      logContext: { source: 'ai_limit' },
    });
    return;
  }

  // ── 8. AI generation (default path) ──────────────────────────────────────

  // Detect customer name from message and persist to memory (fire-and-forget).
  const detectedName = extractNameFromText(textBody);
  if (detectedName) {
    upsertCustomerMemory(tenant.id, from, { name: detectedName }).catch((e) =>
      console.error('[Webhook] Erro ao salvar nome na memória:', e)
    );
  }

  const customerContext = await buildAIContext(tenant.id, from);

  const aiResponse = await generateAIResponse(
    textBody,
    tenant.openaiKey || '',
    tenant.aiPrompt || '',
    tenant.businessHours || '',
    tenant.id,
    from,
    customerContext
  );
  console.log(`[Webhook] IA respondeu para ${maskPhone(from)} — ${aiResponse?.length ?? 0} chars`);

  // Send-first, save-after (consistent outbound rule).
  await sendAndSave({
    to: from,
    message: aiResponse,
    phoneId,
    token: tenant.whatsappToken,
    tenantId: tenant.id,
    status,
    aiGenerated: true,
    channel: 'whatsapp',
    identity: resolvedIdentityContext,
    logContext: { source: 'ai_response' },
  });

  // ── ai_low_confidence handoff (non-blocking) ──────────────────────────────
  if (detectAiLowConfidence(aiResponse)) {
    executeHandoff({
      tenantId: tenant.id,
      customerPhone: from,
      channel: 'whatsapp',
      triggerReason: 'ai_low_confidence',
      lastMessage: textBody,
      contactId: resolvedIdentityContext?.contactId,
    }).catch((hErr) => console.error('[Webhook] Handoff ai_low_confidence error:', hErr));
  }
}

// ── Delivery status handler ───────────────────────────────────────────────────

/**
 * Status progression order — used to prevent downgrade (e.g. read → delivered).
 * 'failed' is always terminal and overrides any current status.
 */
const STATUS_ORDER = ['pending', 'accepted', 'sent', 'delivered', 'read'];

function shouldUpgradeStatus(current: string, next: string): boolean {
  if (next === 'failed') return true; // always record failures
  return STATUS_ORDER.indexOf(next) > STATUS_ORDER.indexOf(current);
}

function mapMetaDeliveryStatus(statusType: string): string | null {
  switch (statusType) {
    case 'sent':      return 'sent';       // Meta confirmed send to device
    case 'delivered': return 'delivered';  // Device received
    case 'read':      return 'read';       // User opened
    case 'failed':    return 'failed';
    default:          return null;         // 'deleted', etc. — ignore
  }
}

function extractDeliveryError(raw: any): string | null {
  try {
    const errors = raw?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.errors;
    if (!errors?.length) return 'Falha de entrega não especificada';
    const e = errors[0];
    const code = e.code ? `[${e.code}] ` : '';
    const title = e.title || e.message || 'Erro desconhecido';
    return `${code}${title}`.slice(0, 500);
  } catch {
    return 'Falha de entrega';
  }
}

/**
 * Processes Meta delivery-status webhook events (sent/delivered/read/failed).
 * Correlates via metaMessageId (wamid) stored at send time in TemplateBroadcastRecipient.
 * Non-throwing — all errors are logged and swallowed so the webhook always returns 200.
 */
async function handleDeliveryStatus(
  event: any,
  tenantId: string
): Promise<void> {
  const { messageId: wamid, statusType, recipientId } = event;
  if (!wamid || !statusType) return;

  const newStatus = mapMetaDeliveryStatus(statusType);
  if (!newStatus) return; // ignore unrecognised status types

  try {
    const recipient = await prisma.templateBroadcastRecipient.findFirst({
      where: { metaMessageId: wamid },
      include: { broadcast: { select: { tenantId: true } } },
    });

    if (!recipient) {
      // Not a broadcast recipient — individual template or unknown message; silently ignore
      return;
    }

    // Tenant ownership guard
    if (recipient.broadcast.tenantId !== tenantId) {
      console.warn(`[Webhook][delivery] wamid ${wamid.slice(0, 20)} tenantId mismatch — ignored`);
      return;
    }

    if (!shouldUpgradeStatus(recipient.status, newStatus)) return;

    const errorMsg = newStatus === 'failed' ? extractDeliveryError(event.raw) : undefined;

    await prisma.templateBroadcastRecipient.update({
      where: { id: recipient.id },
      data: {
        status: newStatus,
        ...(errorMsg !== undefined ? { errorMessage: errorMsg } : {}),
      },
    });

    if (newStatus === 'failed') {
      console.warn(
        `[Webhook][delivery] Cold outbound failed — phone:${maskPhone(recipientId ?? '')} ` +
        `broadcast:${recipient.broadcastId.slice(0, 8)} error:${errorMsg}`
      );
    }
  } catch (err) {
    console.error('[Webhook][delivery] Error updating broadcast recipient status:', err);
  }
}

// ── GET: webhook verification (Meta handshake) ────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ── POST: main webhook ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── 1. Rate limiting ──────────────────────────────────────────────────────
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    console.warn(`[Webhook] Rate limit excedido para IP: ${clientIp}`);
    return new Response('Too Many Requests', { status: 429 });
  }

  // ── 2. Read raw body (must be read as text before JSON parse for HMAC) ────
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // ── 3. HMAC validation ────────────────────────────────────────────────────
  const signature = (req.headers as any).get?.('x-hub-signature-256') ?? null;
  console.log('[Webhook] x-hub-signature-256 recebido:', signature ? signature.slice(0, 20) + '...' : 'AUSENTE');
  console.log('[Webhook] rawBody length:', rawBody.length, '| primeiros 100 chars:', rawBody.slice(0, 100));

  if (!await verifyMetaSignature(rawBody, signature)) {
    console.warn('[Webhook] Assinatura HMAC inválida — requisição rejeitada');
    return new Response('Forbidden', { status: 403 });
  }

  // ── 4. Parse JSON ─────────────────────────────────────────────────────────
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  console.log(`[Webhook] Recebido — entries: ${body.entry?.length ?? 0}`);

  // ── 5. Echo coexistence (smb_message_echoes) ──────────────────────────────
  const echoResponse = await handleCoexistenceEcho(body);
  if (echoResponse) return echoResponse;

  // ── 6. Normalize inbound event ────────────────────────────────────────────
  const event = normalizeWhatsAppInbound(body);
  if (!event) return new Response('OK', { status: 200 });

  const { accountId: phoneId, from, text: textBody, messageId } = event;

  // ── Pre-processing checks (run BEFORE acquiring the idempotency lock) ─────
  // If any of these fail (e.g., transient DB error on getTenantByPhoneId), the
  // messageId is NOT consumed — Meta will retry and the message will be processed.

  // 7. Fast-path deduplication (read-only check before any heavy work)
  if (messageId) {
    const existing = await prisma.processedMessage.findUnique({ where: { messageId } }).catch(() => null);
    if (existing) {
      console.warn(`[Webhook] Mensagem duplicada ignorada (early check): ${messageId}`);
      return new Response('OK', { status: 200 });
    }
  }

  // 8. Resolve tenant
  const tenant = await getTenantByPhoneId(phoneId);
  if (!tenant) {
    channelLog.warn({ channel: 'whatsapp' }, `Tenant não encontrado para phoneId: ${phoneId}`);
    return new Response('OK', { status: 200 });
  }

  // 9. Channel enabled?
  if (!isChannelEnabled(tenant, 'whatsapp')) {
    channelLog.info({ channel: 'whatsapp', tenantId: tenant.id }, 'Canal WhatsApp desativado');
    return new Response('OK', { status: 200 });
  }

  // 10. Decrypt tokens — normalize onto tenant.whatsappToken so all downstream
  //     code works transparently regardless of whether credentials come from the
  //     legacy fields or the embedded-signup WhatsAppConnection record.
  if (tenant.whatsappToken) {
    tenant.whatsappToken = decrypt(tenant.whatsappToken);
  } else if (tenant.whatsappConnection?.accessToken) {
    // Embedded-signup only: expose decrypted token in the legacy field so
    // every send call below can use tenant.whatsappToken without change.
    tenant.whatsappToken = decrypt(tenant.whatsappConnection.accessToken);
  }

  // 10.5 Delivery status events — handle and short-circuit (no inbound processing needed)
  if (event.isStatus) {
    await handleDeliveryStatus(event, tenant.id);
    return new Response('OK', { status: 200 });
  }

  // 11. Identity resolution (best-effort, silent — never blocks processing)
  let resolvedIdentityContext: IdentityContext | undefined;
  try {
    const resolved = await resolveWhatsAppIdentity(tenant.id, event);
    if (resolved) resolvedIdentityContext = { contactId: resolved.id, confidence: 'high' };
  } catch (err) {
    channelLog.error(
      { channel: 'whatsapp', tenantId: tenant.id, error: err },
      '[Webhook] Falha silenciosa no IdentityResolver Engine'
    );
  }

  // 12. Self-echo guard (bot's own number echoed as inbound)
  const botPhone = tenant.phone?.replace(/\D/g, '') ?? null;
  const senderPhone = from?.replace(/\D/g, '') ?? null;
  if (botPhone && senderPhone && senderPhone === botPhone) {
    channelLog.info(
      { channel: 'whatsapp', tenantId: tenant.id },
      `Echo/self-message ignorado: ${maskPhone(from)}`
    );
    return new Response('OK', { status: 200 });
  }

  if (!textBody) return new Response('OK', { status: 200 });

  // ── 13. Acquire idempotency lock ──────────────────────────────────────────
  // Acquired HERE — after all lightweight guards — so that transient failures
  // above do not permanently consume the messageId.
  if (messageId) {
    const lockResult = await acquireIdempotencyLock(messageId);
    if (lockResult === 'duplicate') {
      console.warn(`[Webhook] Mensagem duplicada ignorada (lock): ${messageId}`);
      return new Response('OK', { status: 200 });
    }
  }

  // ── 14. Business logic processing ────────────────────────────────────────
  console.log(`[Webhook] Processando mensagem de ${maskPhone(from)} — tenant: ${tenant.id}`);
  try {
    await processInboundMessage(tenant, from, textBody, resolvedIdentityContext);
  } catch (err) {
    // The idempotency lock is intentionally kept even on failure — releasing it
    // would risk duplicate sends if processing was partially completed
    // (e.g., user message already saved, reply already sent).
    // The operator should use the messageId below to investigate.
    channelLog.error({
      channel: 'whatsapp',
      tenantId: tenant.id,
      messageId: messageId ?? 'unknown',
      customerPhone: maskPhone(from),
      error: err instanceof Error ? err.message : String(err),
    }, '[Webhook] CRÍTICO: Falha no processamento — investigar messageId nos logs');
    // Return 200 to Meta: we do not want infinite retries on a partially-processed message.
  }

  return new Response('OK', { status: 200 });
}
