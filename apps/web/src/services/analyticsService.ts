import { prisma } from '@/lib/prisma';
import { subDays, startOfDay } from 'date-fns';

export async function getAnalytics(tenantId: string, period: string) {
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

  const dateFilter = {
    gte: startDate
  };

  // Run all count queries concurrently using Promise.all for performance
  const [
    messages_inbound,
    messages_outbound,
    ai_responses,
    human_responses,
    new_conversations,
    appointments_created
  ] = await Promise.all([
    // Mensagens recebidas
    prisma.message.count({
      where: {
        conversation: { tenantId },
        direction: 'inbound',
        createdAt: dateFilter
      }
    }),
    // Mensagens enviadas (geral)
    prisma.message.count({
      where: {
        conversation: { tenantId },
        direction: 'outbound',
        createdAt: dateFilter
      }
    }),
    // Respostas da IA
    prisma.message.count({
      where: {
        conversation: { tenantId },
        aiGenerated: true,
        createdAt: dateFilter
      }
    }),
    // Respostas humanas
    prisma.message.count({
      where: {
        conversation: { tenantId },
        direction: 'outbound',
        aiGenerated: false,
        createdAt: dateFilter
      }
    }),
    // Novas conversas
    prisma.conversation.count({
      where: {
        tenantId,
        createdAt: dateFilter
      }
    }),
    // Agendamentos criados
    prisma.appointment.count({
      where: {
        tenantId,
        createdAt: dateFilter
      }
    })
  ]);

  return {
    messages_inbound,
    messages_outbound,
    ai_responses,
    human_responses,
    new_conversations,
    appointments_created
  };
}
