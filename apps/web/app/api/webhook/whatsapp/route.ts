import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { generateAIResponse } from "@/src/services/aiService";
// @ts-ignore - Importing from JS file
import { sendWhatsAppMessage } from "@/src/services/whatsappService";
// @ts-ignore - Importing from JS file
import { saveUserMessage, saveAIMessage, getConversationHistory, getConversationStatus } from "@/src/services/conversationService";
// @ts-ignore - Importing from JS file
import { getTenantByPhoneId } from "@/src/services/tenantService";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === verify_token) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log Mensagem recebida
    console.log("Webhook recebido:", JSON.stringify(body, null, 2));

    if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.metadata) {
      const metadata = body.entry[0].changes[0].value.metadata;
      const phoneId = metadata.phone_number_id; // Tarefa 3 - Identificar tenant

      // Buscar Tenant
      const tenant = await getTenantByPhoneId(phoneId);
      
      if (!tenant) {
        console.error(`Tenant não encontrado para o phoneId: ${phoneId}`);
        return new Response('Tenant not found', { status: 200 }); // Retorna 200 para a Meta não reenviar
      }

      const messages = body.entry[0].changes[0].value.messages;

      if (messages && messages[0]) {
        const message = messages[0];
        const from = message.from;
        const textBody = message.text?.body;

        if (textBody) {
          console.log(`Mensagem recebida de ${from} para o tenant ${tenant.name}: ${textBody}`);

          // Verificar mensagem de boas vindas
          try {
            const history = await getConversationHistory(from, tenant.id);
            if (history.length === 0 && tenant.welcome_message) {
              console.log(`Enviando mensagem de boas-vindas para ${from} no tenant ${tenant.name}`);
              await sendWhatsAppMessage(from, tenant.welcome_message, tenant.whatsapp_phone_id, tenant.whatsapp_token);
              // Opcional: Salvar a mensagem de boas vindas no histórico
              await saveAIMessage(from, tenant.welcome_message, tenant.id);
            }
          } catch (e) {
            console.error("Erro ao verificar/enviar boas-vindas:", e);
          }

          // Check status of conversation
          const status = await getConversationStatus(from, tenant.id);

          // Etapa 9/Multi-tenant: salvar mensagem do usuário no banco com tenant_id (e o status atual)
          await saveUserMessage(from, textBody, tenant.id, status);

          if (status === 'human') {
            console.log(`Conversa com ${from} está com atendimento humano. Ignorando IA.`);
            // Apenas retorna OK, o humano é responsável a partir daqui
            return new Response('OK', { status: 200 });
          }

          // Fluxo: enviar texto para aiService com configurações do tenant
          const aiResponse = await generateAIResponse(textBody, tenant.openai_key, tenant.ai_prompt, tenant.business_hours);
          console.log(`Resposta da IA para ${from} (Tenant ${tenant.name}): ${aiResponse}`);

          // Etapa 9/Multi-tenant: salvar resposta da IA no banco com tenant_id
          await saveAIMessage(from, aiResponse, tenant.id, status);

          // Fluxo: enviar resposta via whatsappService com credenciais do tenant
          await sendWhatsAppMessage(from, aiResponse, tenant.whatsapp_phone_id, tenant.whatsapp_token);
        }
      }
    }

    // Tarefa 5 - Sempre retorna 200
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    return new Response('OK', { status: 200 });
  }
}
