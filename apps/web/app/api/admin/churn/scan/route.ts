/**
 * POST /api/admin/churn/scan
 * Superadmin only — runs churn signal detection for all tenants.
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { runChurnDetectionForAll } from '@/lib/churnDetection';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const results = await runChurnDetectionForAll();

  const scanned = results.length;
  const newSignals = results.reduce((sum, r) => sum + r.signals, 0);

  return NextResponse.json({ scanned, newSignals });
}
