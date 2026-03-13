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
    const { services } = body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json({ error: 'Adicione pelo menos um serviço' }, { status: 400 });
    }

    // Create services in the real Service table
    for (const svc of services) {
      if (svc.name?.trim()) {
        await prisma.service.create({
          data: {
            tenantId: auth.tenantId,
            name: svc.name.trim(),
            durationMinutes: svc.durationMinutes || 30,
            active: true,
          },
        });
      }
    }

    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: { setupStep: 4 },
    });

    return NextResponse.json({ success: true, nextStep: 4 });
  } catch (error: any) {
    console.error('Onboarding step 3 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
