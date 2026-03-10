import { prisma } from '../prisma';
import { generateResponse } from './aiService';
import { sendMessage } from '../integrations/whatsapp/whatsappClient';

export const routeMessage = async (from: string, text: string) => {
  let tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Default Tenant' }
    });
  }

  let conversation = await prisma.conversation.findFirst({
    where: { customerPhone: from, tenantId: tenant.id }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        customerPhone: from,
        tenantId: tenant.id
      }
    });
  }

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: text
    }
  });

  const aiText = await generateResponse(tenant.id, text);
  
  if (!aiText) return;

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: aiText
    }
  });

  await sendMessage(from, aiText);
};
