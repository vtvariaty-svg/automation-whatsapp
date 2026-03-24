import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const config = await prisma.handoffConfig.findUnique({
    where: { tenantId: auth.tenantId },
  });

  return NextResponse.json(config ?? null);
}

export async function PUT(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    const config = await prisma.handoffConfig.upsert({
      where: { tenantId: auth.tenantId },
      create: {
        tenantId: auth.tenantId,
        enabled: body.enabled ?? false,
        alertPhone: body.alertPhone ?? null,
        clientMessage: body.clientMessage ?? null,
        operatorMessage: body.operatorMessage ?? null,
        cooldownMinutes: body.cooldownMinutes ?? 60,
        maxAlertsPerConversation: body.maxAlertsPerConversation ?? 3,
        autoSetHuman: body.autoSetHuman ?? true,
        triggerOnLowConfidence: body.triggerOnLowConfidence ?? true,
        triggerOnExplicitRequest: body.triggerOnExplicitRequest ?? true,
        triggerOnRepetition: body.triggerOnRepetition ?? false,
        triggerOnCheckoutError: body.triggerOnCheckoutError ?? false,
        triggerOnNoProduct: body.triggerOnNoProduct ?? false,
      },
      update: {
        enabled: body.enabled ?? undefined,
        alertPhone: body.alertPhone !== undefined ? body.alertPhone : undefined,
        clientMessage: body.clientMessage !== undefined ? body.clientMessage : undefined,
        operatorMessage: body.operatorMessage !== undefined ? body.operatorMessage : undefined,
        cooldownMinutes: body.cooldownMinutes ?? undefined,
        maxAlertsPerConversation: body.maxAlertsPerConversation ?? undefined,
        autoSetHuman: body.autoSetHuman ?? undefined,
        triggerOnLowConfidence: body.triggerOnLowConfidence ?? undefined,
        triggerOnExplicitRequest: body.triggerOnExplicitRequest ?? undefined,
        triggerOnRepetition: body.triggerOnRepetition ?? undefined,
        triggerOnCheckoutError: body.triggerOnCheckoutError ?? undefined,
        triggerOnNoProduct: body.triggerOnNoProduct ?? undefined,
      },
    });

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('[HandoffConfig] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
