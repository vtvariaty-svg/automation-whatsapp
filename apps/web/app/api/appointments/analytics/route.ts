import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/appointments/analytics?days=30
 *
 * Returns aggregated scheduling metrics for the tenant.
 * Used by SchedulingStatsBar on the appointments page.
 */
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30', 10), 1), 365);

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId: auth.tenantId,
        createdAt: { gte: since },
      },
      select: {
        status: true,
        source: true,
        date: true,
        createdAt: true,
      },
    });

    const total = appointments.length;

    const byStatus: Record<string, number> = {};
    for (const appt of appointments) {
      byStatus[appt.status] = (byStatus[appt.status] ?? 0) + 1;
    }

    const bySource: Record<string, number> = {};
    for (const appt of appointments) {
      const src = appt.source ?? 'manual';
      bySource[src] = (bySource[src] ?? 0) + 1;
    }

    const validTotal = total - (byStatus['cancelado'] ?? 0);
    const confirmedOrDone = (byStatus['confirmado'] ?? 0) + (byStatus['concluido'] ?? 0);
    const confirmationRate = validTotal > 0 ? Math.round((confirmedOrDone / validTotal) * 100) : null;

    const attended = byStatus['concluido'] ?? 0;
    const noShow = byStatus['no_show'] ?? 0;
    const attendanceBase = attended + noShow;
    const attendanceRate = attendanceBase > 0 ? Math.round((attended / attendanceBase) * 100) : null;

    const cancellationRate = total > 0
      ? Math.round(((byStatus['cancelado'] ?? 0) / total) * 100)
      : null;

    const leadTimes: number[] = [];
    for (const appt of appointments) {
      if (appt.date) {
        const diffMs = new Date(appt.date + 'T12:00:00').getTime() - new Date(appt.createdAt).getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) leadTimes.push(diffDays);
      }
    }
    const avgLeadTimeDays = leadTimes.length > 0
      ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : null;

    return NextResponse.json({
      period: days,
      total,
      byStatus,
      bySource,
      confirmationRate,
      attendanceRate,
      cancellationRate,
      avgLeadTimeDays,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
