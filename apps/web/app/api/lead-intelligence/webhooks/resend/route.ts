import { NextResponse } from 'next/server';
import { processResendWebhook } from '@/lib/services/lead-intelligence/emailWebhookSyncService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!payload || !payload.type) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const result = await processResendWebhook(payload);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Erro no processamento do webhook Resend:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
