import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getSubscription } from '@/lib/services/subscriptionService';
import { PLANS } from '@/lib/config/plans';
import { isSuperAdmin, logSuperAdminAction } from '@/lib/superadmin';

export async function GET(req: Request) {
  try {
    const session = await requireAuth(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // SUPERADMIN: bypass completo — retorna plano ilimitado sem tocar em dados reais
    if (isSuperAdmin(session.role)) {
      logSuperAdminAction(session.userId, 'view_billing', session.tenantId);
      return NextResponse.json({
        hasSubscription: true,
        plan: 'superadmin',
        planName: 'Superadmin',
        planPrice: 0,
        status: 'active',
        usageMessages: 0,
        limitMessages: -1,
        trialEnd: null,
        currentPeriodEnd: null,
      });
    }

    const subscription = await getSubscription(session.tenantId);

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        plan: null,
        status: null,
        usageMessages: 0,
        limitMessages: 0,
        trialEnd: null,
        currentPeriodEnd: null,
      });
    }

    const planConfig = PLANS[subscription.plan];

    return NextResponse.json({
      hasSubscription: true,
      plan: subscription.plan,
      planName: planConfig?.name || subscription.plan,
      planPrice: planConfig?.price || 0,
      status: subscription.status,
      usageMessages: subscription.usageMessages,
      limitMessages: planConfig?.limitMessages || 0,
      trialEnd: subscription.trialEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
