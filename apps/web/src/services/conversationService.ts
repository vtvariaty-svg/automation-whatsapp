import { prisma } from '@/lib/prisma';
import { upsertContactByPhone, addContactEvent } from '@/lib/services/contactService';
import { channelLog } from '@/lib/channels/logger';

export type IdentityContext = {
  contactId: string;
  confidence: 'high' | 'ambiguous';
};

/**
 * Função utilitária para hashing determinístico simples (DJB2) modificado
 * usado para Samplificar as requisições baseadas no ID da conversa.
 */
function deterministicSample(stringKey: string, percentage: number): boolean {
  let hash = 5381;
  for (let i = 0; i < stringKey.length; i++) {
    hash = (hash * 33) ^ stringKey.charCodeAt(i);
  }
  const absoluteHash = Math.abs(hash);
  return (absoluteHash % 100) < percentage;
}

/**
 * Executa o Shadow Validation Paralelo e gera logs estruturados mascarados
 */
async function performShadowValidation({
  tenantId, legacyPhone, legacyConversationId, resolvedContactId, operation, direction
}: {
  tenantId: string, legacyPhone: string, legacyConversationId: string, resolvedContactId: string, operation: string, direction: string
}) {
  try {
    const shadowConv = await prisma.conversation.findFirst({
      where: { contactId: resolvedContactId, tenantId, channel: 'whatsapp' }
    });
    
    // Mask phoneNumber -> ***-9999
    const maskedPhone = legacyPhone.length >= 4 ? `***-${legacyPhone.slice(-4)}` : '****';
    
    const shadowId = shadowConv?.id ?? 'null';
    if (shadowId !== legacyConversationId) {
      channelLog.info({
        channel: 'whatsapp',
        event: 'shadow_validation_mismatch',
        tenantId,
        customerPhone: maskedPhone,
        resolvedContactId,
        legacyConversationId,
        shadowConversationId: shadowId,
        operation,
        direction,
        timestamp: Date.now()
      }, '[ShadowValidation] Dual-Read mismatch report');
    }
  } catch(e) { /* Silencia falhas do Shadow Read */ }
}

export async function saveUserMessage(
  phoneNumber: string, 
  messageText: string, 
  tenantId: string, 
  status = 'ai', 
  channel = 'whatsapp',
  identity?: IdentityContext
) {
  try {
    let conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId, channel }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { 
          customerPhone: phoneNumber, 
          tenantId, 
          status, 
          channel,
          contactId: (identity?.confidence === 'high') ? identity.contactId : undefined
        }
      });
    } else if (!conversation.contactId && identity?.confidence === 'high') {
      // Dual-Write (Passive)
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { contactId: identity.contactId }
      });
      conversation.contactId = identity.contactId;
    }

    // Shadow Validation (Amostragem de 5%)
    if (identity?.confidence === 'high' && deterministicSample(`${tenantId}_${conversation.id}`, 5)) {
      await performShadowValidation({
        tenantId,
        legacyPhone: phoneNumber,
        legacyConversationId: conversation.id,
        resolvedContactId: identity.contactId,
        operation: 'saveUserMessage',
        direction: 'inbound',
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

export async function saveAIMessage(
  phoneNumber: string, 
  aiResponse: string, 
  tenantId: string, 
  status = 'ai', 
  aiGenerated = true, 
  channel = 'whatsapp'
) {
  try {
    let conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId, channel }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { customerPhone: phoneNumber, tenantId, status, channel }
      });
    }

    // Outbound symetry: The anchor identity is inherently the DB state of the conversation
    // So the Dual-Read Validation acts passively here only utilizing the established contactId
    if (conversation.contactId && deterministicSample(`${tenantId}_${conversation.id}`, 5)) {
      await performShadowValidation({
        tenantId,
        legacyPhone: phoneNumber,
        legacyConversationId: conversation.id,
        resolvedContactId: conversation.contactId,
        operation: 'saveAIMessage',
        direction: 'outbound',
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

export async function getConversationHistory(
  phoneNumber: string, 
  tenantId: string, 
  channel = 'whatsapp',
  identity?: IdentityContext
) {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { customerPhone: phoneNumber, tenantId, channel },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (conversation && identity?.confidence === 'high' && deterministicSample(`${tenantId}_${conversation.id}`, 5)) {
      await performShadowValidation({
         tenantId, legacyPhone: phoneNumber,
         legacyConversationId: conversation.id,
         resolvedContactId: identity.contactId,
         operation: 'getHistory', direction: 'inbound'
      });
    }
    
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
