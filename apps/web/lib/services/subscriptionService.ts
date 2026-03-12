import { prisma } from '../prisma';
import { getPlanLimit } from '../config/plans';

export const getSubscription = async (tenantId: string) => {
  return await prisma.subscription.findUnique({
    where: { tenantId },
  });
};

export const createSubscription = async (tenantId: string, plan: string = 'starter') => {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 7);

  return await prisma.subscription.create({
    data: {
      tenantId,
      plan,
      status: 'trialing',
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
    trialEnd?: Date;
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
      plan: data.plan || 'starter',
      status: data.status || 'trialing',
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

  // Check trial expiry
  if (subscription.status === 'trialing' && subscription.trialEnd) {
    if (new Date() > subscription.trialEnd) {
      return { allowed: false, message: 'Seu período de teste expirou. Acesse o painel para assinar um plano.' };
    }
  }

  const limit = getPlanLimit(subscription.plan);
  if (subscription.usageMessages >= limit) {
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
    data: {
      usageMessages: { increment: 1 },
    },
  });
};

export const resetUsage = async (tenantId: string) => {
  // Reset the counter on the subscription
  await prisma.subscription.update({
    where: { tenantId },
    data: { usageMessages: 0 },
  });

  // Also clear the ai_usage table for this tenant (new billing cycle)
  await prisma.aiUsage.deleteMany({
    where: { tenantId },
  });
};

export const markCanceled = async (tenantId: string) => {
  return await prisma.subscription.update({
    where: { tenantId },
    data: { status: 'canceled' },
  });
};
