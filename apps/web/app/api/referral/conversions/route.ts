import { NextRequest, NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

// GET /api/referral/conversions — get all conversions for this tenant's codes
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all codes for this tenant
  const codes = await (prisma as any).referralCode.findMany({
    where: { tenantId: auth.tenantId },
    select: { id: true },
  });

  const codeIds = codes.map((c: any) => c.id);

  // Get all conversions for those codes
  const conversions = await (prisma as any).referralConversion.findMany({
    where: { referralCodeId: { in: codeIds } },
    orderBy: { createdAt: 'desc' },
  });

  // Get referred tenant names
  const referredTenantIds = [...new Set(conversions.map((c: any) => c.referredTenantId))] as string[];
  const tenants = await (prisma as any).tenant.findMany({
    where: { id: { in: referredTenantIds } },
    select: { id: true, name: true },
  });

  const tenantMap = new Map<string, string>();
  for (const t of tenants) {
    tenantMap.set(t.id, t.name);
  }

  const result = conversions.map((c: any) => ({
    id: c.id,
    status: c.status,
    referredTenantId: c.referredTenantId,
    referredTenantName: tenantMap.get(c.referredTenantId) ?? c.referredTenantId,
    rewardApplied: c.rewardApplied,
    createdAt: c.createdAt,
    paidAt: c.paidAt ?? null,
  }));

  return NextResponse.json({ conversions: result });
}
