/**
 * GET  /api/lead-intelligence/candidates/[id]/follow-up-log
 *   Returns all follow-up logs for the candidate, ordered desc.
 *
 * POST /api/lead-intelligence/candidates/[id]/follow-up-log
 *   Creates a manual log entry (type: note | manual_contact).
 *   If type is manual_contact, also updates candidate.lastContactAt = now().
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

  // Verify ownership
  const exists = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  const logs = await prisma.leadFollowUpLog.findMany({
    where: { leadCandidateId: id, tenantId: auth.tenantId },
    orderBy: { loggedAt: 'desc' },
    select: {
      id: true,
      type: true,
      content: true,
      metadata: true,
      userId: true,
      loggedAt: true,
    },
  });

  return NextResponse.json({ logs });
}

// ─── POST ────────────────────────────────────────────────────────────────────

interface CreateLogBody {
  type?: unknown;   // 'note' | 'manual_contact'
  content?: unknown;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Verify ownership
  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
    select: { id: true },
  });
  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  let body: CreateLogBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const type = typeof body.type === 'string' ? body.type : 'note';
  if (type !== 'note' && type !== 'manual_contact') {
    return NextResponse.json({ error: 'type deve ser "note" ou "manual_contact".' }, { status: 422 });
  }

  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) {
    return NextResponse.json({ error: 'O campo "content" é obrigatório.' }, { status: 422 });
  }

  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.leadFollowUpLog.create({
      data: {
        tenantId: auth.tenantId,
        leadCandidateId: id,
        type,
        content,
      },
    });

    if (type === 'manual_contact') {
      await tx.leadCandidate.update({
        where: { id },
        data: { lastContactAt: new Date() },
      });
    }

    return created;
  });

  return NextResponse.json({ log }, { status: 201 });
}
