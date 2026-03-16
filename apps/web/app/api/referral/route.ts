import { NextRequest, NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { generateReferralCode } from '@/lib/referral';

// GET /api/referral — get current tenant's referral code(s)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await (prisma as any).referralCode.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  const codeIds = codes.map((c: any) => c.id);

  const conversions = await (prisma as any).referralConversion.findMany({
    where: { referralCodeId: { in: codeIds } },
  });

  const totalConversions = conversions.length;
  const paidConversions = conversions.filter((c: any) => c.status === 'paid').length;
  const pendingRewards = conversions.filter(
    (c: any) => c.status === 'paid' && !c.rewardApplied
  ).length;

  // If no code exists, provide a suggested code (don't auto-create)
  let suggestedCode: string | undefined;
  if (codes.length === 0) {
    const tenant = await (prisma as any).tenant.findUnique({
      where: { id: auth.tenantId },
      select: { name: true },
    });
    if (tenant) {
      suggestedCode = generateReferralCode(tenant.name);
    }
  }

  return NextResponse.json({
    codes,
    totalConversions,
    paidConversions,
    pendingRewards,
    ...(suggestedCode ? { suggestedCode } : {}),
  });
}

// POST /api/referral — create a referral code
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rewardType: string = body.rewardType ?? 'discount';
  const rewardValue: number = body.rewardValue ?? 0;

  // Check if tenant already has an active code
  const existingActive = await (prisma as any).referralCode.findFirst({
    where: { tenantId: auth.tenantId, active: true },
  });

  if (existingActive) {
    return NextResponse.json(
      { error: 'Tenant already has an active referral code', code: existingActive },
      { status: 409 }
    );
  }

  const tenant = await (prisma as any).tenant.findUnique({
    where: { id: auth.tenantId },
    select: { name: true },
  });

  const code = generateReferralCode(tenant?.name ?? 'USER');

  const created = await (prisma as any).referralCode.create({
    data: {
      tenantId: auth.tenantId,
      userId: auth.userId,
      code,
      rewardType,
      rewardValue,
      active: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

// PATCH /api/referral — update referral code
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { codeId, active, rewardType, rewardValue } = body;

  if (!codeId) {
    return NextResponse.json({ error: 'codeId is required' }, { status: 400 });
  }

  // Verify ownership
  const existing = await (prisma as any).referralCode.findFirst({
    where: { id: codeId, tenantId: auth.tenantId },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof active === 'boolean') updateData.active = active;
  if (rewardType !== undefined) updateData.rewardType = rewardType;
  if (rewardValue !== undefined) updateData.rewardValue = rewardValue;

  const updated = await (prisma as any).referralCode.update({
    where: { id: codeId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
