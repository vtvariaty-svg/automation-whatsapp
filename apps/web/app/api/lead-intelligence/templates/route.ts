import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const activeParam = searchParams.get('active');

  const where: any = { tenantId: auth.tenantId };
  
  if (activeParam === 'true') where.active = true;
  else if (activeParam === 'false') where.active = false;

  const templates = await prisma.leadProspectingTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      niche: true,
      city: true,
      state: true,
      preferredChannel: true,
      active: true,
      createdAt: true
    }
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const {
    name, niche, city, state, radiusKm, maxResults, minTicket,
    minRating, minReviews, requiresWebsite, requiresCommercialPhone,
    localB2BOnly, preferredChannel, notes
  } = body;

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Nome do template é obrigatório' }, { status: 400 });
  }
  if (!niche || typeof niche !== 'string') {
    return NextResponse.json({ error: 'Nicho é obrigatório' }, { status: 400 });
  }

  const template = await prisma.leadProspectingTemplate.create({
    data: {
      tenantId: auth.tenantId,
      name,
      niche,
      city: city || null,
      state: state || null,
      radiusKm: radiusKm ? Number(radiusKm) : null,
      maxResults: maxResults ? Number(maxResults) : 50,
      minTicket: minTicket ? Number(minTicket) : null,
      minRating: minRating ? Number(minRating) : null,
      minReviews: minReviews ? Number(minReviews) : null,
      requiresWebsite: Boolean(requiresWebsite),
      requiresCommercialPhone: Boolean(requiresCommercialPhone),
      localB2BOnly: Boolean(localB2BOnly),
      preferredChannel: preferredChannel || null,
      notes: notes || null,
      active: true
    }
  });

  return NextResponse.json({ template });
}
