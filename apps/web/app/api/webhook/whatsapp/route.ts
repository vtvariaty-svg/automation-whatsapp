import { NextResponse } from 'next/server';
import { routeMessage } from '@/lib/services/messageRouter';

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

    console.log("Webhook recebido:", JSON.stringify(body, null, 2));

    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const message = body.entry[0].changes[0].value.messages[0];
        const from = message.from;
        const text = message.text?.body;

        if (text) {
          console.log(`Received message from ${from}: ${text}`);
          // We fire and forget to respond quickly to WhatsApp
          routeMessage(from, text).catch(err => console.error('Error routing message:', err));
        }
      }
      return new Response('OK', { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    return new Response('Server Error', { status: 500 });
  }
}
