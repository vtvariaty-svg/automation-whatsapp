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

/**
 * Dry-run simulator of the WhatsApp webhook processing pipeline.
 *
 * Layer order mirrors processInboundMessage in the real webhook exactly:
 *   1. Welcome          — webhook step C
 *   2. Explicit handoff — webhook step E  (BEFORE automations, unlike old simulator)
 *   3. Pending appt     — webhook step F  (informational — requires live conversation state)
 *   4. Automation       — webhook step G
 *   5. Scheduling       — webhook step H  (new booking intent)
 *   6. Commercial       — webhook step I  (orchestrator)
 *   7. AI fallback      — webhook step K  (with low-confidence handoff note)
 */
export async function POST(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { message, isFirstContact = false } = await req.json();
    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    // Batch all read-only lookups up front
    const [tenant, handoffConfig, services, activeProducts] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: auth.tenantId },
        select: { welcomeMessage: true } as any,
      }),
      prisma.handoffConfig.findUnique({ where: { tenantId: auth.tenantId } }),
      getServices(auth.tenantId),
      prisma.product.findMany({
        where: { tenantId: auth.tenantId, active: true },
        select: { id: true },
      }),
    ]);

    const layerTrace: Array<{
      layer: string;
      label: string;
      checked: boolean;
      matched: boolean;
      reason: string;
    }> = [];

    // ── Layer 1: Welcome (webhook step C) ─────────────────────────────────
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

    // ── Layer 2: Explicit handoff request (webhook step E) ─────────────────
    // IMPORTANT: in production this runs BEFORE keyword automations.
    const explicitHandoff = detectExplicitRequest(message);
    const handoffEnabled = handoffConfig?.enabled ?? false;
    const explicitHandoffMatched = handoffEnabled && explicitHandoff;
    layerTrace.push({
      layer: 'handoff_explicit',
      label: 'Pedido Explícito de Atendente',
      checked: handoffEnabled,
      matched: explicitHandoffMatched,
      reason: !handoffEnabled
        ? 'Handoff não está ativado'
        : explicitHandoffMatched
        ? 'Cliente solicitou explicitamente falar com atendente humano'
        : 'Sem pedido explícito de handoff detectado',
    });
    if (explicitHandoffMatched) {
      return NextResponse.json({
        resolvedLayer: 'handoff_explicit',
        message:
          handoffConfig?.clientMessage ||
          'Entendido! Vou transferir você para um de nossos atendentes.',
        reason: 'Pedido explícito de handoff — verificado antes das automações em produção',
        layerTrace,
      });
    }

    // ── Layer 3: Pending appointment state (webhook step F) ────────────────
    // Cannot be simulated: depends on in-flight conversation state in the DB
    // (customer mid-flow: selecting_slot, confirming_cancel, selecting_new_slot).
    // Shown here so operators understand it exists in the real pipeline.
    layerTrace.push({
      layer: 'pending_appointment',
      label: 'Estado de Agendamento Pendente',
      checked: false,
      matched: false,
      reason:
        'Não simulável — depende do estado de conversa ativa do cliente (ex: cliente já está selecionando horário). Em produção esta camada tem prioridade sobre automações.',
    });

    // ── Layer 4: Keyword automation (webhook step G) ───────────────────────
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

    // ── Layer 5: Scheduling / appointment intent (webhook step H) ──────────
    const hasServices = (services as any[]).length > 0;
    const schedulingIntent = hasSchedulingIntent(message);
    const schedulingMatched = hasServices && schedulingIntent;
    layerTrace.push({
      layer: 'scheduling',
      label: 'Fluxo de Agendamento (nova intenção)',
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

    // ── Layer 6: Commercial orchestrator (webhook step I) ──────────────────
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
        message:
          '[Orquestrador comercial buscaria produto correspondente e enviaria oferta ou link de checkout]',
        reason: 'Intenção de compra detectada',
        layerTrace,
      });
    }

    // ── Layer 7: AI fallback (webhook step K) ──────────────────────────────
    // Note: in production, low-confidence AI responses may trigger handoff non-blocking.
    layerTrace.push({
      layer: 'ai_fallback',
      label: 'Resposta da IA',
      checked: true,
      matched: true,
      reason:
        'Nenhuma camada determinística respondeu — IA processa livremente. Em produção, baixa confiança pode acionar handoff após a resposta.',
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
