import { createHmac, timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { decrypt } from '@/lib/utils/crypto';
import { isRateLimited, getClientIp } from '@/lib/webhookRateLimit';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppInbound } from '@/lib/channels/normalizer';
import { isChannelEnabled } from '@/lib/channels/featureFlags';
import { channelLog } from '@/lib/channels/logger';
// @ts-ignore - Importing from JS file
import { generateAIResponse } from "@/src/services/aiService";
// @ts-ignore - Importing from JS file
import { sendWhatsAppMessage } from "@/src/services/whatsappService";
// @ts-ignore - Importing from JS file
import { saveUserMessage, saveAIMessage, getConversationHistory, getConversationStatus, IdentityContext, isFirstInboundCustomerMessage } from "@/src/services/conversationService";
import { getTenantByPhoneId } from "@/src/services/tenantService";
import { buildCustomerContext, upsertCustomerMemory, extractNameFromText } from "@/src/services/customerMemoryService";
import { checkAutomationMatch } from "@/src/services/automationService";
import { sendTemplateMessage } from "@/src/services/automationService";
import { verifyAiLimits } from "@/src/services/billingService";
import { handleAppointmentMessage } from "@/src/services/appointmentBookingService";
import { resolveWhatsAppIdentity } from "@/lib/services/identityResolver";
import { runCommercialOrchestrator } from "@/src/services/commercialOrchestratorService";
import { detectExplicitRequest, detectAiLowConfidence, executeHandoff } from "@/src/services/handoffService";

// Mascara todos os dígitos exceto os últimos 4 para logs seguros
function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****';
  return `****${phone.slice(-4)}`;
}

/**
 * Valida a assinatura HMAC-SHA256 enviada pela Meta.
 * Retorna true se válida ou se WHATSAPP_APP_SECRET não estiver configurado (modo dev).
 */
