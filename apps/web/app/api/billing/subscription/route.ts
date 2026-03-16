import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/authService';
import { getSubscription } from '@/lib/services/subscriptionService';
import { PLANS } from '@/lib/config/plans';
import { isSuperAdmin, logSuperAdminAction } from '@/lib/superadmin';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // SUPERADMIN: bypass completo — retorna plano ilimitado sem tocar em dados reais
    if (isSuperAdmin(payload.role)) {
      logSuperAdminAction(payload.userId, 'view_billing', payload.tenantId);
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

    const subscription = await getSubscription(payload.tenantId);

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
