import { PrismaClient } from '@prisma/client';
import { sendMessage } from '../integrations/whatsapp/whatsappClient';

const prisma = new PrismaClient();

export const processFollowUps = async () => {
  console.log('[Follow-up] Starting follow-up check...');
  
  const now = new Date();

  // 1 Hour Follow-up
  const hourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const hourOpp = await prisma.salesOpportunity.findMany({
    where: {
      status: 'checkout_enviado',
      followUp1Sent: false,
      updatedAt: { lte: hourAgo }
    }
  });

  for (const opp of hourOpp) {
    try {
      await sendMessage(opp.contactId, "Posso ajudar com algo sobre o produto que você viu?");
      await prisma.salesOpportunity.update({
        where: { id: opp.id },
        data: { followUp1Sent: true }
      });
      console.log(`[Follow-up] 1h message sent to ${opp.contactId}`);
    } catch (e) {
      console.error(`[Follow-up] Error sending 1h message to ${opp.contactId}:`, e);
    }
  }

  // 24 Hours Follow-up
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayOpp = await prisma.salesOpportunity.findMany({
    where: {
      status: 'checkout_enviado',
      followUp1Sent: true,
      followUp2Sent: false,
      updatedAt: { lte: dayAgo }
    }
  });

  for (const opp of dayOpp) {
    try {
      await sendMessage(opp.contactId, "Se ainda tiver interesse, posso gerar novamente o link de compra.");
      await prisma.salesOpportunity.update({
        where: { id: opp.id },
        data: { followUp2Sent: true }
      });
      console.log(`[Follow-up] 24h message sent to ${opp.contactId}`);
    } catch (e) {
      console.error(`[Follow-up] Error sending 24h message to ${opp.contactId}:`, e);
    }
  }

  // 48 Hours Follow-up
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const twoDaysOpp = await prisma.salesOpportunity.findMany({
    where: {
      status: 'checkout_enviado',
      followUp1Sent: true,
      followUp2Sent: true,
      followUp3Sent: false,
      updatedAt: { lte: twoDaysAgo }
    }
  });

  for (const opp of twoDaysOpp) {
    try {
      await sendMessage(opp.contactId, "Se quiser, posso avisar quando tivermos promoção.");
      await prisma.salesOpportunity.update({
        where: { id: opp.id },
        data: { followUp3Sent: true }
      });
      console.log(`[Follow-up] 48h message sent to ${opp.contactId}`);
    } catch (e) {
      console.error(`[Follow-up] Error sending 48h message to ${opp.contactId}:`, e);
    }
  }

  console.log('[Follow-up] Check completed.');
};