async function verifyMetaSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn('[Webhook] WHATSAPP_APP_SECRET não configurado — validação HMAC desativada');
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const receivedHex = signatureHeader.slice('sha256='.length);
  const expectedHex = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  // timingSafeEqual previne timing attacks
  try {
    return timingSafeEqual(Buffer.from(receivedHex, 'hex'), Buffer.from(expectedHex, 'hex'));
  } catch {
    // Buffers de tamanho diferente lançam erro — assinatura inválida
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verify_token) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  // 1. Rate limiting por IP
  const clientIp = getClientIp(req);
  if (isRateLimited(clientIp)) {
    console.warn(`[Webhook] Rate limit excedido para IP: ${clientIp}`);
    return new Response('Too Many Requests', { status: 429 });
  }

  // 2. Ler body como texto para validação HMAC antes de parsear
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // 3. Validar assinatura HMAC da Meta
  const signature = (req.headers as any).get?.('x-hub-signature-256') ?? null;
  console.log('[Webhook] x-hub-signature-256 recebido:', signature ? signature.slice(0, 20) + '...' : 'AUSENTE');
  console.log('[Webhook] rawBody length:', rawBody.length, '| primeiros 100 chars:', rawBody.slice(0, 100));
  const signatureValid = await verifyMetaSignature(rawBody, signature);
  if (!signatureValid) {
    console.warn('[Webhook] Assinatura HMAC inválida — requisição rejeitada');
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody);

    console.log(`[Webhook] Recebido — entries: ${body.entry?.length ?? 0}`);

    // Coexistência: processar mensagens enviadas via app do celular (smb_message_echoes)
    const changeField = body.entry?.[0]?.changes?.[0]?.field;
    if (changeField === 'smb_message_echoes') {
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

    const event = normalizeWhatsAppInbound(body);
    if (event) {
      const { accountId: phoneId, from, text: textBody, messageId } = event;

      // Buscar Tenant
      const tenant = await getTenantByPhoneId(phoneId);

      if (!tenant) {
        channelLog.warn({ channel: 'whatsapp' }, `Tenant não encontrado para phoneId: ${phoneId}`);
        return new Response('OK', { status: 200 });
      }

      if (!isChannelEnabled(tenant, 'whatsapp')) {
        channelLog.info({ channel: 'whatsapp', tenantId: tenant.id }, 'Canal WhatsApp desativado');
        return new Response('OK', { status: 200 });
      }

      // Guarda legacy auth
      if (tenant.whatsappToken) tenant.whatsappToken = decrypt(tenant.whatsappToken);

      // Identity Resolver (Dual-Write Passivo Onda 1)
      let resolvedIdentityContext: IdentityContext | undefined = undefined;
      try {
         const resolvedContact = await resolveWhatsAppIdentity(tenant.id, event);
         if (resolvedContact) {
           resolvedIdentityContext = { contactId: resolvedContact.id, confidence: 'high' };
         }
      } catch (err) {
         channelLog.error({ channel: 'whatsapp', tenantId: tenant.id, error: err }, '[Webhook] Falha silenciosa no IdentityResolver Engine');
      }

      // Guard: ignore messages sent by the bot itself to prevent automation loops.
      // Meta may deliver echo-like events where `from` equals the tenant's own phone number.
      const botPhone = tenant.phone?.replace(/\D/g, '') ?? null;
      const senderPhone = from?.replace(/\D/g, '') ?? null;
      if (botPhone && senderPhone && senderPhone === botPhone) {
        channelLog.info({ channel: 'whatsapp', tenantId: tenant.id }, `Echo/self-message ignorado: ${maskPhone(from)}`);
        return new Response('OK', { status: 200 });
      }

      if (textBody) {
          // Idempotência: ignorar mensagens já processadas (retry da Meta)
          if (messageId) {
            try {
              await prisma.processedMessage.create({ data: { messageId } });
              // Cleanup lazy: remover registros com mais de 7 dias
              prisma.processedMessage.deleteMany({
                where: { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
              }).catch(() => {});
            } catch {
              // Unique constraint violation = mensagem já processada antes
              console.warn(`[Webhook] Mensagem duplicada ignorada: ${messageId}`);
              return new Response('OK', { status: 200 });
            }
          }

          console.log(`[Webhook] Mensagem de ${maskPhone(from)} — tenant: ${tenant.id}`);

          // ── Detecção Estrita de Primeira Interação ───────────────────────────
          const isFirstInbound = await isFirstInboundCustomerMessage(tenant.id, from, 'whatsapp');

          // Verificar status da conversa
          let status = await getConversationStatus(from, tenant.id);
          if (status === 'closed') status = 'open';

          // Salvar a mensagem do usuário PRIMEIRO
          await saveUserMessage(from, textBody, tenant.id, status, 'whatsapp', resolvedIdentityContext);

          // ── REGRA 1: Enviar mensagem exata de Boas-Vindas e ENCERRAR ───────
          if (isFirstInbound && tenant.welcomeMessage) {
            console.log(`[Webhook] firstInteractionDetected=true welcomeSent=true`);
            try {
              const sendPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
              await sendWhatsAppMessage(from, tenant.welcomeMessage, sendPhoneId, tenant.whatsappToken);
              await saveAIMessage(from, tenant.welcomeMessage, tenant.id, status, true, 'whatsapp', resolvedIdentityContext);
              
              console.log(`[Webhook] aiSkippedAfterWelcome=true automationSkippedAfterWelcome=true`);
              // EARLY RETURN: Não processa IA, nem orquestrador nem automação.
              return new Response('OK', { status: 200 });
            } catch (e) {
              console.error('[Webhook] Erro ao enviar boas-vindas:', e);
            }
          } else {
            console.log(`[Webhook] firstInteractionDetected=${isFirstInbound} welcomeSent=false welcomeSkippedReason=${isFirstInbound ? 'no_welcome_configured' : 'not_first_interaction'}`);
          }
          // ───────────────────────────────────────────────────────────────────

          if (status !== 'open' && status !== 'ai') {
            console.log(`[Webhook] Conversa ${maskPhone(from)} em status "${status}" — IA ignorada`);
            return new Response('OK', { status: 200 });
          }

          // ── Handoff: pedido explícito ANTES da automação ───────────────
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
              if (handoffResult.triggered && handoffResult.conversationSetToHuman) {
                // Conversa já transferida — parar processamento
                return new Response('OK', { status: 200 });
              }
            } catch (hErr) {
              console.error('[Webhook] Handoff explicit_request error:', hErr);
            }
          }

          // Verificar automação por palavra-chave
          const automation = await checkAutomationMatch(textBody, tenant.id);
          if (automation) {
            console.log(`[Webhook] Automação "${automation.name}" acionada para ${maskPhone(from)}`);
            const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;

            // COMM1 — extended actionType switch
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
                return new Response('OK', { status: 200 });
              }
              if (automation.actionType === 'send_external_link' && actionCfg.url) {
                const msg = actionCfg.message
                  ? `${actionCfg.message}\n${actionCfg.url}`
                  : actionCfg.url;
                await sendWhatsAppMessage(from, msg, replyPhoneId, tenant.whatsappToken);
                await saveAIMessage(from, msg, tenant.id, status, false);
                return new Response('OK', { status: 200 });
              }
              if (automation.actionType === 'send_checkout' && actionCfg.productId) {
                try {
                  const { generateCheckoutUrl, buildCheckoutMessage } = await import('@/lib/services/checkoutService');
                  const contactId = resolvedIdentityContext?.contactId;
                  if (contactId) {
                    const { checkoutUrl } = await generateCheckoutUrl(tenant.id, actionCfg.productId, contactId);
                    const product = await prisma.product.findUnique({ where: { id: actionCfg.productId } });
                    const msg = buildCheckoutMessage(
                      product?.name ?? 'Produto',
                      product?.price ?? 0,
                      product?.currency ?? 'BRL',
                      checkoutUrl,
                      actionCfg.ctaText
                    );
                    await sendWhatsAppMessage(from, msg, replyPhoneId, tenant.whatsappToken);
                    await saveAIMessage(from, msg, tenant.id, status, false);
                    return new Response('OK', { status: 200 });
                  }
                } catch (checkoutErr) {
                  console.error('[Webhook] Automation send_checkout error:', checkoutErr);
                }
              }
            }

            if (automation.responseType === 'template') {
              // Enviar template via Meta Graph API
              try {
                await sendTemplateMessage(from, automation.responseText, replyPhoneId!, tenant.whatsappToken!);
                await saveAIMessage(from, `[Template: ${automation.responseText}]`, tenant.id, status, false);
              } catch (tplErr) {
                console.error(`[Webhook] Falha ao enviar template "${automation.responseText}":`, tplErr);
                // Fallback: envia texto da regra como mensagem normal
                await sendWhatsAppMessage(from, automation.responseText, replyPhoneId, tenant.whatsappToken);
                await saveAIMessage(from, automation.responseText, tenant.id, status, false);
              }
            } else {
              await sendWhatsAppMessage(from, automation.responseText, replyPhoneId, tenant.whatsappToken);
              await saveAIMessage(from, automation.responseText, tenant.id, status, false);
            }
            return new Response('OK', { status: 200 });
          }

          // AG2/AG3/AG4 — Unified appointment message handler
          // Handles: booking, presence confirmation, cancel, reschedule
          try {
            const conv = await prisma.conversation.findFirst({
              where: { tenantId: tenant.id, customerPhone: from },
              orderBy: { lastMessageAt: 'desc' },
              select: { id: true },
            });
            const apptReply = await handleAppointmentMessage(tenant.id, from, textBody, conv?.id);
            if (apptReply) {
              const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
              await sendWhatsAppMessage(from, apptReply, replyPhoneId, tenant.whatsappToken);
              await saveAIMessage(from, apptReply, tenant.id, status, false);
              return new Response('OK', { status: 200 });
            }
          } catch (apptErr) {
            console.error('[Webhook] Erro no fluxo de agendamentos (continuando para IA):', apptErr);
          }

          // ── COMM1: Commercial Orchestrator ────────────────────────────
          try {
            const orchDecision = await runCommercialOrchestrator(
              tenant.id,
              from,
              textBody,
              resolvedIdentityContext?.contactId,
              'whatsapp'
            );

            if (orchDecision.action !== 'none' && orchDecision.message) {
              const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
              console.log(`[Webhook] Orchestrator: action=${orchDecision.action} reason=${orchDecision.reason}`);

              if (orchDecision.action === 'handoff_human') {
                // Delegate to handoff service
                await executeHandoff({
                  tenantId: tenant.id,
                  customerPhone: from,
                  channel: 'whatsapp',
                  triggerReason: 'explicit_request',
                  lastMessage: textBody,
                  contactId: resolvedIdentityContext?.contactId,
                });
                return new Response('OK', { status: 200 });
              }

              await sendWhatsAppMessage(from, orchDecision.message, replyPhoneId, tenant.whatsappToken);
              await saveAIMessage(from, orchDecision.message, tenant.id, status, false, 'whatsapp', resolvedIdentityContext);
              return new Response('OK', { status: 200 });
            }
          } catch (orchErr) {
            console.error('[Webhook] Commercial orchestrator error (falling through to AI):', orchErr);
          }

          // Verificar limites de IA
          let canUseAI = true;
          try {
            canUseAI = await verifyAiLimits(tenant.id);
          } catch (e) {
            console.error('[Webhook] Erro ao verificar limites de IA (permitindo por segurança):', e);
          }

          if (!canUseAI) {
            console.log(`[Webhook] Limite de IA atingido — tenant: ${tenant.id}`);
            const limitMessage = "Seu limite de respostas da IA foi atingido neste mês. Para continuar utilizando o atendimento automático, atualize seu plano.";
            const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
            try {
              await sendWhatsAppMessage(from, limitMessage, replyPhoneId, tenant.whatsappToken);
            } catch (sendErr) {
              console.error('[Webhook] Erro ao enviar msg de limite:', sendErr);
            }
            await saveAIMessage(from, limitMessage, tenant.id, status, false);
            return new Response('OK', { status: 200 });
          }

          // Carregar memória do cliente
          let customerContext = '';
          try {
            customerContext = await buildCustomerContext(tenant.id, from);
          } catch (memErr) {
            console.error('[Webhook] Erro ao carregar memória do cliente (continuando sem contexto):', memErr);
          }

          // Injetar catálogo de produtos ativos no contexto da IA
          try {
            const catalogItems = await prisma.product.findMany({
              where: { tenantId: tenant.id, active: true },
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
              customerContext = `${customerContext ? customerContext + '\n\n' : ''}PRODUTOS DISPONÍVEIS NO CATÁLOGO:\n${catalogLines}`;
            }
          } catch (catErr) {
            console.error('[Webhook] Erro ao carregar catálogo (continuando sem catálogo):', catErr);
          }

          // Detectar nome na mensagem e salvar na memória (non-blocking)
          const detectedName = extractNameFromText(textBody);
          if (detectedName) {
            upsertCustomerMemory(tenant.id, from, { name: detectedName }).catch(e =>
              console.error('[Webhook] Erro ao salvar nome na memória:', e)
            );
          }

          // Gerar resposta da IA
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

          await saveAIMessage(from, aiResponse, tenant.id, status);

          // Enviar resposta via WhatsApp
          const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
          console.log(`[Webhook] Enviando para ${maskPhone(from)} via phoneId: ${replyPhoneId}`);

          try {
            await sendWhatsAppMessage(from, aiResponse, replyPhoneId, tenant.whatsappToken);
            console.log(`[Webhook] Mensagem entregue para ${maskPhone(from)}`);
          } catch (sendErr: any) {
            console.error(`[Webhook] FALHA ao enviar para ${maskPhone(from)}:`, sendErr?.response?.data || sendErr?.message || sendErr);
          }

          // ── HANDOFF1: ai_low_confidence check (non-blocking) ───────────
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
      }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Webhook] Erro no processamento:', error);
    return new Response('OK', { status: 200 });
  }
}
