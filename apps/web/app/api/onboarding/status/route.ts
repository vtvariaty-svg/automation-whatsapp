import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { createSystemHealthCheck } from '@/lib/onboarding/healthCheck';
import { getOnboardingBlueprint } from '@/lib/config/onboardingBlueprint';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [tenant, subscription] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: auth.tenantId },
        select: { setupStep: true, setupCompleted: true, name: true, businessType: true },
      }),
      prisma.subscription.findUnique({
        where: { tenantId: auth.tenantId },
        select: { plan: true },
      }),
    ]);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const health = await createSystemHealthCheck(auth.tenantId);
    const plan = subscription?.plan ?? 'free';

    // Legado — mantido para compatibilidade com SetupChecklist existente
    const checklist = {
      companyConfigured: !!(tenant.name && tenant.businessType),
      whatsappConnected: health.whatsapp_connected,
      servicesCreated: health.services_configured,
      aiConfigured: health.ai_configured,
      automationsCreated: health.automations_created,
      firstTestDone: health.test_message_received,
    };

    // Blueprint contextual por plano + businessType
    const blueprint = getOnboardingBlueprint(plan, tenant.businessType, health);

    return NextResponse.json({
      setupStep: tenant.setupStep,
      setupCompleted: tenant.setupCompleted,
      plan,
      businessType: tenant.businessType,
      checklist,
      blueprint,
      health,
    });
  } catch (error: any) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

