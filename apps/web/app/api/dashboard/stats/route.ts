import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const tenantId = auth.tenantId;

    // Get the start of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total and Active Conversations
    const convStats = await prisma.conversation.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    });

    let totalConversations = 0;
    let activeConversations = 0;

    for (const stat of convStats) {
      totalConversations += stat._count._all;
      if (['open', 'ai', 'human'].includes(stat.status)) {
        activeConversations += stat._count._all;
      }
    }

    // 2. Messages this month
    const messagesThisMonth = await prisma.message.count({
      where: {
        conversation: { tenantId },
        createdAt: { gte: startOfMonth },
        direction: 'outbound'
      },
    });

    // 3. AI Response Rate (percentage of AI answers among ALL outbound messages this month)
    const outboundMessages = await prisma.message.count({
      where: { conversation: { tenantId }, createdAt: { gte: startOfMonth }, direction: 'outbound' }
    });

    const aiMessages = await prisma.message.count({
      where: { conversation: { tenantId }, createdAt: { gte: startOfMonth }, direction: 'outbound', aiGenerated: true }
    });

    const aiResponseRate = outboundMessages > 0 ? Math.round((aiMessages / outboundMessages) * 100) : 0;

    return NextResponse.json({
      totalConversations,
      activeConversations,
      messagesThisMonth,
      aiResponseRate
    });
  } catch (error: any) {
    console.error('[DashboardStats] Falha ao consultar métricas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
