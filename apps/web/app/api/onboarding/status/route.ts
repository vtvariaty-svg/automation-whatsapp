import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

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
        businessDescription: true,
        businessHours: true,
        whatsappToken: true,
        whatsappPhoneNumberId: true,
        whatsappBusinessAccountId: true,
        aiPrompt: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Compute checklist
    const checklist = {
      companyConfigured: !!(tenant.name && tenant.businessType),
      whatsappConnected: !!tenant.whatsappToken,
      servicesCreated: false, // will check below
      aiConfigured: !!tenant.aiPrompt,
      firstTestDone: tenant.setupStep > 5 || tenant.setupCompleted,
    };

    // Check services
    const serviceCount = await prisma.service.count({ where: { tenantId: auth.tenantId } });
    checklist.servicesCreated = serviceCount > 0;

    return NextResponse.json({
      setupStep: tenant.setupStep,
      setupCompleted: tenant.setupCompleted,
      checklist,
    });
  } catch (error: any) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
