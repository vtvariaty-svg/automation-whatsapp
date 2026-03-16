import { NextResponse } from 'next/server';
import { processFollowUps } from '@/src/services/followUpService';

/**
 * POST /api/cron/follow-ups
 * Protegido por CRON_SECRET para evitar execuções não autorizadas.
 * Configurar no Render como Cron Job: POST <url>/api/cron/follow-ups a cada 15 minutos.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!secret) {
    console.error('[Cron] CRON_SECRET não configurado — endpoint bloqueado por segurança');
    return NextResponse.json({ error: 'Cron não configurado' }, { status: 503 });
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    await processFollowUps();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Cron] Erro ao processar follow-ups:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
