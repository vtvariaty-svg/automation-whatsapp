import { prisma } from '@/lib/prisma';

export async function verifyAiLimits(tenantId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { planRel: true }
  });

  if (!sub || !sub.planRel) {
    return true; // Sem plano configurado firmemente, permitimos (pode ser trial livre em base legada)
  }

  const { monthlyAiLimit } = sub.planRel;
  
  // -1 significa ilimitado
  if (monthlyAiLimit === -1 || monthlyAiLimit === null) {
    return true; 
  }

  const periodStart = sub.currentPeriodStart || sub.createdAt;
  
  const usage = await prisma.aiUsage.aggregate({
    where: {
      tenantId,
      createdAt: { gte: periodStart }
    },
    _sum: {
      totalTokens: true
    }
  });

  const totalUsed = usage._sum.totalTokens || 0;

  if (totalUsed >= monthlyAiLimit) {
    return false; // Estourou limite
  }

  return true;
}

export async function getPlanUsage(tenantId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { planRel: true }
  });
  
  const defaultRes = { plan_name: sub?.plan || "Starter", limit: 1000, usage: 0, remaining: 1000 };

  if (!sub || !sub.planRel) {
    return defaultRes;
  }

  const limit = sub.planRel.monthlyAiLimit;
  if (!limit && limit !== 0) return defaultRes;

  const periodStart = sub.currentPeriodStart || sub.createdAt;
  const usageAgg = await prisma.aiUsage.aggregate({
    where: {
      tenantId,
      createdAt: { gte: periodStart }
    },
    _sum: {
      totalTokens: true
    }
  });

  const usage = usageAgg._sum.totalTokens || 0;
  
  let remaining = limit === -1 ? -1 : limit - usage;
  if (remaining < 0 && limit !== -1) remaining = 0;

  return {
    plan_name: sub.planRel.name,
    limit,
    usage,
    remaining
  };
}

export async function recordAiUsage(tenantId: string, tokens: number = 1) {
  await prisma.aiUsage.create({
    data: {
      tenantId,
      totalTokens: tokens
    }
  });
}
