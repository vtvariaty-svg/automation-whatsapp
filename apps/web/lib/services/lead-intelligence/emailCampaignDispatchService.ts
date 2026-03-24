import { Resend } from 'resend';
import { LeadCampaignDraft, LeadCandidate } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function dispatchEmailCampaign(
  draft: LeadCampaignDraft,
  candidate: LeadCandidate
): Promise<{ success: boolean; providerMessageId?: string; errorMessage?: string }> {
  try {
    // Validation
    if (draft.channel !== 'email') {
      return { success: false, errorMessage: 'Canal inválido para disparo de email' };
    }
    
    if (draft.status !== 'approved') {
      return { success: false, errorMessage: 'Rascunho não está aprovado' };
    }

    if (!candidate.email) {
      return { success: false, errorMessage: 'Email de destino não existe' };
    }

    if (candidate.emailConsentStatus !== 'granted') {
      return { success: false, errorMessage: 'Consentimento de email não concedido' };
    }

    if (candidate.outreachStatus !== 'ready_email' && candidate.outreachStatus !== 'ready_multichannel') {
      return { success: false, errorMessage: 'Status de prontidão não permite disparo de email' };
    }

    const fromEmail = process.env.LEAD_INTELLIGENCE_FROM_EMAIL || 
                      process.env.RESEND_FROM_EMAIL || 
                      process.env.FROM_EMAIL;

    if (!fromEmail) {
      return { success: false, errorMessage: 'Nenhum email remetente configurado no sistema' };
    }

    const subject = draft.subject || 'Oportunidade - Prospecção';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [candidate.email],
      subject,
      html: `<p>${draft.messageBody.replace(/\n/g, '<br/>')}</p>`
    });

    if (error) {
      return { success: false, errorMessage: error.message || 'Erro desconhecido no Resend' };
    }

    return {
      success: true,
      providerMessageId: data?.id,
    };

  } catch (err: any) {
    return {
      success: false,
      errorMessage: err.message || 'Erro inesperado ao despachar email',
    };
  }
}
