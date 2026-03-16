/**
 * GET  /api/admin/ops       — Live checks + history + incidents + summary
 * POST /api/admin/ops/save  — Run checks and persist to DB
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { runAllOpsChecks } from '@/lib/opsChecks';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [checks, history, incidents] = await Promise.all([
    runAllOpsChecks(),
    prisma.opsCheck.findMany({
      orderBy: { checkedAt: 'desc' },
      take: 5,
    }),
    prisma.incidentLog.findMany({
      orderBy: [
        { status: 'asc' },   // open/investigating before resolved
        { createdAt: 'desc' },
      ],
      take: 5,
    }),
  ]);

  const summary = checks.reduce(
    (acc, c) => {
      if (c.status === 'ok') acc.ok += 1;
      else if (c.status === 'warning') acc.warning += 1;
      else if (c.status === 'critical') acc.critical += 1;
      return acc;
    },
    { ok: 0, warning: 0, critical: 0 },
  );

  return NextResponse.json({ checks, history, incidents, summary });
}
