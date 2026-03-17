import { prisma } from '@/lib/prisma';
import { upsertContactByPhone, addContactEvent } from '@/lib/services/contactService';

/**
 * Salva a mensagem enviada pelo usuário.
 */
export async function saveUserMessage(phoneNumber: string, messageText: string, tenantId: string, status = 'ai', channel = 'whatsapp') {
  try {
    let conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId, channel }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { customerPhone: phoneNumber, tenantId, status, channel }
      });
    }

    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        direction: 'inbound',
        content: messageText,
        aiGenerated: false,
        channel,
      }
    });

    const updateData: any = { lastMessageAt: new Date() };
    if (conversation.status !== status) {
      updateData.status = status;
    }

    await prisma.conversation.update({
       where: { id: conversation.id },
       data: updateData
    });

    // Sync contact non-blocking — structured error, never silent
    upsertContactByPhone({ tenantId, phone: phoneNumber, source: channel, channel })
      .then((contact) => {
        if (contact && !conversation!.contactId) {
          prisma.conversation
            .update({ where: { id: conversation!.id }, data: { contactId: contact.id } })
            .then(() =>
              addContactEvent(
                tenantId,
                contact.id,
                'conversation_started',
                `Conversa iniciada via ${channel}`,
                { conversationId: conversation!.id, channel }
              )
            )
            .catch((err) =>
              console.error('[ContactSync] Failed to link conversation to contact', {
                tenantId,
                conversationId: conversation!.id,
                contactId: contact.id,
                error: err?.message ?? err,
              })
            );
        }
      })
      .catch((err) =>
        console.error('[ContactSync] Failed to upsert contact from conversation', {
          tenantId,
          phone: phoneNumber,
          channel,
          error: err?.message ?? err,
        })
      );

    console.log(`Mensagem do usuário ${phoneNumber} salva no banco.`);
    return msg;
  } catch (error) {
    console.error('Erro ao salvar mensagem do usuário no banco:', error);
  }
}

/**
 * Salva a resposta gerada pela IA.
 */
export async function saveAIMessage(phoneNumber: string, aiResponse: string, tenantId: string, status = 'ai', aiGenerated = true, channel = 'whatsapp') {
  try {
    let conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId, channel }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { customerPhone: phoneNumber, tenantId, status, channel }
      });
    }

    const roleString = aiGenerated ? 'ai' : 'human';

    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: roleString,
        direction: 'outbound',
        content: aiResponse,
        aiGenerated: aiGenerated,
        channel,
      }
    });

    const updateData: any = { lastMessageAt: new Date() };
    if (conversation.status !== status) {
      updateData.status = status;
    }

    await prisma.conversation.update({
       where: { id: conversation.id },
       data: updateData
    });

    console.log(`Resposta da IA para ${phoneNumber} salva no banco.`);
    return msg;
  } catch (error) {
    console.error('Erro ao salvar resposta da IA no banco:', error);
  }
}

/**
 * Retorna o histórico de conversas de um número específico.
 */
export async function getConversationHistory(phoneNumber: string, tenantId: string, channel = 'whatsapp') {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId, channel },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!conversation) return [];

    // Map to old format for compatibility, adding new fields
    return conversation.messages.map((msg: any) => ({
      id: msg.id,
      phone_number: phoneNumber,
      message_text: msg.content,
      sender: msg.role === 'user' ? 'user' : (msg.role === 'human' ? 'human' : 'ai'),
      direction: msg.direction,
      ai_generated: msg.aiGenerated,
      timestamp: msg.createdAt,
      tenant_id: tenantId,
      status: conversation.status
    }));
  } catch (error) {
    console.error('Erro ao buscar histórico da conversa:', error);
    throw error;
  }
}

/**
 * Retorna a lista de conversas de um tenant, agrupadas por telefone.
 */
export async function getConversationsList(tenantId: string) {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { tenantId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    return conversations.map((c: any) => {
      const lastMessage = c.messages.length > 0 ? c.messages[0].content : null;
      
      return {
        id: c.customerPhone,
        phone_number: c.customerPhone,
        timestamp: c.lastMessageAt,
        last_message: lastMessage,
        status: c.status,
        assigned_user: c.assignedUser
      };
    });
  } catch (error) {
    console.error('Erro ao buscar lista de conversas:', error);
    throw error;
  }
}

/**
 * Retorna o status atual de uma conversa (baseado na última mensagem).
 */
export async function getConversationStatus(phoneNumber: string, tenantId: string) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId }
    });
    return conversation?.status || 'ai';
  } catch (error) {
    console.error('Erro ao buscar status da conversa:', error);
    return 'ai';
  }
}

/**
 * Atualiza o status de todas as mensagens de um número para 'human'.
 * Agora atualizamos apenas o próprio conversation.status.
 */
export async function takeoverConversation(phoneNumber: string, tenantId: string, newStatus: string = 'human') {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId }
    });
    
    if (conversation) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: newStatus }
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer takeover/status update da conversa:', error);
    throw error;
  }
}
