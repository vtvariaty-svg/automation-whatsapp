import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
// @ts-ignore - Importing from JS file
import { sendWhatsAppMessage } from '@/src/services/whatsappService';

const MESSAGES = {
  followUp1: 'Posso ajudar com algo sobre o produto que você viu?',
  followUp2: 'Se ainda tiver interesse, posso gerar novamente o link de compra.',
  followUp3: 'Se quiser, posso avisar quando tivermos promoção.',
};

async function sendFollowUp(
  opportunityId: string,
  contactId: string,
  tenantId: string,
  message: string,
  field: 'followUp1Sent' | 'followUp2Sent' | 'followUp3Sent'
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { whatsappPhoneNumberId: true, whatsappPhoneId: true, whatsappToken: true },
  });

  if (!tenant) {
    console.error(`[FollowUp] Tenant não encontrado: ${tenantId}`);
    return;
  }

  const phoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
  const token = tenant.whatsappToken ? decrypt(tenant.whatsappToken) : null;

  if (!phoneId || !token) {
    console.warn(`[FollowUp] Tenant ${tenantId} sem credenciais WhatsApp — pulando`);
    return;
  }

  await sendWhatsAppMessage(contactId, message, phoneId, token);
  await prisma.salesOpportunity.update({
    where: { id: opportunityId },
    data: { [field]: true },
  });
  console.log(`[FollowUp] ${field} enviado para ${contactId} (tenant: ${tenantId})`);
}

export async function processFollowUps(): Promise<void> {
  const now = new Date();

  // Follow-up 1 — 1h após checkout_enviado
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const opp1 = await prisma.salesOpportunity.findMany({
    where: { status: 'checkout_enviado', followUp1Sent: false, updatedAt: { lte: hourAgo } },
  });
  for (const opp of opp1) {
    try {
      await sendFollowUp(opp.id, opp.contactId, opp.tenantId, MESSAGES.followUp1, 'followUp1Sent');
    } catch (e) {
      console.error(`[FollowUp] Erro no follow-up 1 para ${opp.contactId}:`, e);
    }
  }

  // Follow-up 2 — 24h após checkout_enviado
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const opp2 = await prisma.salesOpportunity.findMany({
    where: { status: 'checkout_enviado', followUp1Sent: true, followUp2Sent: false, updatedAt: { lte: dayAgo } },
  });
  for (const opp of opp2) {
    try {
      await sendFollowUp(opp.id, opp.contactId, opp.tenantId, MESSAGES.followUp2, 'followUp2Sent');
    } catch (e) {
      console.error(`[FollowUp] Erro no follow-up 2 para ${opp.contactId}:`, e);
    }
  }

  // Follow-up 3 — 48h após checkout_enviado
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const opp3 = await prisma.salesOpportunity.findMany({
    where: { status: 'checkout_enviado', followUp1Sent: true, followUp2Sent: true, followUp3Sent: false, updatedAt: { lte: twoDaysAgo } },
  });
  for (const opp of opp3) {
    try {
      await sendFollowUp(opp.id, opp.contactId, opp.tenantId, MESSAGES.followUp3, 'followUp3Sent');
    } catch (e) {
      console.error(`[FollowUp] Erro no follow-up 3 para ${opp.contactId}:`, e);
    }
  }

  console.log(`[FollowUp] Ciclo concluído — opp1: ${opp1.length}, opp2: ${opp2.length}, opp3: ${opp3.length}`);
}
