import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/appointments/analytics?days=30
 * Returns scheduling KPIs for the tenant over the given period.
 * No AI required — pure DB aggregation. Available on all plans.
 */
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30', 10), 1), 365);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0]; // YYYY-MM-DD

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: auth.tenantId,
      createdAt: { gte: since },
    },
    select: {
      status: true,
      source: true,
      createdAt: true,
      date: true,
      confirmedAt: true,
      cancelledAt: true,
    },
  });

  const total = appointments.length;

  // ── By status ─────────────────────────────────────────────────────────
  const byStatus: Record<string, number> = {};
  for (const a of appointments) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  }

  // ── By source ─────────────────────────────────────────────────────────
  const bySource: Record<string, number> = {};
  for (const a of appointments) {
    const src = a.source ?? 'manual';
    bySource[src] = (bySource[src] ?? 0) + 1;
  }

  // ── Confirmation rate: those that reached 'confirmado' or beyond ───────
  const confirmed = (byStatus['confirmado'] ?? 0) + (byStatus['concluido'] ?? 0);
  const confirmationRate = total > 0 ? Math.round((confirmed / total) * 100) : null;

  // ── Attendance rate: concluido / (concluido + no_show) ────────────────
  const concluded = byStatus['concluido'] ?? 0;
  const noShow = byStatus['no_show'] ?? 0;
  const attendanceBase = concluded + noShow;
  const attendanceRate = attendanceBase > 0 ? Math.round((concluded / attendanceBase) * 100) : null;

  // ── Average lead time: days between booking (createdAt) and appointment date ──
  const leadTimes: number[] = [];
  for (const a of appointments) {
    if (!a.date) continue;
    const apptDate = new Date(`${a.date}T12:00:00`).getTime();
    const bookDate = new Date(a.createdAt).getTime();
    const diffDays = Math.round((apptDate - bookDate) / 86_400_000);
    if (diffDays >= 0) leadTimes.push(diffDays);
  }
  const avgLeadTimeDays = leadTimes.length > 0
    ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
    : null;

  // ── Cancellation rate ─────────────────────────────────────────────────
  const cancelled = byStatus['cancelado'] ?? 0;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : null;

  return NextResponse.json({
    period: days,
    since: sinceStr,
    total,
    byStatus,
    bySource,
    confirmationRate,
    attendanceRate,
    cancellationRate,
    avgLeadTimeDays,
  });
}
