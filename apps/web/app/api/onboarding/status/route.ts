import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { createSystemHealthCheck } from '@/lib/onboarding/healthCheck';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        setupStep: true,
        setupCompleted: true,
        name: true,
        businessType: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Run the full system health check
    const health = await createSystemHealthCheck(auth.tenantId);

    // Map to the checklist format used by the frontend
    const checklist = {
      companyConfigured: !!(tenant.name && tenant.businessType),
      whatsappConnected: health.whatsapp_connected,
      servicesCreated: health.services_configured,
      aiConfigured: health.ai_configured,
      automationsCreated: health.automations_created,
      firstTestDone: health.test_message_received,
    };

    return NextResponse.json({
      setupStep: tenant.setupStep,
      setupCompleted: tenant.setupCompleted,
      checklist,
      health, // raw health check result
    });
  } catch (error: any) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

