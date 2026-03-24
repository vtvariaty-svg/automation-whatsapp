/**
 * GET /api/lead-intelligence/search-runs/[id]
 * Retorna um LeadSearchRun completo com candidatos, scores e tentativas de enriquecimento.
 * Enforça posse pelo tenantId autenticado.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const run = await prisma.leadSearchRun.findFirst({
    where: { id: params.id, tenantId: auth.tenantId },
    include: {
      candidates: {
        orderBy: { createdAt: 'desc' },
        include: {
          score: true,
        },
      },
      enrichmentAttempts: {
        orderBy: { attemptedAt: 'desc' },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: 'Busca não encontrada.' }, { status: 404 });
  }

  return NextResponse.json({ run });
}
