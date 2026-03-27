import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { marketplaceBots } from '@/lib/marketplace/bots';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [tenant, services] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: auth.tenantId },
        select: {
          activeBotKey: true,
          businessConfig: {
            select: { openingHours: true, address: true },
          },
        },
      }),
      prisma.service.findMany({
        where: { tenantId: auth.tenantId, active: true },
        orderBy: { createdAt: 'asc' },
        select: { name: true, durationMinutes: true },
      }),
    ]);

    const activeBotKey = (tenant as any)?.activeBotKey as string | null;
    const bot = activeBotKey ? marketplaceBots.find((b) => b.id === activeBotKey) : null;

    return NextResponse.json({
      services,
      activeBotKey,
      botModules: bot?.modules ?? [],
      botBlueprint: bot?.blueprint ?? null,
      botName: bot?.name ?? null,
      openingHours: (tenant as any)?.businessConfig?.openingHours ?? '',
      address: (tenant as any)?.businessConfig?.address ?? '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { services, openingHours, address } = body;

    // Save operational config to BusinessConfig
    const hasConfig = openingHours !== undefined || address !== undefined;
    if (hasConfig) {
      await prisma.businessConfig.upsert({
        where: { tenantId: auth.tenantId },
        update: {
          ...(openingHours !== undefined && { openingHours }),
          ...(address !== undefined && { address }),
        },
        create: {
          tenantId: auth.tenantId,
          openingHours: openingHours ?? '',
          address: address ?? '',
          timezone: 'America/Sao_Paulo',
        },
      });
    }

    // Save manual services — NEVER delete system (bot-seeded) services
    if (Array.isArray(services) && services.length > 0) {
      const validServices = services.filter((s: any) => s.name?.trim());
      if (validServices.length > 0) {
        // Only delete manual services; preserve sourceType='system'
        await (prisma.service as any).deleteMany({
          where: { tenantId: auth.tenantId, sourceType: 'manual' },
        });
        for (const svc of validServices) {
          await (prisma.service as any).create({
            data: {
              tenantId: auth.tenantId,
              name: svc.name.trim(),
              durationMinutes: svc.durationMinutes || 30,
              active: true,
              sourceType: 'manual',
            },
          });
        }
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
