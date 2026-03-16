import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';

export async function getSalesAnalytics(tenantId: string, period: string) {
  let startDate: Date;
  const now = new Date();

  switch (period) {
    case '7days':
      startDate = startOfDay(subDays(now, 7));
      break;
    case '30days':
      startDate = startOfDay(subDays(now, 30));
      break;
    case 'today':
    default:
      startDate = startOfDay(now);
      break;
  }

  const dateFilter = { gte: startDate };

  const [
    sales_conversations,
    checkouts_generated,
    sales_completed
  ] = await Promise.all([
    // Conversas de venda: oportunidades que entraram no funil no período
    prisma.salesOpportunity.count({
      where: { tenantId, createdAt: dateFilter }
    }),
    // Checkouts gerados: eventos Stripe criados no período (fonte transacional)
    prisma.salesEvent.count({
      where: { tenantId, createdAt: dateFilter }
    }),
    // Vendas concluídas: pagamentos confirmados pelo Stripe
    prisma.salesEvent.count({
      where: { tenantId, status: 'paid', createdAt: dateFilter }
    })
  ]);

  const conversion_rate =
    checkouts_generated > 0
      ? Math.round((sales_completed / checkouts_generated) * 100 * 10) / 10
      : 0;

  return {
    sales_conversations,
    checkouts_generated,
    sales_completed,
    conversion_rate
  };
}
