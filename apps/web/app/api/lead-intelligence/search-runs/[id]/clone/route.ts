import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // Optional body, ignore parse errors
  }

  const sourceRun = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!sourceRun) {
    return NextResponse.json({ error: 'Busca original não encontrada' }, { status: 404 });
  }

  // Clone apenas a configuração
  const clonedRun = await prisma.leadSearchRun.create({
    data: {
      tenantId: auth.tenantId,
      status: 'draft',
      niche: sourceRun.niche,
      city: sourceRun.city,
      state: sourceRun.state,
      radiusKm: sourceRun.radiusKm,
      maxResults: sourceRun.maxResults,
      minTicket: sourceRun.minTicket,
      minRating: sourceRun.minRating,
      minReviews: sourceRun.minReviews,
      requiresWebsite: sourceRun.requiresWebsite,
      requiresCommercialPhone: sourceRun.requiresCommercialPhone,
      localB2BOnly: sourceRun.localB2BOnly,
      totalCandidates: 0,
      summary: null
    }
  });

  let createdTemplate = null;

  if (body.templateName && typeof body.templateName === 'string' && body.templateName.trim() !== '') {
    createdTemplate = await prisma.leadProspectingTemplate.create({
      data: {
        tenantId: auth.tenantId,
        name: body.templateName.trim(),
        niche: sourceRun.niche,
        city: sourceRun.city,
        state: sourceRun.state,
        radiusKm: sourceRun.radiusKm,
        maxResults: sourceRun.maxResults,
        minTicket: sourceRun.minTicket,
        minRating: sourceRun.minRating,
        minReviews: sourceRun.minReviews,
        requiresWebsite: sourceRun.requiresWebsite,
        requiresCommercialPhone: sourceRun.requiresCommercialPhone,
        localB2BOnly: sourceRun.localB2BOnly,
        active: true
      }
    });
  }

  return NextResponse.json({ run: clonedRun, template: createdTemplate });
}
