import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { generateAIResponse } from "@/src/services/aiService";
// @ts-ignore - Importing from JS file
import { sendWhatsAppMessage } from "@/src/services/whatsappService";
// @ts-ignore - Importing from JS file
import { saveUserMessage, saveAIMessage } from "@/src/services/conversationService";

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

    // Tarefa 4 - Log Mensagem recebida
    console.log("Webhook recebido:", JSON.stringify(body, null, 2));

    if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // Tarefa 4 (Etapa 8/9) - Número do cliente
      const textBody = message.text?.body;

      // Tarefa 3 - Ignorar mensagens sem texto
      if (textBody) {
        console.log(`Mensagem recebida de ${from}: ${textBody}`);

        // Etapa 9: Fluxo 2 - salvar mensagem do usuário no banco
        await saveUserMessage(from, textBody);

        // Fluxo: 3 enviar texto para aiService -> 4 receber resposta
        const aiResponse = await generateAIResponse(textBody);
        console.log(`Resposta da IA para ${from}: ${aiResponse}`);

        // Etapa 9: Fluxo 5 - salvar resposta da IA no banco
        await saveAIMessage(from, aiResponse);

        // Fluxo: 6 enviar resposta para usuário via whatsappService
        await sendWhatsAppMessage(from, aiResponse);
      }
    }

    // Tarefa 5 - Sempre retorna 200
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error("Erro no processamento do webhook:", error);
    // Tarefa 5 - Mesmo se falhar, retorna 200 para a Meta
    return new Response('OK', { status: 200 });
  }
}
