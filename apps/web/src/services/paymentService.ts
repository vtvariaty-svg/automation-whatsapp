/**
 * paymentService.ts
 * Business logic for transactional payments (Asaas).
 * Source of truth: webhook events only — status never confirmed from frontend.
 */

import { prisma } from '@/lib/prisma';
import {
  createOrFindAsaasCustomer,
  createCharge,
} from '@/lib/services/asaasService';

// ── Valid Payment status transitions ──────────────────────────────────────────
const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  pending:   ['confirmed', 'failed', 'overdue', 'canceled'],
  overdue:   ['confirmed', 'canceled'],
  confirmed: ['refunded'],
  failed:    [],
  canceled:  [],
  refunded:  [],
};

function canTransition(from: string, to: string): boolean {
  return PAYMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Map Asaas event type → internal status ────────────────────────────────────
const EVENT_TO_STATUS: Record<string, string | null> = {
  PAYMENT_RECEIVED:  'confirmed',
  PAYMENT_CONFIRMED: 'confirmed',
  PAYMENT_OVERDUE:   'overdue',
  PAYMENT_DELETED:   'canceled',
  PAYMENT_REFUNDED:  'refunded',
};

// ── createPaymentLink ─────────────────────────────────────────────────────────

export interface CreatePaymentInput {
  tenantId: string;
  orderId?: string;
  appointmentId?: string;
  customerData: {
    name: string;
    phone: string;
    email?: string;
    cpfCnpj?: string;
  };
  amount: number;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  billingType?: string; // BOLETO | PIX | CREDIT_CARD | UNDEFINED (default)
}

export async function createPaymentLink(input: CreatePaymentInput) {
  // 1. Load and validate tenant payment config
  const config = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId: input.tenantId },
  });

  if (!config) throw new Error('Configuração de pagamento não encontrada para este tenant.');
  if (!config.enabled) throw new Error('Pagamentos não estão habilitados para este tenant.');

  const billingType = input.billingType ?? 'UNDEFINED';

  // 2. Create or find Asaas customer
  const providerCustomerId = await createOrFindAsaasCustomer(
    config.apiKey,
    config.environment,
    input.customerData
  );

  // 3. Create individual charge on Asaas
  const charge = await createCharge(config.apiKey, config.environment, {
    customerId: providerCustomerId,
    billingType,
    value: input.amount,
    dueDate: input.dueDate,
    description: input.description,
  });

  // 4. Persist Payment
  const payment = await prisma.payment.create({
    data: {
      tenantId:           input.tenantId,
      orderId:            input.orderId ?? null,
      appointmentId:      input.appointmentId ?? null,
      provider:           'asaas',
      providerPaymentId:  charge.providerPaymentId,
      providerCustomerId,
      invoiceUrl:         charge.invoiceUrl,
      pixCopiaECola:      charge.pixCopiaECola,
      pixQrCodeBase64:    charge.pixQrCodeBase64,
      status:             'pending',
      amount:             input.amount,
      currency:           'BRL',
      description:        input.description ?? null,
      customerName:       input.customerData.name,
      customerPhone:      input.customerData.phone,
      customerEmail:      input.customerData.email ?? null,
      customerCpfCnpj:    input.customerData.cpfCnpj ?? null,
      dueDate:            input.dueDate,
      billingType:        charge.billingType,
    },
  });

  // 5. Link payment to Order and advance status to payment_pending
  if (input.orderId) {
    await prisma.order.update({
      where: { id: input.orderId },
      data:  {
        paymentId: payment.id,
        status:    'pending_payment',
        statusHistory: {
          create: {
            fromStatus: 'draft',
            toStatus:   'pending_payment',
            changedBy:  'payment_service',
            reason:     `Cobrança Asaas criada: ${charge.providerPaymentId}`,
          },
        },
      },
    });
  }

  // 6. Link payment to Appointment and set paymentStatus = payment_pending
  if (input.appointmentId) {
    await prisma.appointment.update({
      where: { id: input.appointmentId },
      data:  {
        paymentId:     payment.id,
        paymentStatus: 'payment_pending',
      },
    });
  }

  return payment;
}

// ── processWebhookEvent ───────────────────────────────────────────────────────

export interface WebhookEventInput {
  tenantId: string;
  asaasAccessTokenHeader: string | null;
  rawEvent: Record<string, any>;
}

