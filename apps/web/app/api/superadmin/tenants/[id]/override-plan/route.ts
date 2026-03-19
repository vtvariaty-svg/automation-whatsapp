import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, auditService } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireSuperAdmin(req);
    const { id } = await params;
    const { plan, entitlementsOverride, trialEnd } = await req.json();

    if (!plan) return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({ 
      where: { id },
      include: { subscription: true }
    });
    
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const beforeSub = tenant.subscription || {};

    const updateData: any = {
      plan,
      status: 'active', // override automatically un-cancels/un-trials them usually, or can explicitly pass value
    };

    if (entitlementsOverride !== undefined) {
      updateData.entitlementsOverride = entitlementsOverride;
    }
    
    if (trialEnd) {
      updateData.trialEnd = new Date(trialEnd);
      updateData.status = 'trialing';
    }

    let afterSub;
    if (tenant.subscription) {
      afterSub = await prisma.subscription.update({
        where: { tenantId: id },
        data: updateData
      });
    } else {
      afterSub = await prisma.subscription.create({
        data: {
          tenantId: id,
          ...updateData
        }
      });
    }

    await auditService.log({
      actorUserId: actor.id, action: 'OVERRIDE_PLAN',
      targetTenantId: id,
      entityType: 'subscription', entityId: afterSub.id,
      before: beforeSub,
      after: afterSub,
      req
    });

    return NextResponse.json({ message: 'Plan overridden successfully', subscription: afterSub });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (err.message === 'FORBIDDEN')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    console.error('[superadmin/tenants/override-plan]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
