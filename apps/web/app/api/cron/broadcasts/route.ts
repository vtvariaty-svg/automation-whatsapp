import { NextResponse } from 'next/server';
import { processPendingBroadcasts } from '@/src/services/broadcastService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/broadcasts
 * Processa broadcasts agendados que atingiram scheduledAt.
 * Protegido por CRON_SECRET. Configurar no Render como Cron Job a cada 15 min.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!secret) {
    console.error('[Cron] CRON_SECRET não configurado — endpoint bloqueado');
    return NextResponse.json({ error: 'Cron não configurado' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await processPendingBroadcasts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[Cron] Erro ao processar broadcasts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
