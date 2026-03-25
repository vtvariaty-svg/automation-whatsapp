import { prisma } from '@/lib/prisma';

/**
 * Envia um template WhatsApp via Meta Graph API.
 * @param to - número de destino (formato internacional)
 * @param templateName - nome do template conforme cadastrado na WABA
 * @param phoneId - Phone Number ID da WABA
 * @param token - token de acesso descriptografado
 * @param variables - valores das variáveis do template (opcionais)
 * @param language - código do idioma (padrão: pt_BR)
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  phoneId: string,
  token: string,
  variables: string[] = [],
  language: string = 'pt_BR'
): Promise<any> {
  const payload: any = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
    },
  };

  if (variables.length > 0) {
    payload.template.components = [
      {
        type: 'BODY',
        parameters: variables.filter(v => v).map((val) => ({
          type: 'text',
          text: val,
        })),
      },
    ];
  }

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`[Template] Falha ao enviar "${templateName}": ${data.error?.message || 'Erro desconhecido'}`);
  }

  return data;
}

export async function getAutomations(tenantId: string) {
  return prisma.automationRule.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
}

// ── Order status automation triggers ──────────────────────────────────────────

/**
 * Execute automation rules triggered by order status changes.
 * Matches rules with triggerType='order_status' and triggerValue matching the new status.
 * Sends WhatsApp message to the order's contact if credentials are available.
 * Idempotent: skips if the order already had this status in history (re-entry guard).
 */
export async function executeOrderAutomations(
  tenantId: string,
  orderId: string,
  newStatus: string,
  contactPhone: string,
  context?: { origin?: string; conversationId?: string }
): Promise<{ triggered: number; sent: number }> {
  let triggered = 0;
  let sent = 0;

  try {
    // Idempotency guard: check if automations already fired for this order + status
    const alreadyFired = await prisma.automationLog.findFirst({
      where: { orderId, triggerValue: newStatus, success: true },
    });
    if (alreadyFired) {
      console.log(`[OrderAutomation] Skipping duplicate: order=${orderId.slice(0, 8)} status=${newStatus} already fired at ${alreadyFired.sentAt.toISOString()}`);
      return { triggered: 0, sent: 0 };
    }

    // Find matching rules for this order status
    const rules = await prisma.automationRule.findMany({
      where: {
        tenantId,
        active: true,
        triggerType: 'order_status',
        triggerValue: newStatus,
      },
    });

    if (rules.length === 0) return { triggered: 0, sent: 0 };

    triggered = rules.length;

    // Resolve phone: if caller passed empty string, look it up from the order's contactId
    let resolvedPhone = contactPhone?.trim() ?? '';
    if (!resolvedPhone) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        select: { contactId: true },
      });
      if (order?.contactId) {
        const contact = await prisma.contact.findFirst({
          where: { id: order.contactId, tenantId },
          select: { phone: true },
        });
        resolvedPhone = contact?.phone?.trim() ?? '';
      }
      if (!resolvedPhone) {
        console.warn(`[OrderAutomation] No phone for order ${orderId.slice(0, 8)} — ${triggered} rule(s) skipped`);
        return { triggered, sent: 0 };
      }
    }

    // Get tenant WhatsApp credentials
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { whatsappPhoneNumberId: true, whatsappPhoneId: true, whatsappToken: true },
    });

    const phoneId = tenant?.whatsappPhoneNumberId || tenant?.whatsappPhoneId;
    const rawToken = tenant?.whatsappToken;

    if (!phoneId || !rawToken) {
      console.log(`[OrderAutomation] Tenant ${tenantId} sem credenciais WhatsApp — ${triggered} regras matched mas não enviadas`);
      return { triggered, sent: 0 };
    }

    // Dynamic imports to avoid circular deps
    const { decrypt } = await import('@/lib/utils/crypto');
    // @ts-ignore
    const { sendWhatsAppMessage } = await import('@/src/services/whatsappService');
    const { saveAIMessage } = await import('@/src/services/conversationService');
    const token = decrypt(rawToken);

    for (const rule of rules) {
      let success = false;
      let errorMessage: string | undefined;

      try {
        let finalMessage = '';
        if (rule.responseType === 'template') {
          // Enviar template via Meta Graph API
          await sendTemplateMessage(resolvedPhone, rule.responseText, phoneId, token, [
            context?.origin || '',
            orderId.slice(0, 8),
          ]);
          finalMessage = `[Template: ${rule.responseText}] - Pedido: ${orderId.slice(0,8)}`;
        } else {
          // Enviar texto normal com placeholders substituídos
          finalMessage = rule.responseText
            .replace(/\{status\}/g, newStatus)
            .replace(/\{orderId\}/g, orderId.slice(0, 8));
          await sendWhatsAppMessage(resolvedPhone, finalMessage, phoneId, token);
        }

        // Persist message in chat history so humans can see what the bot sent
        await saveAIMessage(resolvedPhone, finalMessage, tenantId, 'open', false, 'whatsapp').catch((e: any) => {
            console.error('[OrderAutomation] Failed to save message to history:', e.message);
        });

        success = true;
        sent++;
        console.log(`[OrderAutomation] Enviado "${rule.name}" (${rule.responseType}) para ${resolvedPhone}`);
      } catch (err: any) {
        errorMessage = err?.message || 'Erro desconhecido';
        console.error(`[OrderAutomation] Falha ao enviar regra "${rule.name}" para ${resolvedPhone}:`, err);
      }

      // Persist automation log
      await prisma.automationLog.create({
        data: {
          tenantId,
          ruleId: rule.id,
          orderId,
          triggerType: 'order_status',
          triggerValue: newStatus,
          contactPhone: resolvedPhone,
          success,
          errorMessage,
        },
      }).catch((logErr) => console.error('[OrderAutomation] Failed to persist log:', logErr));
    }
  } catch (err) {
    console.error(`[OrderAutomation] Error processing automations for order ${orderId}:`, err);
  }

  return { triggered, sent };
}

export async function createAutomation(tenantId: string, data: any) {
  return prisma.automationRule.create({
    data: {
      tenantId,
      name: data.name,
      triggerType: data.triggerType,
      triggerValue: data.triggerValue,
      matchType: data.matchType,
      responseType: data.responseType,
      responseText: data.responseText,
      active: data.active ?? true,
    }
  });
}

export async function updateAutomation(tenantId: string, id: string, data: any) {
  return prisma.automationRule.update({
    where: { id, tenantId },
    data
  });
}

export async function deleteAutomation(tenantId: string, id: string) {
  return prisma.automationRule.delete({
    where: { id, tenantId }
  });
}

export async function checkAutomationMatch(message: string, tenantId: string) {
  if (!message) return null;
  const msgText = message.toLowerCase().trim();

  const rules = await prisma.automationRule.findMany({
    where: { tenantId, active: true, NOT: { triggerType: 'order_status' } },
    orderBy: { createdAt: 'asc' } // Process older rules first
  });

  for (const rule of rules) {
    const trigger = rule.triggerValue.toLowerCase().trim();
    
    if (rule.matchType === 'exact') {
      if (msgText === trigger) {
        return rule;
      }
    } else if (rule.matchType === 'contains') {
      if (msgText.includes(trigger)) {
        return rule;
      }
    }
  }

  return null;
}
