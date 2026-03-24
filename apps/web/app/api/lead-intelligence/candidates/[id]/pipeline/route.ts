/**
 * GET  /api/lead-intelligence/candidates/[id]/pipeline
 *   Returns candidate with pipeline fields, owner name, and the 20 most recent follow-up logs.
 *
 * PATCH /api/lead-intelligence/candidates/[id]/pipeline
 *   Updates any pipeline field (pipelineStage, ownerUserId, priority, nextActionAt,
 *   lastContactAt, internalNotes) and creates audit log entries for each changed field.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
    select: {
      id: true,
      companyName: true,
      pipelineStage: true,
      ownerUserId: true,
      priority: true,
      nextActionAt: true,
      lastContactAt: true,
      internalNotes: true,
      owner: { select: { id: true, name: true, email: true } },
      followUpLogs: {
        orderBy: { loggedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          content: true,
          metadata: true,
          userId: true,
          loggedAt: true,
        },
      },
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ candidate });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

interface PipelinePatchBody {
  pipelineStage?: unknown;
  ownerUserId?: unknown;
  priority?: unknown;
  nextActionAt?: unknown;
  lastContactAt?: unknown;
  internalNotes?: unknown;
}

const VALID_STAGES = new Set(['new', 'contacted', 'interested', 'proposal_sent', 'negotiating', 'won', 'lost']);
const VALID_PRIORITIES = new Set(['low', 'normal', 'high']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
    select: {
      id: true,
      pipelineStage: true,
      ownerUserId: true,
      priority: true,
      nextActionAt: true,
      lastContactAt: true,
      internalNotes: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  let body: PipelinePatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  const logEntries: { type: string; content: string; metadata?: object }[] = [];

  // pipelineStage
  if (typeof body.pipelineStage === 'string' && VALID_STAGES.has(body.pipelineStage)) {
    if (body.pipelineStage !== existing.pipelineStage) {
      update.pipelineStage = body.pipelineStage;
      logEntries.push({
        type: 'stage_change',
        content: `Estágio alterado de "${existing.pipelineStage}" para "${body.pipelineStage}".`,
        metadata: { from: existing.pipelineStage, to: body.pipelineStage },
      });
    }
  }

  // priority
  if (typeof body.priority === 'string' && VALID_PRIORITIES.has(body.priority)) {
    if (body.priority !== existing.priority) {
      update.priority = body.priority;
      logEntries.push({
        type: 'auto_event',
        content: `Prioridade alterada para "${body.priority}".`,
      });
    }
  }

  // ownerUserId
  if (body.ownerUserId === null || typeof body.ownerUserId === 'string') {
    const newOwner = body.ownerUserId === null ? null : (body.ownerUserId as string) || null;
    if (newOwner !== existing.ownerUserId) {
      update.ownerUserId = newOwner;
      logEntries.push({
        type: 'auto_event',
        content: newOwner ? `Responsável atribuído (userId: ${newOwner}).` : 'Responsável removido.',
      });
    }
  }

  // nextActionAt
  if (body.nextActionAt !== undefined) {
    const val = body.nextActionAt === null ? null : (typeof body.nextActionAt === 'string' ? new Date(body.nextActionAt) : null);
    update.nextActionAt = val;
  }

  // lastContactAt
  if (body.lastContactAt !== undefined) {
    const val = body.lastContactAt === null ? null : (typeof body.lastContactAt === 'string' ? new Date(body.lastContactAt) : null);
    update.lastContactAt = val;
    if (val && val.toISOString() !== existing.lastContactAt?.toISOString()) {
      logEntries.push({
        type: 'manual_contact',
        content: `Contato registrado em ${val.toLocaleDateString('pt-BR')}.`,
      });
    }
  }

  // internalNotes
  if (typeof body.internalNotes === 'string' || body.internalNotes === null) {
    update.internalNotes = body.internalNotes ?? null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ candidate: existing });
  }

  const candidate = await prisma.$transaction(async (tx) => {
    const updated = await tx.leadCandidate.update({
      where: { id },
      data: update,
      select: {
        id: true,
        companyName: true,
        pipelineStage: true,
        ownerUserId: true,
        priority: true,
        nextActionAt: true,
        lastContactAt: true,
        internalNotes: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    for (const entry of logEntries) {
      await tx.leadFollowUpLog.create({
        data: {
          tenantId: auth.tenantId,
          leadCandidateId: id,
          type: entry.type,
          content: entry.content,
          metadata: entry.metadata ?? undefined,
        },
      });
    }

    return updated;
  });

  return NextResponse.json({ candidate });
}
