import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'no-reply@seu-dominio.com';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Envia um e-mail transacional via Resend.
 * Se a RESEND_API_KEY não estiver configurada, apenas loga no console
 * para evitar quebras em desenvolvimento local.
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!resend) {
    console.warn('\n[RESEND MOCK] E-mail não enviado pois a variável RESEND_API_KEY não está definida.');
    console.warn(`[Destinatário]: ${to}`);
    console.warn(`[Assunto]: ${subject}`);
    console.warn(`[Conteúdo HTM]:\n${html}\n`);
    // Em caso mock falso mas de 'sucesso' (para não travar onboarding de dev) devolve true
    return true; 
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    
    if (data.error) {
       console.error('[Resend Error]:', data.error);
       return false;
    }
    return true;
  } catch (error) {
    console.error('[Resend Exception]:', error);
    return false;
  }
}
