import { prisma } from '@/lib/prisma';

export function generateReferralCode(tenantName: string): string {
  const prefix = tenantName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase();
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export async function applyReferralReward(conversionId: string): Promise<void> {
  // In a real system this would apply discount/credit to the subscription.
  // For now it simply marks the conversion as reward applied.
  await (prisma as any).referralConversion.update({
    where: { id: conversionId },
    data: {
      rewardApplied: true,
      rewardAppliedAt: new Date(),
    },
  });
}

export async function trackReferralSignup(
  code: string,
  referredTenantId: string
): Promise<Record<string, unknown> | null> {
  const referralCode = await (prisma as any).referralCode.findUnique({
    where: { code },
  });

  if (!referralCode || !referralCode.active) {
    return null;
  }

  const conversion = await (prisma as any).referralConversion.create({
    data: {
      referralCodeId: referralCode.id,
      referredTenantId,
      status: 'registered',
      rewardApplied: false,
    },
  });

  return conversion;
}
