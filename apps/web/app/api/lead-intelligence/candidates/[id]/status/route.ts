/**
 * PATCH /api/lead-intelligence/candidates/[id]/status
 * Atualiza o status de um LeadCandidate dentro do escopo do tenant autenticado.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['pending_review', 'approved', 'rejected', 'archived'] as const;
type CandidateStatus = typeof ALLOWED_STATUSES[number];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Validate body
  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const status = body.status as CandidateStatus;
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status inválido. Valores aceitos: ${ALLOWED_STATUSES.join(', ')}.` },
      { status: 422 },
    );
  }

  // Ensure candidate belongs to the tenant
  const existing = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  const candidate = await prisma.leadCandidate.update({
    where: { id },
    data: { status },
    include: { score: true },
  });

  return NextResponse.json({ candidate });
}
