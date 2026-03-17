import { prisma } from '@/lib/prisma';

const RECENT_MESSAGES_LIMIT = 10;

/**
 * Cria ou atualiza o perfil de memória de um cliente.
 */
export async function upsertCustomerMemory(
  tenantId: string,
  contactId: string,
  data: { name?: string; preferences?: string; notes?: string }
) {
  return prisma.customerMemory.upsert({
    where: { tenantId_contactId: { tenantId, contactId } },
    create: { tenantId, contactId, ...data },
    update: { ...data }
  });
}

/**
 * Tenta extrair o nome do cliente a partir do texto da mensagem.
 * Detecta padrões como "meu nome é X", "me chamo X", "sou X", "pode me chamar de X".
 */
export function extractNameFromText(text: string): string | null {
  const patterns = [
    /meu nome[  ]é[  ]([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /me chamo[  ]([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /pode me chamar de[  ]([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*)/i,
    /sou (?:a |o )?([A-ZÀ-Ú][a-zà-ú]+(?:\s[A-ZÀ-Ú][a-zà-ú]+)*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

/**
 * Monta o bloco de contexto do cliente para injetar no prompt da IA.
 * Agrega: perfil salvo + histórico recente + oportunidades + compras + pedidos.
 */
export async function buildCustomerContext(
  tenantId: string,
  contactId: string
): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const [memory, conversation, openOpportunities, paidEvents, recentOrders, upcomingAppointments] =
    await Promise.all([
      // Perfil salvo
      prisma.customerMemory.findUnique({
        where: { tenantId_contactId: { tenantId, contactId } }
      }),

      // Últimas mensagens da conversa
      prisma.conversation.findFirst({
        where: { customerPhone: contactId, tenantId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: RECENT_MESSAGES_LIMIT
          }
        }
      }),

      // Oportunidades em aberto (ainda não pagas)
      prisma.salesOpportunity.findMany({
        where: {
          tenantId,
          contactId,
          status: { in: ['novo_lead', 'interessado', 'checkout_enviado'] }
        },
        include: { product: true },
        orderBy: { updatedAt: 'desc' },
        take: 3
      }),

      // Compras confirmadas pelo Stripe
      prisma.salesEvent.findMany({
        where: { tenantId, contactId, status: 'paid' },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Pedidos recentes
      prisma.order.findMany({
        where: { tenantId, customerPhone: contactId },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),

      // AG2 — Agendamentos futuros/ativos
      prisma.appointment.findMany({
        where: {
          tenantId,
          customerPhone: contactId,
          status: { in: ['agendado', 'confirmado'] },
          date: { gte: today },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        take: 3,
      }),
    ]);

  const lines: string[] = ['CONTEXTO DO CLIENTE:'];

  // Nome e perfil
  if (memory?.name) lines.push(`Nome: ${memory.name}`);
  if (memory?.preferences) lines.push(`Preferências: ${memory.preferences}`);
  if (memory?.notes) lines.push(`Observações: ${memory.notes}`);

  // Histórico recente (ordem cronológica)
  if (conversation?.messages?.length) {
    const recent = [...conversation.messages].reverse(); // DESC → ASC
    lines.push('\nHistórico recente da conversa:');
    for (const msg of recent) {
      const label = msg.role === 'user' ? 'Cliente' : 'IA';
      const preview = msg.content.length > 200
        ? msg.content.slice(0, 200) + '...'
        : msg.content;
      lines.push(`${label}: ${preview}`);
    }
  }

  // Oportunidades em andamento
  if (openOpportunities.length > 0) {
    lines.push('\nOportunidades em andamento:');
    for (const opp of openOpportunities) {
      const productName = opp.product?.name ?? 'produto não identificado';
      const value = opp.value ? ` (R$ ${opp.value.toFixed(2)})` : '';
      lines.push(`- ${productName}${value} [${opp.status}]`);
    }
  }

  // Compras realizadas
  if (paidEvents.length > 0) {
    lines.push('\nCompras realizadas:');
    for (const event of paidEvents) {
      const productName = event.product?.name ?? 'produto não identificado';
      lines.push(`- ${productName}`);
    }
  }

  // Pedidos
  if (recentOrders.length > 0) {
    lines.push('\nPedidos recentes:');
    for (const order of recentOrders) {
      lines.push(`- ${order.product ?? 'item'} — ${order.status} (R$ ${order.price.toFixed(2)})`);
    }
  }

  // Agendamentos futuros
  if (upcomingAppointments.length > 0) {
    lines.push('\nAgendamentos próximos:');
    for (const appt of upcomingAppointments) {
      const dateStr = appt.date ?? '?';
      const timeStr = appt.time ? ` às ${appt.time}h` : '';
      lines.push(`- ${appt.service ?? 'Serviço'}${timeStr} em ${dateStr} [${appt.status}]`);
    }
  }

  // Se não há nenhum contexto relevante além do cabeçalho, retorna string vazia
  if (lines.length === 1) return '';

  return lines.join('\n');
}
