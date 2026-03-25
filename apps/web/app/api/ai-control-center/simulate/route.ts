import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { checkAutomationMatch } from '@/src/services/automationService';
import { detectExplicitRequest } from '@/src/services/handoffService';
import { getServices } from '@/src/services/schedulingService';

const BUY_KEYWORDS = [
  'quero', 'comprar', 'pagar', 'contratar', 'preço', 'valor', 'quanto custa',
  'compro', 'pedido', 'produto', 'disponível', 'link de pagamento',
  'como faço para comprar', 'catálogo', 'cardápio', 'o que vocês têm',
  'tabela de preços', 'ver produtos', 'quais opções', 'lista de produtos',
];

const SCHEDULING_KEYWORDS = [
  'agendar', 'marcar', 'horário', 'consulta', 'disponibilidade',
  'próximo horário', 'quero marcar', 'quando tem', 'reservar',
  'agendamento', 'quero agendar',
];

function hasBuyIntent(msg: string): boolean {
  const lower = msg.toLowerCase();
  return BUY_KEYWORDS.some((k) => lower.includes(k));
}

function hasSchedulingIntent(msg: string): boolean {
  const lower = msg.toLowerCase();
  return SCHEDULING_KEYWORDS.some((k) => lower.includes(k));
}

export async function POST(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message, isFirstContact = false } = await req.json();
    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    const [tenant, handoffConfig, services] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: auth.tenantId },
        select: { welcomeMessage: true } as any,
      }),
      prisma.handoffConfig.findUnique({ where: { tenantId: auth.tenantId } }),
      getServices(auth.tenantId),
    ]);

    const layerTrace: Array<{
      layer: string;
      label: string;
      checked: boolean;
      matched: boolean;
      reason: string;
    }> = [];

    // Layer 1: Welcome
    const hasWelcome = !!((tenant as any)?.welcomeMessage?.trim());
    const welcomeMatched = isFirstContact && hasWelcome;
    layerTrace.push({
      layer: 'welcome',
      label: 'Mensagem de Boas-Vindas',
      checked: isFirstContact,
      matched: welcomeMatched,
      reason: welcomeMatched
        ? 'Primeiro contato — mensagem de boas-vindas seria enviada'
        : isFirstContact
        ? 'Primeiro contato, mas welcomeMessage não está configurada'
        : 'Não é primeiro contato',
    });
    if (welcomeMatched) {
      return NextResponse.json({
        resolvedLayer: 'welcome',
        message: (tenant as any).welcomeMessage,
        reason: 'Mensagem de boas-vindas enviada no primeiro contato',
        layerTrace,
      });
    }

    // Layer 2: Automation
    const automationMatch = await checkAutomationMatch(message, auth.tenantId);
    layerTrace.push({
      layer: 'automation',
      label: 'Automação Determinística',
      checked: true,
      matched: !!automationMatch,
      reason: automationMatch
        ? `Gatilho "${automationMatch.triggerValue}" (${automationMatch.matchType}) correspondeu`
        : 'Nenhuma regra de automação correspondeu',
    });
    if (automationMatch) {
      return NextResponse.json({
        resolvedLayer: 'automation',
        message: automationMatch.responseText,
        reason: `Automação "${automationMatch.name}" acionada`,
        layerTrace,
      });
    }

    // Layer 3: Scheduling
    const hasServices = (services as any[]).length > 0;
    const schedulingIntent = hasSchedulingIntent(message);
    const schedulingMatched = hasServices && schedulingIntent;
    layerTrace.push({
      layer: 'scheduling',
      label: 'Fluxo de Agendamento',
      checked: hasServices,
      matched: schedulingMatched,
      reason: !hasServices
        ? 'Sem serviços cadastrados — camada inativa'
        : schedulingMatched
        ? 'Intenção de agendamento detectada e serviços disponíveis'
        : 'Sem intenção de agendamento detectada',
    });
    if (schedulingMatched) {
      return NextResponse.json({
        resolvedLayer: 'scheduling',
        message: '[Fluxo de agendamento seria iniciado — bot perguntaria data e horário desejado]',
        reason: 'Intenção de agendamento detectada',
        layerTrace,
      });
    }

    // Layer 4: Commercial
    const activeProducts = await prisma.product.findMany({
      where: { tenantId: auth.tenantId, active: true },
      select: { id: true },
    });
    const hasProducts = activeProducts.length > 0;
    const commercialIntent = hasBuyIntent(message);
    const commercialMatched = hasProducts && commercialIntent;
    layerTrace.push({
      layer: 'commercial',
      label: 'Orquestrador Comercial',
      checked: hasProducts,
      matched: commercialMatched,
      reason: !hasProducts
        ? 'Sem produtos ativos — camada inativa'
        : commercialMatched
        ? 'Intenção de compra detectada e produtos disponíveis'
        : 'Sem intenção de compra detectada na mensagem',
    });
    if (commercialMatched) {
      return NextResponse.json({
        resolvedLayer: 'commercial',
        message: '[Orquestrador comercial buscaria produto correspondente e enviaria oferta ou link de checkout]',
        reason: 'Intenção de compra detectada',
        layerTrace,
      });
    }

    // Layer 5: Explicit handoff request
    const explicitHandoff = detectExplicitRequest(message);
    const handoffEnabled = handoffConfig?.enabled ?? false;
    const handoffMatched = handoffEnabled && explicitHandoff;
    layerTrace.push({
      layer: 'handoff',
      label: 'Handoff Humano (pedido explícito)',
      checked: handoffEnabled,
      matched: handoffMatched,
      reason: !handoffEnabled
        ? 'Handoff não está ativado'
        : handoffMatched
        ? 'Cliente solicitou explicitamente falar com atendente humano'
        : 'Sem pedido explícito de handoff detectado',
    });
    if (handoffMatched) {
      return NextResponse.json({
        resolvedLayer: 'handoff',
        message:
          handoffConfig?.clientMessage ||
          'Entendido! Vou transferir você para um de nossos atendentes.',
        reason: 'Pedido explícito de handoff detectado',
        layerTrace,
      });
    }

    // Layer 6: AI fallback
    layerTrace.push({
      layer: 'ai_fallback',
      label: 'Resposta da IA',
      checked: true,
      matched: true,
      reason: 'Nenhuma camada anterior respondeu — IA processa livremente',
    });

    return NextResponse.json({
      resolvedLayer: 'ai_fallback',
      message: '[A IA geraria uma resposta baseada no prompt configurado]',
      reason: 'IA fallback — nenhuma camada determinística respondeu',
      layerTrace,
    });
  } catch (err: any) {
    console.error('[simulate] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
