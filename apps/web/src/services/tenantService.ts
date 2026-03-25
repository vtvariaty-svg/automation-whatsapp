import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/utils/crypto';

/**
 * Busca um tenant pelo ID do telefone do WhatsApp.
 */
export async function getTenantByPhoneId(phoneId: string) {
  try {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { whatsappPhoneNumberId: phoneId },
          { whatsappPhoneId: phoneId }
        ]
      }
    });
    return tenant;
  } catch (error) {
    console.error('Erro ao buscar tenant por phoneId:', error);
    throw error;
  }
}

/**
 * Cria um novo tenant.
 */
export async function createTenant({ name, whatsapp_phone_id, whatsapp_token, openai_key, ai_prompt, welcome_message, business_hours }: any) {
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name,
        whatsappPhoneId: whatsapp_phone_id,
        whatsappToken: whatsapp_token ? encrypt(whatsapp_token) : undefined,
        openaiKey: openai_key,
        aiPrompt: ai_prompt,
        welcomeMessage: welcome_message,
        businessHours: business_hours
      }
    });
    return tenant;
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    throw error;
  }
}

/**
 * Atualiza configurações da IA do tenant.
 * Apenas campos explicitamente presentes no payload são atualizados.
 * String vazia ("") é normalizada para null para que a flag de boas-vindas
 * continue funcionando corretamente no webhook (falsy check).
 */
export async function updateTenantAISettings(id: string, { ai_prompt, welcome_message, business_hours }: any) {
  try {
    const data: Record<string, unknown> = {};
    if (ai_prompt !== undefined)      data.aiPrompt      = ai_prompt      || null;
    if (welcome_message !== undefined) data.welcomeMessage = welcome_message?.trim() || null;
    if (business_hours !== undefined)  data.businessHours  = business_hours || null;

    const tenant = await prisma.tenant.update({ where: { id }, data });
    return tenant;
  } catch (error) {
    console.error('Erro ao atualizar configurações da IA do tenant:', error);
    throw error;
  }
}

/**
 * Atualiza as credenciais do WhatsApp obtidas via Embedded Signup.
 */
export async function updateTenantWhatsAppCredentials(id: string, { business_account_id, phone_number_id, access_token }: any) {
  try {
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        whatsappBusinessAccountId: business_account_id,
        whatsappPhoneNumberId: phone_number_id,
        whatsappToken: access_token ? encrypt(access_token) : undefined
      }
    });
    return tenant;
  } catch (error) {
    console.error('Erro ao salvar credenciais do WhatsApp:', error);
    throw error;
  }
}

/**
 * Lista todos os tenants.
 */
export async function listTenants() {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return tenants;
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    throw error;
  }
}

/**
 * Busca tenant por ID.
 */
export async function getTenantById(id: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id }
    });
    return tenant;
  } catch (error) {
    console.error('Erro ao buscar tenant por ID:', error);
    throw error;
  }
}
