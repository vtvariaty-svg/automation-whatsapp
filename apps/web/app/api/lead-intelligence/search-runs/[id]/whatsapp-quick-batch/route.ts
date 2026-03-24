import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
// @ts-ignore
import { sendWhatsAppMessage } from '@/src/services/whatsappService';

export const dynamic = 'force-dynamic';

const MAX_BATCH = 20;

// Alias to work around stale Prisma client types without crashing at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: searchRunId } = await context.params;

  let body: { candidateIds?: unknown; messageBody?: unknown; batchSize?: unknown } = {};
  try { body = await request.json(); } catch { /* empty body */ }

  const candidateIds = Array.isArray(body.candidateIds) ? body.candidateIds as string[] : [];
  const messageBody = typeof body.messageBody === 'string' ? body.messageBody.trim() : '';
  const batchSize = Math.min(Number(body.batchSize) || MAX_BATCH, MAX_BATCH);

  if (!messageBody) {
    return NextResponse.json({ error: 'messageBody é obrigatório' }, { status: 400 });
  }
  if (candidateIds.length === 0) {
    return NextResponse.json({ error: 'Nenhum candidato selecionado' }, { status: 400 });
  }

  // Validate run ownership
  const searchRun = await db.leadSearchRun.findFirst({
    where: { id: searchRunId, tenantId: auth.tenantId },
  });
  if (!searchRun) return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });

  // Load tenant WhatsApp credentials
  const tenant = await db.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.whatsappPhoneId || !tenant?.whatsappToken) {
    return NextResponse.json({ error: 'WhatsApp não configurado para esta conta' }, { status: 422 });
  }

  // Load candidates with all needed fields
  const candidates: any[] = await db.leadCandidate.findMany({
    where: {
      id: { in: candidateIds },
      tenantId: auth.tenantId,
      searchRunId,
    },
    include: {
      suppressions: {
        where: { active: true },
        select: { channel: true },
      },
    },
  });

  // Eligibility check + skip collection
  interface SkipEntry { candidateId: string; companyName: string; reason: string }
  const eligible: any[] = [];
  const skippedEntries: SkipEntry[] = [];

  for (const c of candidates) {
    if (c.status !== 'approved') {
      skippedEntries.push({ candidateId: c.id, companyName: c.companyName, reason: 'Não aprovado' });
      continue;
    }
    if (c.whatsappConsentStatus !== 'granted') {
      skippedEntries.push({ candidateId: c.id, companyName: c.companyName, reason: 'Sem consentimento WhatsApp' });
      continue;
    }
    const suppressed = (c.suppressions ?? []).some((s: any) => s.channel === 'whatsapp' || s.channel === 'all');
    if (suppressed) {
      skippedEntries.push({ candidateId: c.id, companyName: c.companyName, reason: 'DNC ativo' });
      continue;
    }
    if (c.outreachStatus !== 'ready_whatsapp' && c.outreachStatus !== 'ready_multichannel') {
      skippedEntries.push({ candidateId: c.id, companyName: c.companyName, reason: 'Status de prontidão não permite' });
      continue;
    }
    const phone = c.mobilePhone || c.phone;
    if (!phone) {
      skippedEntries.push({ candidateId: c.id, companyName: c.companyName, reason: 'Sem telefone' });
      continue;
    }
    eligible.push(c);
  }

  // Cap to batchSize
  const processing = eligible.slice(0, batchSize);
  const capped = eligible.length - processing.length;
  for (let i = 0; i < capped; i++) {
    const c = eligible[processing.length + i];
    skippedEntries.push({ candidateId: c.id, companyName: c.companyName, reason: `Excede limite do lote (max ${batchSize})` });
  }

  // Create execution record
  const execution = await db.leadCampaignExecution.create({
    data: {
      tenantId: auth.tenantId,
      searchRunId,
      channel: 'whatsapp',
      status: 'running',
      requestedCount: candidateIds.length,
      eligibleCount: eligible.length,
      sentCount: 0,
      failedCount: 0,
      skippedCount: skippedEntries.length,
      batchSize,
      startedAt: new Date(),
    },
  });

  // Send messages
  let sent = 0;
  let failed = 0;

  for (const c of processing) {
    const phone = (c.mobilePhone || c.phone).replace(/\D/g, '');
    let success = false;
    let providerMessageId: string | undefined;
    let errorMessage: string | undefined;

    try {
      const result = await sendWhatsAppMessage(phone, messageBody, tenant.whatsappPhoneId, tenant.whatsappToken);
      providerMessageId = result?.messages?.[0]?.id || 'unknown';
      success = true;
      sent++;
    } catch (err: any) {
      errorMessage = err?.response?.data?.error?.message || err?.message || 'Erro ao enviar';
      failed++;
    }

    await db.leadCampaignExecutionItem.create({
      data: {
        tenantId: auth.tenantId,
        executionId: execution.id,
        leadCandidateId: c.id,
        channel: 'whatsapp',
        status: success ? 'sent' : 'failed',
        deliveredTo: success ? phone : null,
        providerMessageId: providerMessageId ?? null,
        reason: errorMessage ?? null,
        processedAt: new Date(),
      },
    });
  }

  // Finalize execution
  await db.leadCampaignExecution.update({
    where: { id: execution.id },
    data: {
      status: failed === processing.length && processing.length > 0 ? 'failed' : sent > 0 ? 'completed' : 'partial',
      sentCount: sent,
      failedCount: failed,
      skippedCount: skippedEntries.length + capped,
      finishedAt: new Date(),
    },
  });

  const reasonCounts: Record<string, number> = {};
  for (const s of skippedEntries) {
    reasonCounts[s.reason] = (reasonCounts[s.reason] ?? 0) + 1;
  }

  return NextResponse.json({
    selected: candidateIds.length,
    eligible: eligible.length,
    processed: processing.length,
    sent,
    failed,
    skipped: skippedEntries.length,
    skippedReasons: reasonCounts,
    executionId: execution.id,
  });
}
