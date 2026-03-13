import { PrismaClient } from '@prisma/client';
import { generateResponse, generateSalesResponse } from './aiService';
import { detectIntent } from './intentService';
import { sendMessage } from '../integrations/whatsapp/whatsappClient';

const prisma = new PrismaClient();

export const routeMessage = async (from: string, text: string) => {
  // For Stage 7, we'll assume a default tenant for the WhatsApp integration
  // In a real multi-tenant app, you'd map the WHATSAPP_PHONE_ID or a custom number to a tenantId
  // Here we'll pick the first tenant found in the database or create a dummy one
  let tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Default Tenant' }
    });
  }

  // 1. Log Conversation
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

  // 2. Save incoming message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: text
    }
  });

  // 3. Detect Intent & Generate Response
  const { intent } = detectIntent(text);
  console.log(`[Intent Detection] Message from ${from} classified as: ${intent}`);

  let aiText;
  if (intent === 'sales') {
    aiText = await generateSalesResponse(tenant.id, text);
  } else {
    // Normal / Support / FAQ / General Fallback
    aiText = await generateResponse(tenant.id, text);
  }
  
  if (!aiText) return;

  // 4. Save AI message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: aiText
    }
  });

  // 5. Send WhatsApp response
  await sendMessage(from, aiText);
};
