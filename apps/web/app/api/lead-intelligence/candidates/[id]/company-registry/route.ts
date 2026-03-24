import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { runCompanyRegistryEnrichment } from '@/lib/services/lead-intelligence/companyRegistryEnrichmentService';

export const dynamic = 'force-dynamic';

// GET — return candidate registry fields + last 10 snapshots
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
    select: {
      id: true,
      companyName: true,
      cnpj: true,
      legalName: true,
      cnpjStatus: true,
      cnpjSource: true,
      registryConfidence: true,
      companyRegistryLastCheckedAt: true,
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  const snapshots = await prisma.leadCompanyRegistrySnapshot.findMany({
    where: { leadCandidateId: id, tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({ candidate, snapshots });
}

// POST — run enrichment, persist snapshot, update candidate conservatively
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  const result = await runCompanyRegistryEnrichment({ cnpj: candidate.cnpj });

  // Persist snapshot
  const snapshot = await prisma.leadCompanyRegistrySnapshot.create({
    data: {
      tenantId: auth.tenantId,
      leadCandidateId: id,
      provider: result.provider,
      matched: result.matched,
      confidence: result.confidence,
      cnpj: result.cnpj ?? null,
      legalName: result.legalName ?? null,
      tradeName: result.tradeName ?? null,
      companyType: result.companyType ?? null,
      mainActivity: result.mainActivity ?? null,
      city: result.city ?? null,
      state: result.state ?? null,
      cnpjStatus: result.status ?? null,
      rawSummary: result.rawSummary ?? null,
      notes: result.notes,
    },
  });

  // Update candidate fields conservatively — only overwrite if result is matched
  const candidateUpdates: Record<string, unknown> = {
    companyRegistryLastCheckedAt: new Date(),
  };

  if (result.matched) {
    if (result.legalName)  candidateUpdates.legalName           = result.legalName;
    if (result.status)     candidateUpdates.cnpjStatus          = result.status;
    if (result.cnpj)       candidateUpdates.cnpj                = result.cnpj;
                           candidateUpdates.cnpjSource          = result.provider;
                           candidateUpdates.registryConfidence  = result.confidence;
  }

  const updatedCandidate = await prisma.leadCandidate.update({
    where: { id },
    data: candidateUpdates,
  });

  return NextResponse.json({
    candidate: updatedCandidate,
    snapshot,
    summary: {
      success: result.success,
      matched: result.matched,
      confidence: result.confidence,
      notes: result.notes,
    },
  });
}
