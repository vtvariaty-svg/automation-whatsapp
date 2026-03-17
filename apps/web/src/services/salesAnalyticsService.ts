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

  // ORDERS_V2 — order-level metrics
  const [
    orders_total,
    orders_paid,
    orders_cancelled,
    orders_refunded,
    orders_revenue,
  ] = await Promise.all([
    prisma.order.count({ where: { tenantId, createdAt: dateFilter } }),
    prisma.order.count({ where: { tenantId, status: { in: ['paid', 'processing', 'completed'] }, createdAt: dateFilter } }),
    prisma.order.count({ where: { tenantId, status: 'cancelled', createdAt: dateFilter } }),
    prisma.order.count({ where: { tenantId, status: 'refunded', createdAt: dateFilter } }),
    prisma.order.aggregate({
      where: { tenantId, status: { in: ['paid', 'processing', 'completed'] }, createdAt: dateFilter },
      _sum: { price: true },
      _avg: { price: true },
    }),
  ]);

  const conversion_rate =
    checkouts_generated > 0
      ? Math.round((sales_completed / checkouts_generated) * 100 * 10) / 10
      : 0;

  return {
    sales_conversations,
    checkouts_generated,
    sales_completed,
    conversion_rate,
    // ORDERS_V2
    orders_total,
    orders_paid,
    orders_cancelled,
    orders_refunded,
    orders_revenue: orders_revenue._sum.price ?? 0,
    orders_avg_ticket: orders_revenue._avg.price ?? 0,
  };
}
