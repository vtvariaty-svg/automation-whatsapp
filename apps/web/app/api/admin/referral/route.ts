import { NextRequest, NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { applyReferralReward } from '@/lib/referral';

// GET /api/admin/referral — superadmin overview of all referral codes with stats
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const codes = await prisma.referralCode.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const codeIds = codes.map((c: any) => c.id);

  const allConversions = await prisma.referralConversion.findMany({
    where: { referralCodeId: { in: codeIds } },
  });

  // Build conversions map per code
  const conversionsByCode = new Map<string, any[]>();
  for (const conv of allConversions) {
    if (!conversionsByCode.has(conv.referralCodeId)) {
      conversionsByCode.set(conv.referralCodeId, []);
    }
    conversionsByCode.get(conv.referralCodeId)!.push(conv);
  }

  // Get tenant names
  const tenantIds = [...new Set(codes.map((c: any) => c.tenantId))] as string[];
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  });

  const tenantMap = new Map<string, string>();
  for (const t of tenants) {
    tenantMap.set(t.id, t.name);
  }

  const result = codes
    .map((code: any) => {
      const convs = conversionsByCode.get(code.id) ?? [];
      const total = convs.length;
      const trialing = convs.filter((c: any) => c.status === 'trialing').length;
      const paid = convs.filter((c: any) => c.status === 'paid').length;
      const pendingRewards = convs.filter(
        (c: any) => c.status === 'paid' && !c.rewardApplied
      ).length;

      return {
        id: code.id,
        code: code.code,
        tenantId: code.tenantId,
        tenantName: tenantMap.get(code.tenantId) ?? code.tenantId,
        rewardType: code.rewardType,
        rewardValue: code.rewardValue,
        active: code.active,
        conversions: { total, trialing, paid, pendingRewards },
      };
    })
    // Order by paid conversions desc
    .sort((a: any, b: any) => b.conversions.paid - a.conversions.paid);

  return NextResponse.json({ codes: result });
}

// PATCH /api/admin/referral — update conversion status
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth || auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { conversionId, status } = body;

  if (!conversionId || !status) {
    return NextResponse.json({ error: 'conversionId and status are required' }, { status: 400 });
  }

  const validStatuses = ['trialing', 'paid'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'paid') {
    updateData.paidAt = new Date();
  }

  await prisma.referralConversion.update({
    where: { id: conversionId },
    data: updateData,
  });

  if (status === 'paid') {
    await applyReferralReward(conversionId);
  }

  return NextResponse.json({ ok: true });
}
