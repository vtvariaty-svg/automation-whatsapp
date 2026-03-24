import { LeadCampaignDraft, LeadCandidate, Tenant } from '@prisma/client';
// @ts-ignore
import { sendWhatsAppMessage } from '@/src/services/whatsappService';

export async function dispatchWhatsAppCampaign(
  draft: LeadCampaignDraft,
  candidate: LeadCandidate,
  tenant: Tenant
): Promise<{ success: boolean; providerMessageId?: string; errorMessage?: string; deliveredTo?: string }> {
  try {
    if (draft.channel !== 'whatsapp') {
      return { success: false, errorMessage: 'Canal inválido para disparo de WhatsApp' };
    }
    
    if (draft.status !== 'approved') {
      return { success: false, errorMessage: 'Rascunho não está aprovado' };
    }

    if (candidate.whatsappConsentStatus !== 'granted') {
      return { success: false, errorMessage: 'Consentimento de WhatsApp não concedido' };
    }

    if (candidate.outreachStatus !== 'ready_whatsapp' && candidate.outreachStatus !== 'ready_multichannel') {
      return { success: false, errorMessage: 'Status de prontidão não permite disparo de WhatsApp' };
    }

    const targetPhone = candidate.mobilePhone || candidate.phone;
    if (!targetPhone) {
      return { success: false, errorMessage: 'Candidato sem telefone válido para WhatsApp' };
    }

    const phoneId = tenant.whatsappPhoneId;
    const token = tenant.whatsappToken;

    if (!phoneId || !token) {
      return { success: false, errorMessage: 'Credenciais de WhatsApp não configuradas no Tenant' };
    }

    const cleanPhone = targetPhone.replace(/\D/g, '');

    const result = await sendWhatsAppMessage(cleanPhone, draft.messageBody, phoneId, token);

    return {
      success: true,
      providerMessageId: result?.messages?.[0]?.id || 'unknown_id',
      deliveredTo: cleanPhone,
    };

  } catch (err: any) {
    return {
      success: false,
      errorMessage: err.response?.data?.error?.message || err.message || 'Erro inesperado ao despachar WhatsApp',
    };
  }
}
