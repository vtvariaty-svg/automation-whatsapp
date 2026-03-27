import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
// @ts-ignore - Importing from JS file
import { updateTenantAISettings } from '@/src/services/tenantService';
import { getAutomations } from '@/src/services/automationService';
import { getServices } from '@/src/services/schedulingService';
import { marketplaceBots } from '@/lib/marketplace/bots';
import {
  extractPromptWithoutManagedBlocks,
  extractManagedBlock,
  composePromptFromBlocks,
  PRESET_BLOCK_START,
  PRESET_BLOCK_END,
} from '@/lib/ai/guidedSetup';

export async function GET(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [tenant, handoffConfig, automations, services, professionals, products] = await Promise.all([
      // FIX: include businessConfig so address/openingHours/templates load correctly
      prisma.tenant.findUnique({
        where: { id: auth.tenantId },
        include: { businessConfig: true },
      }),
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

    const businessConfig = tenant.businessConfig as any;
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
        // Expose only the manual layer — PRESET and GUIDED blocks are managed separately
        aiPrompt: extractPromptWithoutManagedBlocks((tenant as any).aiPrompt),
        businessHours: (tenant as any).businessHours || '',
      },
      welcome: {
        message: (tenant as any).welcomeMessage || '',
      },
      session: {
        timeoutHours: (tenant as any).sessionTimeoutHours ?? 24,
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
      // FIX: operational scheduling/appointment config now centralised here
      operationalConfig: {
        openingHours: businessConfig?.openingHours || '',
        templateBookingConfirmed: businessConfig?.templateBookingConfirmed || '',
        templateReminder24h: businessConfig?.templateReminder24h || '',
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
        sourceType: (a as any).sourceType || 'manual',
        sourceBotKey: (a as any).sourceBotKey || null,
      })),
      schedulingBehavior: {
        enabled: servicesCount > 0,
        mode: professionalsCount > 0 ? 'com_profissionais' : 'disponibilidade_global',
        servicesCount,
        professionalsCount,
        // FIX: Service model field is durationMinutes, not duration
        services: (services as any[]).map((s) => ({
          id: s.id,
          name: s.name,
          duration: s.durationMinutes,
          active: s.active !== false,
          sourceType: (s as any).sourceType || 'manual',
          sourceBotKey: (s as any).sourceBotKey || null,
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
      const tenantData: Record<string, any> = {};

      if (body.aiIdentity?.aiPrompt !== undefined) {
        // Preserve PRESET and GUIDED blocks — only update the manual layer
        const current = await prisma.tenant.findUnique({
          where: { id: auth.tenantId },
          select: { aiPrompt: true } as any,
        });
        const currentPrompt = (current as any)?.aiPrompt as string | null;
        const presetBlock   = extractManagedBlock(currentPrompt, PRESET_BLOCK_START, PRESET_BLOCK_END);
        const guidedBlock   = extractManagedBlock(currentPrompt, '[GUIDED_SETUP_START]', '[GUIDED_SETUP_END]');
        tenantData.aiPrompt = composePromptFromBlocks({
          presetBlock,
          guidedBlock,
          manualLayer: body.aiIdentity.aiPrompt,
        });
      }

      if (body.aiIdentity?.businessHours !== undefined) {
        tenantData.businessHours = body.aiIdentity.businessHours;
      }
      if (body.welcome?.message !== undefined) {
        tenantData.welcomeMessage = body.welcome.message;
      }

      if (Object.keys(tenantData).length > 0) {
        await prisma.tenant.update({ where: { id: auth.tenantId }, data: tenantData as any });
      }
    }

    // Business context — tenant scalar fields + businessConfig.address via nested upsert
    // FIX: was incorrectly trying to set businessConfig as a plain object on tenant.update
    if (body.businessContext !== undefined) {
      const { companyName, businessType, contactPhone, address } = body.businessContext;
      const tenantScalars: Record<string, any> = {};
      if (companyName !== undefined) tenantScalars.name = companyName;
      if (businessType !== undefined) tenantScalars.businessType = businessType;
      if (contactPhone !== undefined) tenantScalars.phone = contactPhone;

      const configData: Record<string, any> = {};
      if (address !== undefined) configData.address = address;

      if (Object.keys(tenantScalars).length > 0 || Object.keys(configData).length > 0) {
        await prisma.tenant.update({
          where: { id: auth.tenantId },
          data: {
            ...tenantScalars,
            ...(Object.keys(configData).length > 0 && {
              businessConfig: {
                upsert: { create: configData, update: configData },
              },
            }),
          },
        });
      }
    }

    // Operational config — scheduling/appointment-related BusinessConfig fields
    if (body.operationalConfig !== undefined) {
      const { openingHours, templateBookingConfirmed, templateReminder24h } = body.operationalConfig;
      const configData: Record<string, any> = {};
      if (openingHours !== undefined) configData.openingHours = openingHours;
      if (templateBookingConfirmed !== undefined) configData.templateBookingConfirmed = templateBookingConfirmed;
      if (templateReminder24h !== undefined) configData.templateReminder24h = templateReminder24h;

      if (Object.keys(configData).length > 0) {
        await prisma.tenant.update({
          where: { id: auth.tenantId },
          data: {
            businessConfig: {
              upsert: { create: configData, update: configData },
            },
          },
        });
      }
    }

    // Session timeout
    if (body.session !== undefined) {
      const hours = body.session?.timeoutHours;
      if (typeof hours === 'number' && hours >= 1 && hours <= 168) {
        await prisma.tenant.update({
          where: { id: auth.tenantId },
          data: { sessionTimeoutHours: hours } as any,
        });
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
