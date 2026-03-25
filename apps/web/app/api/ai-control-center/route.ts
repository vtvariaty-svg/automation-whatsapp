import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
// @ts-ignore - Importing from JS file
import { updateTenantAISettings } from '@/src/services/tenantService';
import { getAutomations } from '@/src/services/automationService';
import { getServices } from '@/src/services/schedulingService';
import { marketplaceBots } from '@/lib/marketplace/bots';

export async function GET(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [tenant, handoffConfig, automations, services, professionals, products] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: auth.tenantId } }),
      prisma.handoffConfig.findUnique({ where: { tenantId: auth.tenantId } }),
      getAutomations(auth.tenantId),
      getServices(auth.tenantId),
      prisma.professional.findMany({ where: { tenantId: auth.tenantId } }),
      prisma.product.findMany({
        where: { tenantId: auth.tenantId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const businessConfig = (tenant as any).businessConfig as Record<string, any> | null;
    const activeBotKey = (tenant as any).activeBotKey as string | null;
    const activeBot = activeBotKey ? marketplaceBots.find((b) => b.id === activeBotKey) : null;
    const servicesCount = (services as any[]).length;
    const professionalsCount = professionals.length;

    return NextResponse.json({
      businessContext: {
        companyName: tenant.name || '',
        businessType: (tenant as any).businessType || '',
        contactPhone: (tenant as any).phone || '',
        address: businessConfig?.address || '',
      },
      aiIdentity: {
        aiPrompt: (tenant as any).aiPrompt || '',
        businessHours: (tenant as any).businessHours || '',
      },
      welcome: {
        message: (tenant as any).welcomeMessage || '',
      },
      botPreset: {
        activeBotKey,
        botName: activeBot?.name || null,
        niche: activeBot?.nicheLabel || null,
        tone: activeBot?.toneOfVoice || null,
        description: activeBot?.description || null,
        blueprint: activeBot?.blueprint || null,
        emoji: activeBot?.emoji || null,
      },
      commercialBehavior: {
        products: (products as any[]).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          active: p.active,
          category: p.category,
        })),
      },
      automations: (automations as any[]).map((a) => ({
        id: a.id,
        name: a.name,
        triggerType: a.triggerType,
        triggerValue: a.triggerValue,
        matchType: a.matchType,
        responseType: a.responseType,
        response: a.responseText,
        active: a.active,
      })),
      schedulingBehavior: {
        enabled: servicesCount > 0,
        mode: professionalsCount > 0 ? 'com_profissionais' : 'disponibilidade_global',
        servicesCount,
        professionalsCount,
        services: (services as any[]).map((s) => ({
          id: s.id,
          name: s.name,
          duration: s.duration,
          active: s.active !== false,
        })),
      },
      handoff: {
        enabled: handoffConfig?.enabled ?? false,
        alertPhone: handoffConfig?.alertPhone ?? '',
        clientMessage:
          handoffConfig?.clientMessage ??
          'Entendido! Vou transferir você para um de nossos atendentes. Por favor, aguarde um momento.',
        operatorMessage: handoffConfig?.operatorMessage ?? '',
        cooldownMinutes: handoffConfig?.cooldownMinutes ?? 60,
        maxAlertsPerConversation: handoffConfig?.maxAlertsPerConversation ?? 3,
        autoSetHuman: handoffConfig?.autoSetHuman ?? true,
        triggerOnLowConfidence: handoffConfig?.triggerOnLowConfidence ?? true,
        triggerOnExplicitRequest: handoffConfig?.triggerOnExplicitRequest ?? true,
        triggerOnRepetition: handoffConfig?.triggerOnRepetition ?? false,
        triggerOnCheckoutError: handoffConfig?.triggerOnCheckoutError ?? false,
        triggerOnNoProduct: handoffConfig?.triggerOnNoProduct ?? false,
      },
    });
  } catch (err: any) {
    console.error('[ai-control-center] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // AI identity + welcome
    if (body.aiIdentity !== undefined || body.welcome !== undefined) {
      const aiData: Record<string, string> = {};
      if (body.aiIdentity?.aiPrompt !== undefined) aiData.ai_prompt = body.aiIdentity.aiPrompt;
      if (body.aiIdentity?.businessHours !== undefined) aiData.business_hours = body.aiIdentity.businessHours;
      if (body.welcome?.message !== undefined) aiData.welcome_message = body.welcome.message;
      if (Object.keys(aiData).length > 0) {
        await updateTenantAISettings(auth.tenantId, aiData);
      }
    }

    // Business context
    if (body.businessContext !== undefined) {
      const { companyName, businessType, contactPhone, address } = body.businessContext;
      const tenantUpdate: Record<string, any> = {};
      if (companyName !== undefined) tenantUpdate.name = companyName;
      if (businessType !== undefined) tenantUpdate.businessType = businessType;
      if (contactPhone !== undefined) tenantUpdate.phone = contactPhone;
      if (address !== undefined) {
        const current = await prisma.tenant.findUnique({
          where: { id: auth.tenantId },
          select: { businessConfig: true },
        });
        const existing = ((current?.businessConfig as Record<string, any>) ?? {});
        tenantUpdate.businessConfig = { ...existing, address };
      }
      if (Object.keys(tenantUpdate).length > 0) {
        await prisma.tenant.update({ where: { id: auth.tenantId }, data: tenantUpdate });
      }
    }

    // Handoff
    if (body.handoff !== undefined) {
      const { tenantId: _ignored, ...handoffData } = body.handoff;
      await prisma.handoffConfig.upsert({
        where: { tenantId: auth.tenantId },
        create: { tenantId: auth.tenantId, ...handoffData },
        update: handoffData,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[ai-control-center] PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
