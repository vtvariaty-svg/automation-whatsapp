import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/utils/crypto';
// @ts-ignore - Importing from JS file
import { generateAIResponse } from "@/src/services/aiService";
// @ts-ignore - Importing from JS file
import { sendWhatsAppMessage } from "@/src/services/whatsappService";
// @ts-ignore - Importing from JS file
import { saveUserMessage, saveAIMessage, getConversationHistory, getConversationStatus } from "@/src/services/conversationService";
import { getTenantByPhoneId } from "@/src/services/tenantService";
import { checkAutomationMatch } from "@/src/services/automationService";
import { verifyAiLimits } from "@/src/services/billingService";

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

      // Decrypt token once — supports both encrypted (new) and plaintext (legacy) values
      if (tenant.whatsappToken) tenant.whatsappToken = decrypt(tenant.whatsappToken);

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
            if (history.length === 0 && tenant.welcomeMessage) {
              console.log(`Enviando mensagem de boas-vindas para ${from} no tenant ${tenant.name}`);
              
              const sendPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
              const sendToken = tenant.whatsappToken;

              await sendWhatsAppMessage(from, tenant.welcomeMessage, sendPhoneId, sendToken);
              // Opcional: Salvar a mensagem de boas vindas no histórico
              await saveAIMessage(from, tenant.welcomeMessage, tenant.id);
            }
          } catch (e) {
            console.error("Erro ao verificar/enviar boas-vindas:", e);
          }

          // Check status of conversation
          let status = await getConversationStatus(from, tenant.id);
          
          if (status === 'closed') {
            status = 'open';
          }

          // Salvar mensagem do usuário no banco com tenant_id (e o status atualizado)
          await saveUserMessage(from, textBody, tenant.id, status);

          if (status !== 'open' && status !== 'ai') {
            console.log(`Conversa com ${from} está com status: ${status}. Ignorando IA.`);
            // Apenas retorna OK, o humano é responsável a partir daqui
            return new Response('OK', { status: 200 });
          }

          // ** [NOVO] VERIFICAR AUTOMAÇÃO POR PALAVRA-CHAVE **
          const automation = await checkAutomationMatch(textBody, tenant.id);
          
          if (automation) {
            console.log(`Regra de automação acionada para ${from}: "${automation.name}"`);
            
            const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
            const replyToken = tenant.whatsappToken;

            // Envia resposta da automação
            await sendWhatsAppMessage(from, automation.responseText, replyPhoneId, replyToken);
            
            // Salva a resposta no banco, garantindo que aiGenerated = false (é uma automação hardcoded)
            // (from, text, tenantId, status, aiGenerated)
            await saveAIMessage(from, automation.responseText, tenant.id, status, false);
            
            // Encerra, não chama OpenAI
            return new Response('OK', { status: 200 });
          }

          // Verificar limites de IA (non-blocking - se falhar, permite IA)
          let canUseAI = true;
          try {
            canUseAI = await verifyAiLimits(tenant.id);
          } catch (e) {
            console.error('Erro ao verificar limites de IA (permitindo por segurança):', e);
          }
          
          if (!canUseAI) {
            console.log(`Limite da IA atingido para o tenant ${tenant.name}.`);
            const limitMessage = "Seu limite de respostas da IA foi atingido neste mês. Para continuar utilizando o atendimento automático, atualize seu plano.";
            
            const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
            const replyToken = tenant.whatsappToken;

            try {
              await sendWhatsAppMessage(from, limitMessage, replyPhoneId, replyToken);
            } catch (sendErr) {
              console.error('Erro ao enviar msg de limite via WhatsApp:', sendErr);
            }
            await saveAIMessage(from, limitMessage, tenant.id, status, false);
            return new Response('OK', { status: 200 });
          }

          // Fluxo: enviar texto para aiService com configurações do tenant
          const aiResponse = await generateAIResponse(textBody, tenant.openaiKey || '', tenant.aiPrompt || '', tenant.businessHours || '', tenant.id, from);
          console.log(`Resposta da IA para ${from} (Tenant ${tenant.name}): ${aiResponse}`);

          // Salvar resposta da IA no banco com tenant_id
          await saveAIMessage(from, aiResponse, tenant.id, status);

          // Enviar resposta via WhatsApp
          const replyPhoneId = tenant.whatsappPhoneNumberId || tenant.whatsappPhoneId;
          const replyToken = tenant.whatsappToken;

          console.log(`Enviando WhatsApp para ${from} via phoneId=${replyPhoneId}, token=${replyToken ? 'PRESENTE' : 'AUSENTE'}`);
          
          try {
            await sendWhatsAppMessage(from, aiResponse, replyPhoneId, replyToken);
            console.log(`WhatsApp enviado com sucesso para ${from}`);
          } catch (sendErr: any) {
            console.error(`FALHA ao enviar WhatsApp para ${from}:`, sendErr?.response?.data || sendErr?.message || sendErr);
          }
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
