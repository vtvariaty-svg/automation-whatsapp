import { prisma } from '@/lib/prisma';
import { getPlanLimit } from '@/lib/config/plans';

/**
 * Verifica se o tenant pode usar a IA neste ciclo de faturamento.
 * Hierarquia: Plan DB → plans.ts config → permitir (fallback seguro).
 */
export async function verifyAiLimits(tenantId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { planRel: true }
  });

  if (!sub) return true; // Mantemos true para simplificar, mas o uso será registrado.
  // Se quiser limitar trial sem subscription no DB:
  // if (!sub) {
  //   const usage = await prisma.aiUsage.aggregate({ where: { tenantId, createdAt: { gte: new Date(Date.now() - 7*86400000) } }, _sum: { totalTokens: true } });
  //   return (usage._sum.totalTokens || 0) < 1000;
  // }


  // Determinar o limite: prioridade para o Plan do DB, fallback para config
  let limit: number;
  if (sub.planRel) {
    limit = sub.planRel.monthlyAiLimit;
  } else {
    limit = getPlanLimit(sub.plan);
  }

  // -1 ou 0 (config not found) = ilimitado
  if (limit <= 0) return true;

  const periodStart = sub.currentPeriodStart || sub.createdAt;

  const usage = await prisma.aiUsage.aggregate({
    where: {
      tenantId,
      createdAt: { gte: periodStart }
    },
    _sum: { totalTokens: true }
  });

  const totalUsed = usage._sum.totalTokens || 0;
  return totalUsed < limit;
}

/**
 * Retorna métricas de uso para o frontend.
 */
export async function getPlanUsage(tenantId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { planRel: true }
  });

  if (!sub) {
    return { plan_name: 'Starter', limit: 1000, usage: 0, remaining: 1000 };
  }

  // Determinar nome e limite
  const planName = sub.planRel?.name || sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1);
  let limit: number;
  if (sub.planRel) {
    limit = sub.planRel.monthlyAiLimit;
  } else {
    limit = getPlanLimit(sub.plan) || 1000;
  }

  const periodStart = sub.currentPeriodStart || sub.createdAt;

  const usageAgg = await prisma.aiUsage.aggregate({
    where: {
      tenantId,
      createdAt: { gte: periodStart }
    },
    _sum: { totalTokens: true }
  });

  const usage = usageAgg._sum.totalTokens || 0;
  let remaining = limit <= 0 ? -1 : limit - usage;
  if (remaining < 0 && limit > 0) remaining = 0;

  return {
    plan_name: planName,
    limit: limit <= 0 ? -1 : limit,
    usage,
    remaining
  };
}

/**
 * Registra tokens consumidos na tabela ai_usage.
 */
export async function recordAiUsage(tenantId: string, tokens: number = 1) {
  await prisma.aiUsage.create({
    data: {
      tenantId,
      totalTokens: tokens
    }
  });
}
