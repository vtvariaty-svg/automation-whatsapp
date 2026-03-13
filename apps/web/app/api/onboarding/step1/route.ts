import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, businessType, businessDescription, businessHours } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }

    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        name: companyName,
        businessType: businessType || null,
        businessDescription: businessDescription || null,
        businessHours: businessHours || null,
        setupStep: 2,
      },
    });

    // Apply industry preset if a business type was selected
    if (businessType) {
      const { applyBusinessTemplate } = await import('@/lib/onboarding/applyTemplate');
      await applyBusinessTemplate(auth.tenantId, businessType, companyName, businessHours || "");
    }

    return NextResponse.json({ success: true, nextStep: 2 });
  } catch (error: any) {
    console.error('Onboarding step 1 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
