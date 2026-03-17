import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { sendTemplateMessage } from '@/src/services/automationService';

// ── Criação ───────────────────────────────────────────────────────────────────

interface CreateBroadcastInput {
  tenantId: string;
  templateName: string;
  templateLang?: string;
  variables?: Record<string, string>;
  recipients: { phone: string; customerName?: string; variables?: Record<string, string> }[];
  scheduledAt?: Date | null;
  createdBy?: string;
  source?: string;
  idempotencyKey?: string;
}

export async function createBroadcast(input: CreateBroadcastInput) {
  const {
    tenantId, templateName, templateLang = 'pt_BR',
    variables, recipients, scheduledAt, createdBy, source, idempotencyKey,
  } = input;

  if (!recipients || recipients.length === 0) {
    throw new Error('Pelo menos um destinatário é obrigatório.');
  }

  // Idempotência: verificar se já existe broadcast com mesmo key
  if (idempotencyKey) {
    const existing = await prisma.templateBroadcast.findUnique({
      where: { idempotencyKey },
    });
    if (existing) return existing;
  }

  const status = scheduledAt ? 'scheduled' : 'draft';

  const broadcast = await prisma.templateBroadcast.create({
    data: {
      tenantId,
      templateName,
      templateLang,
      variables: variables || undefined,
      status,
      scheduledAt,
      totalRecipients: recipients.length,
      createdBy,
      source: source || 'manual',
      idempotencyKey,
      recipients: {
        create: recipients.map(r => ({
          phone: r.phone.replace(/\D/g, ''),
          customerName: r.customerName || null,
          variables: r.variables || undefined,
        })),
      },
    },
    include: { recipients: true },
  });

  return broadcast;
}

// ── Cancelamento ──────────────────────────────────────────────────────────────

export async function cancelBroadcast(tenantId: string, broadcastId: string) {
  const broadcast = await prisma.templateBroadcast.findFirst({
    where: { id: broadcastId, tenantId },
  });

  if (!broadcast) throw new Error('Envio não encontrado.');
  if (!['draft', 'scheduled'].includes(broadcast.status)) {
    throw new Error('Só é possível cancelar envios que ainda não foram iniciados.');
  }

  return prisma.templateBroadcast.update({
    where: { id: broadcastId },
    data: { status: 'cancelled' },
  });
}

// ── Listagem ──────────────────────────────────────────────────────────────────

export async function getBroadcasts(tenantId: string) {
  return prisma.templateBroadcast.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { recipients: true } },
    },
  });
}

export async function getBroadcastDetail(tenantId: string, broadcastId: string) {
  return prisma.templateBroadcast.findFirst({
    where: { id: broadcastId, tenantId },
    include: {
      recipients: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

// ── Processamento Cron ────────────────────────────────────────────────────────

export async function processPendingBroadcasts(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();
  let totalSent = 0;
  let totalFailed = 0;

  // Atomic claim: marca broadcasts scheduled como processing
  const claimed = await prisma.templateBroadcast.updateMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
    data: {
      status: 'processing',
      startedAt: now,
    },
  });

  if (claimed.count === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  // Buscar os broadcasts que acabamos de clamar
  const broadcasts = await prisma.templateBroadcast.findMany({
    where: { status: 'processing', startedAt: now },
    include: {
      recipients: { where: { status: 'pending' } },
    },
  });

  for (const broadcast of broadcasts) {
    let sent = 0;
    let failed = 0;

    // Buscar credenciais WhatsApp do tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: broadcast.tenantId },
      select: {
        whatsappPhoneNumberId: true,
        whatsappPhoneId: true,
        whatsappToken: true,
        whatsappConnection: true,
      },
    });

    const rawToken = tenant?.whatsappConnection?.accessToken || tenant?.whatsappToken;
    const token = rawToken ? decrypt(rawToken) : null;
    const phoneId = tenant?.whatsappConnection?.phoneNumberId || tenant?.whatsappPhoneNumberId || tenant?.whatsappPhoneId;

    if (!token || !phoneId) {
      // Sem credenciais: marcar tudo como failed
      await prisma.templateBroadcastRecipient.updateMany({
        where: { broadcastId: broadcast.id, status: 'pending' },
        data: { status: 'failed', errorMessage: 'WhatsApp não configurado' },
      });
      await prisma.templateBroadcast.update({
        where: { id: broadcast.id },
        data: {
          status: 'failed',
          failedCount: broadcast.totalRecipients,
          completedAt: new Date(),
        },
      });
      totalFailed += broadcast.totalRecipients;
      continue;
    }

    // Enviar para cada destinatário
    for (const recipient of broadcast.recipients) {
      try {
        // Mesclar variáveis: broadcast defaults + override do destinatário
        const vars = {
          ...(broadcast.variables as Record<string, string> || {}),
          ...(recipient.variables as Record<string, string> || {}),
        };
        const varArray = Object.values(vars);

        await sendTemplateMessage(
          recipient.phone,
          broadcast.templateName,
          phoneId,
          token,
          varArray,
          broadcast.templateLang,
        );

        await prisma.templateBroadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'sent', sentAt: new Date() },
        });
        sent++;
      } catch (err: any) {
        await prisma.templateBroadcastRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'failed',
            errorMessage: err.message?.slice(0, 500) || 'Erro desconhecido',
          },
        });
        failed++;
      }
    }

    // Atualizar contadores do broadcast
    const finalStatus = failed === 0
      ? 'completed'
      : sent === 0
        ? 'failed'
        : 'partially_failed';

    await prisma.templateBroadcast.update({
      where: { id: broadcast.id },
      data: {
        status: finalStatus,
        sentCount: sent,
        failedCount: failed,
        completedAt: new Date(),
      },
    });

    totalSent += sent;
    totalFailed += failed;
  }

  console.log(`[Broadcast] Ciclo concluído — ${broadcasts.length} broadcasts, ${totalSent} enviados, ${totalFailed} falhas`);
  return { processed: broadcasts.length, sent: totalSent, failed: totalFailed };
}
