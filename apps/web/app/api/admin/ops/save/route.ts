/**
 * POST /api/admin/ops/save — Run all ops checks and persist each as OpsCheck record.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { runAllOpsChecks } from '@/lib/opsChecks';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const checks = await runAllOpsChecks();

  await prisma.opsCheck.createMany({
    data: checks.map((c) => ({
      name: c.name,
      category: c.category,
      status: c.status,
      detail: c.detail,
      checkedBy: auth.userId,
    })),
  });

  return NextResponse.json({ saved: checks.length, checks });
}
