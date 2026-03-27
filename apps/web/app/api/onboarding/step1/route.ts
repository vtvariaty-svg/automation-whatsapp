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
    const { companyName, businessType, businessDescription, phone, address, botId } = body;

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }

    // Save business context — NO applyBusinessTemplate, NO aiPrompt generation
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        name: companyName.trim(),
        businessType: businessType || null,
        businessDescription: businessDescription || null,
        phone: phone || null,
        setupStep: 2,
      },
    });

    // Upsert BusinessConfig with address
    if (address?.trim()) {
      await prisma.businessConfig.upsert({
        where: { tenantId: auth.tenantId },
        update: { address: address.trim() },
        create: {
          tenantId: auth.tenantId,
          address: address.trim(),
          timezone: 'America/Sao_Paulo',
        },
      });
    }

    // Return botId so the frontend can call POST /api/marketplace/activate independently
    return NextResponse.json({ success: true, nextStep: 2, botId: botId || null });
  } catch (error: any) {
    console.error('Onboarding step 1 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
