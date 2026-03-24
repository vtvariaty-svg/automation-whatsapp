import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const template = await prisma.leadProspectingTemplate.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!template) {
    return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  interface PatchTemplateBody {
    name?: unknown;
    niche?: unknown;
    city?: unknown;
    state?: unknown;
    radiusKm?: unknown;
    maxResults?: unknown;
    minTicket?: unknown;
    minRating?: unknown;
    minReviews?: unknown;
    requiresWebsite?: unknown;
    requiresCommercialPhone?: unknown;
    localB2BOnly?: unknown;
    preferredChannel?: unknown;
    notes?: unknown;
    active?: unknown;
  }

  let body: PatchTemplateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const existing = await prisma.leadProspectingTemplate.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  
  if (body.name !== undefined) updates.name = body.name;
  if (body.niche !== undefined) updates.niche = body.niche;
  if (body.city !== undefined) updates.city = body.city || null;
  if (body.state !== undefined) updates.state = body.state || null;
  if (body.radiusKm !== undefined) updates.radiusKm = body.radiusKm ? Number(body.radiusKm) : null;
  if (body.maxResults !== undefined) updates.maxResults = body.maxResults ? Number(body.maxResults) : 50;
  if (body.minTicket !== undefined) updates.minTicket = body.minTicket ? Number(body.minTicket) : null;
  if (body.minRating !== undefined) updates.minRating = body.minRating ? Number(body.minRating) : null;
  if (body.minReviews !== undefined) updates.minReviews = body.minReviews ? Number(body.minReviews) : null;
  if (body.requiresWebsite !== undefined) updates.requiresWebsite = Boolean(body.requiresWebsite);
  if (body.requiresCommercialPhone !== undefined) updates.requiresCommercialPhone = Boolean(body.requiresCommercialPhone);
  if (body.localB2BOnly !== undefined) updates.localB2BOnly = Boolean(body.localB2BOnly);
  if (body.preferredChannel !== undefined) updates.preferredChannel = body.preferredChannel || null;
  if (body.notes !== undefined) updates.notes = body.notes || null;
  if (body.active !== undefined) updates.active = Boolean(body.active);

  const updated = await prisma.leadProspectingTemplate.update({
    where: { id: existing.id },
    data: updates
  });

  return NextResponse.json({ template: updated });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const existing = await prisma.leadProspectingTemplate.findFirst({
    where: { id, tenantId: auth.tenantId }
  });

  if (!existing) {
    return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
  }

  // Soft Delete
  await prisma.leadProspectingTemplate.update({
    where: { id: existing.id },
    data: { active: false }
  });

  return NextResponse.json({ 
    success: true, 
    template: { id: existing.id, active: false } 
  });
}
