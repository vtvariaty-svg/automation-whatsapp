import { prisma } from '../prisma';
import { getPlanLimit, PLANS } from '../config/plans';

export const getSubscription = async (tenantId: string) => {
  return await prisma.subscription.findUnique({
    where: { tenantId },
  });
};

/**
 * Create a subscription record for a tenant.
 * Trial is ONLY granted for Standard plan (hasTrial=true in plans config).
 * All other plans start as 'active' with no trial.
 */
export const createSubscription = async (tenantId: string, plan: string = 'free') => {
  const planConfig = PLANS[plan];
  const hasTrial = planConfig?.hasTrial ?? false;

  const trialEnd = hasTrial ? new Date(Date.now() + 7 * 86_400_000) : null;

  return await prisma.subscription.create({
    data: {
      tenantId,
      plan,
      status: hasTrial ? 'trialing' : 'active',
      trialEnd,
      usageMessages: 0,
    },
  });
};

export const updateSubscriptionFromStripe = async (
  tenantId: string,
  data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan?: string;
    planId?: string;
    status?: string;
    trialEnd?: Date | null;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }
) => {
  return await prisma.subscription.upsert({
    where: { tenantId },
    update: data,
    create: {
      tenantId,
      ...data,
      plan: data.plan || 'free',
      status: data.status || 'active',
      usageMessages: 0,
    },
  });
};

export const checkUsageLimit = async (tenantId: string): Promise<{ allowed: boolean; message?: string }> => {
  const subscription = await getSubscription(tenantId);

  if (!subscription) {
    return { allowed: false, message: 'Assinatura necessária para continuar. Acesse o painel para escolher um plano.' };
  }

  if (subscription.status === 'canceled') {
    return { allowed: false, message: 'Sua assinatura foi cancelada. Acesse o painel para reativar.' };
  }

  // Trial expiry check — only Standard can be in trial
  if (subscription.status === 'trialing' && subscription.trialEnd) {
    if (new Date() > subscription.trialEnd) {
      return { allowed: false, message: 'Seu período de teste expirou. Acesse o painel para assinar o plano Standard.' };
    }
  }

  const limit = getPlanLimit(subscription.plan);
  // -1 = unlimited
  if (limit !== -1 && subscription.usageMessages >= limit) {
    return {
      allowed: false,
      message: `Seu plano atingiu o limite mensal de ${limit} mensagens IA. Faça upgrade para continuar.`,
    };
  }

  return { allowed: true };
};

export const incrementUsage = async (tenantId: string) => {
  return await prisma.subscription.update({
    where: { tenantId },
    data: { usageMessages: { increment: 1 } },
  });
};

export const resetUsage = async (tenantId: string) => {
  await prisma.subscription.update({
    where: { tenantId },
    data: { usageMessages: 0 },
  });
  await prisma.aiUsage.deleteMany({ where: { tenantId } });
};

export const markCanceled = async (tenantId: string) => {
  return await prisma.subscription.update({
    where: { tenantId },
    data: { status: 'canceled' },
  });
};
