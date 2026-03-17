import { NextResponse } from 'next/server';
import {
  processReminders24h,
  processReminders2h,
  processNoShowDetection,
  processNoShowFollowUps,
} from '@/src/services/appointmentReminderService';

/**
 * POST /api/cron/appointment-reminders
 * Orchestrates all AG3 appointment notification processors.
 * Configure as a Cron Job running every 15 minutes.
 *
 * Processors:
 * - processReminders24h  — 24h-before reminder + confirmation request
 * - processReminders2h   — 2h-before reminder
 * - processNoShowDetection — auto-mark past appointments as no_show
 * - processNoShowFollowUps — rebooking nudge to no-show customers
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
    const [r24h, r2h, noShow, followUp] = await Promise.all([
      processReminders24h(),
      processReminders2h(),
      processNoShowDetection(),
      processNoShowFollowUps(),
    ]);

    return NextResponse.json({
      ok: true,
      reminders24h: r24h,
      reminders2h: r2h,
      noShowDetection: noShow,
      noShowFollowUps: followUp,
    });
  } catch (error: any) {
    console.error('[Cron] Erro ao processar notificações de agendamentos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
