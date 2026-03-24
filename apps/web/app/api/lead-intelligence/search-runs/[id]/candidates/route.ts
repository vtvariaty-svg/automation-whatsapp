/**
 * POST /api/lead-intelligence/search-runs/[id]/candidates
 * Cria manualmente um LeadCandidate dentro de um LeadSearchRun do tenant autenticado.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

interface CreateCandidateBody {
  companyName?: unknown;
  tradeName?: unknown;
  cnpj?: unknown;
  website?: unknown;
  email?: unknown;
  phone?: unknown;
  mobilePhone?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  category?: unknown;
  rating?: unknown;
  reviewsCount?: unknown;
  source?: unknown;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Enforce tenant ownership of the search run
  const run = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!run) {
    return NextResponse.json({ error: 'Busca não encontrada.' }, { status: 404 });
  }

  let body: CreateCandidateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const companyName = str(body.companyName);
  if (!companyName) {
    return NextResponse.json({ error: 'O campo "companyName" é obrigatório.' }, { status: 422 });
  }

  const ratingRaw = typeof body.rating === 'number' ? body.rating : null;
  const reviewsCountRaw = typeof body.reviewsCount === 'number' ? body.reviewsCount : null;

  const candidate = await prisma.leadCandidate.create({
    data: {
      tenantId:     auth.tenantId,
      searchRunId:  id,
      companyName,
      tradeName:    str(body.tradeName),
      cnpj:         str(body.cnpj),
      website:      str(body.website),
      email:        str(body.email),
      phone:        str(body.phone),
      mobilePhone:  str(body.mobilePhone),
      address:      str(body.address),
      city:         str(body.city),
      state:        str(body.state),
      category:     str(body.category),
      rating:       ratingRaw !== null ? Math.min(5, Math.max(0, ratingRaw)) : null,
      reviewsCount: reviewsCountRaw !== null ? Math.max(0, reviewsCountRaw) : null,
      source:       str(body.source) ?? 'manual',
      status:       'pending_review',
    },
  });

  // Update parent run's totalCandidates counter
  await prisma.leadSearchRun.update({
    where: { id },
    data: { totalCandidates: { increment: 1 } },
  });

  return NextResponse.json({ candidate }, { status: 201 });
}
