/**
 * POST /api/lead-intelligence/candidates/[id]/enrich
 * Enriquecimento local (via site) do candidato, salvando métrica de auditoria.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { enrichFromWebsite } from '@/lib/services/lead-intelligence/websiteEnrichmentService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  // Find candidate and ensure ownership
  const candidate = await prisma.leadCandidate.findFirst({
    where: { id: id, tenantId: auth.tenantId },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  if (!candidate.website) {
    return NextResponse.json({ error: 'Candidato não possui website (URL) cadastrado.' }, { status: 400 });
  }

  // Create audit record
  const attempt = await prisma.leadEnrichmentAttempt.create({
    data: {
      tenantId: auth.tenantId,
      searchRunId: candidate.searchRunId,
      leadCandidateId: candidate.id,
      provider: 'website_public',
      status: 'pending',
      requestedFields: ['email', 'phone', 'mobilePhone', 'companyName'],
      attemptedAt: new Date(),
    },
  });

  try {
    const result = await enrichFromWebsite(candidate.website);

    // Prepare candidate updates ONLY for empty fields
    const dataUpdate: Record<string, string> = {};
    const filledFields: string[] = [];

    if (result.email && !candidate.email) {
      dataUpdate.email = result.email;
      filledFields.push('email');
    }
    if (result.phone && !candidate.phone) {
      dataUpdate.phone = result.phone;
      filledFields.push('phone');
    }
    if (result.mobilePhone && !candidate.mobilePhone) {
      dataUpdate.mobilePhone = result.mobilePhone;
      filledFields.push('mobilePhone');
    }
    if (result.companyNameHint && !candidate.tradeName) {
      // Use companyNameHint strictly as tradeName buffer if empty
      dataUpdate.tradeName = result.companyNameHint;
      filledFields.push('tradeName');
    }

    let updatedCandidate = candidate;

    if (Object.keys(dataUpdate).length > 0) {
      updatedCandidate = await prisma.leadCandidate.update({
        where: { id: candidate.id },
        data: dataUpdate,
      });
    }

    // Mark attempt as success/failed based on what it found
    const responseSummary = {
      ...result,
      filledFields,
    };

    const finalAttempt = await prisma.leadEnrichmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: result.success ? 'success' : 'failed',
        errorMessage: result.success ? null : result.notes.slice(-1)[0] || 'Nenhum dado encontrado.',
        completedAt: new Date(),
        responseSummary: responseSummary,
      },
    });

    return NextResponse.json({
      candidate: updatedCandidate,
      attempt: finalAttempt,
      summary: responseSummary,
    });

  } catch (err: unknown) {
    // Failsafe
    const msg = err instanceof Error ? err.message : 'Erro inesperado no enriquecimento.';
    const failAttempt = await prisma.leadEnrichmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'failed',
        errorMessage: msg,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ error: failAttempt.errorMessage }, { status: 500 });
  }
}
