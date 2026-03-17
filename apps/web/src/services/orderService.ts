import { prisma } from '@/lib/prisma';
import { executeOrderAutomations } from '@/src/services/automationService';

// ── Emit order event (trigger automations) ────────────────────────────────────
async function emitOrderEvent(
  tenantId: string,
  orderId: string,
  newStatus: string,
  contactPhone: string,
  context?: { origin?: string; conversationId?: string }
): Promise<void> {
  const result = await executeOrderAutomations(tenantId, orderId, newStatus, contactPhone, context);
  if (result.triggered > 0) {
    console.log(`[OrderEvent] order=${orderId.slice(0, 8)} status=${newStatus} triggered=${result.triggered} sent=${result.sent}`);
  }
}

// ── Valid status transitions ──────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_payment', 'paid', 'processing', 'cancelled'],
  pending_payment: ['paid', 'failed', 'cancelled'],
  paid: ['processing', 'refunded'],
  processing: ['completed', 'cancelled'],
  completed: ['refunded'],
  failed: ['pending_payment'],
  cancelled: [],
  refunded: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Status ↔ timestamp mapping ────────────────────────────────────────────────
function timestampsForStatus(status: string): Record<string, Date | null> {
  const now = new Date();
  switch (status) {
    case 'paid': return { paidAt: now };
    case 'completed': return { completedAt: now };
    case 'cancelled': return { cancelledAt: now };
    case 'refunded': return { refundedAt: now };
    default: return {};
  }
}

// ── Migrate legacy statuses ───────────────────────────────────────────────────
const LEGACY_STATUS_MAP: Record<string, string> = {
  novo: 'draft',
  confirmado: 'processing',
  preparando: 'processing',
  enviado: 'processing',
  finalizado: 'completed',
};

export function normalizeStatus(status: string): string {
  return LEGACY_STATUS_MAP[status] ?? status;
}

// ── Create order ──────────────────────────────────────────────────────────────
export interface CreateOrderInput {
  tenantId: string;
  customerPhone: string;
  customerName?: string;
  contactId?: string;
  conversationId?: string;
  origin?: string;
  currency?: string;
  notes?: string;
  status?: string;
  items?: {
    productId?: string;
    name: string;
    quantity?: number;
    unitPrice?: number;
  }[];
  // Legacy compat
  product?: string;
  price?: number;
}

export async function createOrder(input: CreateOrderInput, userId?: string) {
  const items = input.items ?? [];
  let subtotal = 0;

  // If legacy single-product format, convert to item
  if (items.length === 0 && input.product) {
    items.push({
      name: input.product,
      quantity: 1,
      unitPrice: input.price ?? 0,
    });
  }

  // Calculate subtotal from items
  const itemsData = items.map((item) => {
    const qty = item.quantity ?? 1;
    const unit = item.unitPrice ?? 0;
    const total = qty * unit;
    subtotal += total;
    return {
      productId: item.productId ?? null,
      name: item.name,
      quantity: qty,
      unitPrice: unit,
      totalPrice: total,
    };
  });

  const status = input.status ?? 'draft';

  const order = await prisma.order.create({
    data: {
      tenantId: input.tenantId,
      customerPhone: input.customerPhone,
      customerName: input.customerName ?? null,
      contactId: input.contactId ?? null,
      conversationId: input.conversationId ?? null,
      origin: input.origin ?? 'manual',
      product: items.length === 1 ? items[0].name : (items.length > 0 ? `${items.length} itens` : null),
      price: subtotal,
      subtotal,
      discount: 0,
      currency: input.currency ?? 'BRL',
      status,
      notes: input.notes ?? null,
      ...timestampsForStatus(status),
      items: { create: itemsData },
      statusHistory: {
        create: {
          fromStatus: '',
          toStatus: status,
          changedBy: userId ?? null,
        },
      },
    },
    include: { items: true, statusHistory: true },
  });

  // Fire order automation event (non-blocking)
  emitOrderEvent(input.tenantId, order.id, status, input.customerPhone, {
    origin: input.origin,
    conversationId: input.conversationId,
  }).catch(() => {});

  return order;
}

