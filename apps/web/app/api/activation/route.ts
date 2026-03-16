/**
 * GET /api/activation?period=today|7days|30days
 * L6 – Activation & Revenue Dashboard metrics.
 * Single endpoint — all numbers the product needs to prove adoption and revenue.
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, endOfDay, differenceInDays, format } from 'date-fns';

function periodStart(period: string): Date {
  const now = new Date();
  if (period === '7days')  return startOfDay(subDays(now, 7));
  if (period === '30days') return startOfDay(subDays(now, 30));
  return startOfDay(now); // today
}

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'today';
  const since = periodStart(period);
  const dateFilter = { gte: since };

  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: {
      createdAt: true,
      enabledChannels: true,
      whatsappToken: true,
      instagramToken: true,
      facebookToken: true,
    },
  });
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // ── Run all queries in parallel ─────────────────────────────────────────────
  const [
    automations_active,
    conversations_new,
    messages_inbound,
    messages_outbound,
    ai_messages,
    leads_generated,
    dms_from_comments,
    qualified,
    appointments,
    checkouts_started,
    conversions,
    aiUsageSum,
  ] = await Promise.all([
    prisma.automationRule.count({ where: { tenantId: auth.tenantId, active: true } }),

    prisma.conversation.count({ where: { tenantId: auth.tenantId, createdAt: dateFilter } }),

    prisma.message.count({
      where: { conversation: { tenantId: auth.tenantId }, direction: 'inbound', createdAt: dateFilter },
    }),

    prisma.message.count({
      where: { conversation: { tenantId: auth.tenantId }, direction: 'outbound', createdAt: dateFilter },
    }),

    prisma.message.count({
      where: { conversation: { tenantId: auth.tenantId }, aiGenerated: true, createdAt: dateFilter },
    }),

    prisma.conversionLead.count({ where: { tenantId: auth.tenantId, createdAt: dateFilter } }),

    // DMs initiated by comments = IG moderation items that got a reply action
    prisma.instagramModerationItem.count({
      where: { tenantId: auth.tenantId, status: 'replied', createdAt: dateFilter },
    }),

    // Qualified = sales opportunities beyond "novo_lead"
    prisma.salesOpportunity.count({
      where: {
        tenantId: auth.tenantId,
        status: { in: ['interessado', 'checkout_enviado', 'pago', 'pos_venda'] },
        createdAt: dateFilter,
      },
    }),

    prisma.appointment.count({ where: { tenantId: auth.tenantId, createdAt: dateFilter } }),

    prisma.salesEvent.count({ where: { tenantId: auth.tenantId, createdAt: dateFilter } }),

    prisma.salesEvent.count({ where: { tenantId: auth.tenantId, status: 'paid', createdAt: dateFilter } }),

    // Total AI tokens in period
    prisma.aiUsage.aggregate({
      _sum: { totalTokens: true },
      where: { tenantId: auth.tenantId, createdAt: dateFilter },
    }),
  ]);

  // ── Day-by-day (last 7 days regardless of period — for activation chart) ────
  const dayByDay: { date: string; conversations: number; messages: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const [c, m] = await Promise.all([
      prisma.conversation.count({
        where: { tenantId: auth.tenantId, createdAt: { gte: startOfDay(day), lte: endOfDay(day) } },
      }),
      prisma.message.count({
        where: {
          conversation: { tenantId: auth.tenantId },
          direction: 'inbound',
          createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
        },
      }),
    ]);
    dayByDay.push({ date: format(day, 'dd/MM'), conversations: c, messages: m });
  }

  // ── Derived metrics ──────────────────────────────────────────────────────────
  const reply_rate = messages_inbound > 0
    ? Math.round((messages_outbound / messages_inbound) * 100 * 10) / 10
    : 0;

  const conversion_rate = checkouts_started > 0
    ? Math.round((conversions / checkouts_started) * 100 * 10) / 10
    : 0;

  const tenant_age_days = differenceInDays(new Date(), tenant.createdAt);

  // ── Channel status ───────────────────────────────────────────────────────────
  const channels = {
    whatsapp:  !!tenant.whatsappToken,
    instagram: !!tenant.instagramToken,
    facebook:  !!tenant.facebookToken,
    total: [tenant.whatsappToken, tenant.instagramToken, tenant.facebookToken].filter(Boolean).length,
  };

  // ── Alerts ──────────────────────────────────────────────────────────────────
  const alerts: { type: string; message: string }[] = [];
  if (channels.total === 0) {
    alerts.push({ type: 'no_channel', message: 'Nenhum canal conectado. Conecte WhatsApp, Instagram ou Facebook para ativar o atendimento.' });
  }
  if (channels.total > 0 && conversations_new === 0 && period !== 'today') {
    alerts.push({ type: 'no_activity', message: 'Sem atividade no período. Verifique se o webhook está ativo e se os canais estão recebendo mensagens.' });
  }
  if (automations_active === 0) {
    alerts.push({ type: 'no_automations', message: 'Nenhuma automação ativa. Use o assistente de ativação para criar automações do seu nicho.' });
  }

  return NextResponse.json({
    period,
    channels,
    automations_active,
    conversations_new,
    messages_inbound,
    messages_outbound,
    reply_rate,
    ai_messages,
    ai_tokens: aiUsageSum._sum.totalTokens ?? 0,
    leads_generated,
    dms_from_comments,
    qualified,
    appointments,
    checkouts_started,
    conversions,
    conversion_rate,
    activation: {
      tenant_age_days,
      in_window: tenant_age_days <= 7,
      day_by_day: dayByDay,
    },
    alerts,
  });
}
