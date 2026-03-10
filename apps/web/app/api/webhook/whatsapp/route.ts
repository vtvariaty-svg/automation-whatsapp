import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { generateAIResponse } from "@/src/services/aiService";
// @ts-ignore - Importing from JS file
import { sendWhatsAppMessage } from "@/src/services/whatsappService";

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
      const from = message.from; // Tarefa 4 - Número do cliente
      const textBody = message.text?.body;

      // Tarefa 3 - Ignorar mensagens sem texto
      if (textBody) {
        console.log(`Mensagem recebida de ${from}: ${textBody}`);

        // Fluxo: 2 enviar texto para aiService -> 3 receber resposta
        const aiResponse = await generateAIResponse(textBody);
        console.log(`Resposta da IA para ${from}: ${aiResponse}`);

        // Fluxo: 4 enviar resposta para usuário via whatsappService
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