export async function processWebhookEvent(input: WebhookEventInput): Promise<{ status: number; message: string }> {
  const { tenantId, asaasAccessTokenHeader, rawEvent } = input;

  // 1. Load config and validate webhook auth token
  const config = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId },
  });

  if (!config) return { status: 401, message: 'Tenant config not found' };

  if (!asaasAccessTokenHeader || asaasAccessTokenHeader !== config.webhookAuthToken) {
    return { status: 401, message: 'Invalid webhook token' };
  }

  // 2. Extract event identifiers
  const providerEventId: string | undefined = rawEvent?.id;
  const eventType: string | undefined = rawEvent?.event;
  const providerPaymentId: string | undefined = rawEvent?.payment?.id;

  if (!providerEventId || !eventType || !providerPaymentId) {
    return { status: 400, message: 'Missing required fields: id, event, payment.id' };
  }

  const targetStatus = EVENT_TO_STATUS[eventType];
  if (targetStatus === undefined) {
    // Unknown event type — acknowledge without processing
    return { status: 200, message: 'Event type not handled' };
  }

  // 3. Find the internal Payment record
  const payment = await prisma.payment.findUnique({
    where: { providerPaymentId },
  });

  if (!payment) {
    // May arrive before our Payment record exists — log and ack
    console.warn(`[PaymentWebhook] Payment not found for providerPaymentId=${providerPaymentId}`);
    return { status: 200, message: 'Payment not found — acknowledged' };
  }

  // 4. Insert PaymentEvent — unique on providerEventId = idempotency gate
  try {
    await prisma.paymentEvent.create({
      data: {
        paymentId:        payment.id,
        tenantId,
        providerEventId,
        eventType,
        payload:          rawEvent,
        processingStatus: 'processed',
      },
    });
  } catch (err: any) {
    // Unique constraint violation = duplicate event — respond 200 silently
    if (err?.code === 'P2002') {
      return { status: 200, message: 'Duplicate event — ignored' };
    }
    // Unexpected error
    await prisma.paymentEvent.create({
      data: {
        paymentId:        payment.id,
        tenantId,
        providerEventId:  `${providerEventId}_err_${Date.now()}`,
        eventType,
        payload:          rawEvent,
        processingStatus: 'failed',
        errorMessage:     err?.message ?? 'Unknown error inserting event',
      },
    }).catch(() => {}); // best-effort
    return { status: 200, message: 'Event processing failed — acknowledged' };
  }

  // 5. Validate and apply status transition
  if (targetStatus === null || !canTransition(payment.status, targetStatus)) {
    return { status: 200, message: `No transition needed: ${payment.status} → ${targetStatus}` };
  }

  const now = new Date();

  try {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:   targetStatus,
        paidAt:   targetStatus === 'confirmed' ? now : undefined,
        failedAt: targetStatus === 'failed'    ? now : undefined,
      },
    });

    // 6. Propagate to Order
    if (payment.orderId) {
      if (targetStatus === 'confirmed') {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'paid',
            paidAt: now,
            statusHistory: {
              create: {
                fromStatus: 'pending_payment',
                toStatus:   'paid',
                changedBy:  'webhook',
                reason:     `Pagamento confirmado pelo Asaas. Evento: ${eventType}`,
              },
            },
          },
        });
      } else if (targetStatus === 'canceled') {
        // Roll order back to draft so tenant can retry
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: 'draft',
            statusHistory: {
              create: {
                fromStatus: 'pending_payment',
                toStatus:   'draft',
                changedBy:  'webhook',
                reason:     `Cobrança cancelada no Asaas. Evento: ${eventType}`,
              },
            },
          },
        });
      }
    }

    // 7. Propagate to Appointment
    if (payment.appointmentId) {
      if (targetStatus === 'confirmed') {
        await prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            paymentStatus: 'payment_confirmed',
            status:        'confirmado', // MVP: auto-confirm on payment
            confirmedAt:   now,
          },
        });
      } else if (targetStatus === 'failed' || targetStatus === 'canceled') {
        await prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: { paymentStatus: 'payment_failed' },
        });
      }
    }
  } catch (err: any) {
    // Update PaymentEvent to reflect processing failure
    await prisma.paymentEvent.updateMany({
      where: { providerEventId },
      data: {
        processingStatus: 'failed',
        errorMessage:     err?.message ?? 'Propagation error',
      },
    }).catch(() => {});
    console.error('[PaymentWebhook] Propagation error', err);
  }

  return { status: 200, message: 'OK' };
}

// ── listPayments ──────────────────────────────────────────────────────────────

export interface ListPaymentsFilters {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export async function listPayments(tenantId: string, filters?: ListPaymentsFilters) {
  const page  = filters?.page  ?? 1;
  const limit = filters?.limit ?? 20;
  const skip  = (page - 1) * limit;

  const where: any = { tenantId };
  if (filters?.status) where.status = filters.status;
  if (filters?.dateFrom || filters?.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo)   where.createdAt.lte = filters.dateTo;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id:                true,
        status:            true,
        amount:            true,
        currency:          true,
        billingType:       true,
        customerName:      true,
        customerPhone:     true,
        invoiceUrl:        true,
        description:       true,
        dueDate:           true,
        paidAt:            true,
        createdAt:         true,
        orderId:           true,
        appointmentId:     true,
        providerPaymentId: true,
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, page, limit };
}

// ── getPayment ────────────────────────────────────────────────────────────────

export async function getPayment(tenantId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, tenantId },
    include: {
      events: {
        orderBy: { processedAt: 'desc' },
        take: 10,
        select: { eventType: true, processingStatus: true, processedAt: true },
      },
    },
  });

  if (!payment) return null;

  // Never return providerCustomerId / raw credentials
  return {
    ...payment,
    pixQrCodeBase64: payment.pixQrCodeBase64 ?? null,
    pixCopiaECola:   payment.pixCopiaECola   ?? null,
  };
}
