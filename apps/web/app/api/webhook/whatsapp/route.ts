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
import { saveUserMessage, saveAIMessage, getConversationHistory, getConversationStatus, IdentityContext } from "@/src/services/conversationService";
import { getTenantByPhoneId } from "@/src/services/tenantService";
import { buildCustomerContext, upsertCustomerMemory, extractNameFromText } from "@/src/services/customerMemoryService";
import { checkAutomationMatch } from "@/src/services/automationService";
import { sendTemplateMessage } from "@/src/services/automationService";
import { verifyAiLimits } from "@/src/services/billingService";
import { handleAppointmentMessage } from "@/src/services/appointmentBookingService";
import { resolveWhatsAppIdentity } from "@/lib/services/identityResolver";

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
  const signatureValid = await verifyMetaSignature(rawBody, signature);
  if (!signatureValid) {
    console.warn('[Webhook] Assinatura HMAC inválida — requisição rejeitada');
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody);

    console.log(`[Webhook] Recebido — entries: ${body.entry?.length ?? 0}`);

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

          // Verificar mensagem de boas-vindas
          try {
            const history = await getConversationHistory(from, tenant.id, 'whatsapp', resolvedIdentityContext);
            if (history.length === 0 && tenant.welcomeMessage) {
              const sendPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
              await sendWhatsAppMessage(from, tenant.welcomeMessage, sendPhoneId, tenant.whatsappToken);
              await saveAIMessage(from, tenant.welcomeMessage, tenant.id, 'ai', true, 'whatsapp', resolvedIdentityContext);
              console.log(`[Webhook] Boas-vindas enviadas para ${maskPhone(from)}`);
            }
          } catch (e) {
            console.error('[Webhook] Erro ao enviar boas-vindas:', e);
          }

          // Verificar status da conversa
          let status = await getConversationStatus(from, tenant.id);
          if (status === 'closed') status = 'open';

          await saveUserMessage(from, textBody, tenant.id, status, 'whatsapp', resolvedIdentityContext);

          if (status !== 'open' && status !== 'ai') {
            console.log(`[Webhook] Conversa ${maskPhone(from)} em status "${status}" — IA ignorada`);
            return new Response('OK', { status: 200 });
          }

          // Verificar automação por palavra-chave
          const automation = await checkAutomationMatch(textBody, tenant.id);
          if (automation) {
            console.log(`[Webhook] Automação "${automation.name}" acionada para ${maskPhone(from)}`);
            const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;

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
        }
      }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[Webhook] Erro no processamento:', error);
    return new Response('OK', { status: 200 });
  }
}