// ── Update order status ───────────────────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  tenantId: string,
  newStatus: string,
  userId?: string,
  reason?: string
) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new Error('Pedido não encontrado');

  const currentStatus = normalizeStatus(order.status);

  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(`Transição inválida: ${currentStatus} → ${newStatus}`);
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      ...timestampsForStatus(newStatus),
      ...(newStatus === 'cancelled' && reason ? { cancelReason: reason } : {}),
      statusHistory: {
        create: {
          fromStatus: currentStatus,
          toStatus: newStatus,
          changedBy: userId ?? null,
          reason: reason ?? null,
        },
      },
    },
    include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
  });

  // Fire order automation event (non-blocking)
  emitOrderEvent(tenantId, orderId, newStatus, order.customerPhone, {
    origin: order.origin,
    conversationId: order.conversationId ?? undefined,
  }).catch(() => {});

  return updated;
}

// ── Cancel order ──────────────────────────────────────────────────────────────
export async function cancelOrder(orderId: string, tenantId: string, userId?: string, reason?: string) {
  return updateOrderStatus(orderId, tenantId, 'cancelled', userId, reason);
}

// ── Refund order ──────────────────────────────────────────────────────────────
export async function refundOrder(orderId: string, tenantId: string, userId?: string) {
  return updateOrderStatus(orderId, tenantId, 'refunded', userId, 'Reembolso solicitado');
}

// ── Add note ──────────────────────────────────────────────────────────────────
export async function addOrderNote(orderId: string, tenantId: string, content: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, tenantId } });
  if (!order) throw new Error('Pedido não encontrado');

  const existing = order.notes ? order.notes + '\n' : '';
  const timestamp = new Date().toISOString();

  return prisma.order.update({
    where: { id: orderId },
    data: { notes: `${existing}[${timestamp}] ${content}` },
  });
}

// ── Get order with details ────────────────────────────────────────────────────
export async function getOrderWithDetails(orderId: string, tenantId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });
}

// ── List orders with filters ──────────────────────────────────────────────────
export interface ListOrdersFilters {
  status?: string;
  origin?: string;
  contactId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function listOrders(tenantId: string, filters?: ListOrdersFilters) {
  const where: any = { tenantId };

  if (filters?.status) where.status = filters.status;
  if (filters?.origin) where.origin = filters.origin;
  if (filters?.contactId) where.contactId = filters.contactId;
  if (filters?.search) {
    where.OR = [
      { customerName: { contains: filters.search, mode: 'insensitive' } },
      { customerPhone: { contains: filters.search } },
      { product: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  return prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
}

// ── Create order from checkout (webhook) — idempotent ─────────────────────────
export async function createOrderFromCheckout(
  tenantId: string,
  contactId: string,
  productId: string,
  productName: string,
  productPrice: number,
  externalPaymentRef: string,
  conversationId?: string
) {
  // Idempotency: if order with this externalPaymentRef already exists, return it
  const existing = await prisma.order.findUnique({
    where: { externalPaymentRef },
    include: { items: true },
  });
  if (existing) return existing;

  return createOrder(
    {
      tenantId,
      customerPhone: contactId,
      contactId,
      conversationId,
      origin: 'checkout',
      status: 'paid',
      items: [
        {
          productId,
          name: productName,
          quantity: 1,
          unitPrice: productPrice,
        },
      ],
    },
    'system'
  );
}

// ── Order analytics ───────────────────────────────────────────────────────────
export async function getOrderAnalytics(tenantId: string, startDate: Date) {
  const dateFilter = { gte: startDate };

  const [total, byStatus, revenueResult] = await Promise.all([
    prisma.order.count({ where: { tenantId, createdAt: dateFilter } }),
    prisma.order.groupBy({
      by: ['status'],
      where: { tenantId, createdAt: dateFilter },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { tenantId, status: { in: ['paid', 'processing', 'completed'] }, createdAt: dateFilter },
      _sum: { price: true },
      _avg: { price: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  byStatus.forEach((s) => { statusCounts[s.status] = s._count; });

  return {
    totalOrders: total,
    byStatus: statusCounts,
    revenue: revenueResult._sum.price ?? 0,
    averageTicket: revenueResult._avg.price ?? 0,
    paid: statusCounts['paid'] ?? 0,
    completed: statusCounts['completed'] ?? 0,
    cancelled: statusCounts['cancelled'] ?? 0,
    refunded: statusCounts['refunded'] ?? 0,
  };
}
