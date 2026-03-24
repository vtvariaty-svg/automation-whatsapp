/**
 * GET  /api/lead-intelligence/search-runs  — lista runs do tenant (desc createdAt)
 * POST /api/lead-intelligence/search-runs  — cria novo draft de busca
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const runs = await prisma.leadSearchRun.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      niche: true,
      city: true,
      state: true,
      radiusKm: true,
      maxResults: true,
      status: true,
      totalCandidates: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { candidates: true } },
    },
  });

  return NextResponse.json({ runs });
}

// ─── POST ────────────────────────────────────────────────────────────────────

interface CreateRunBody {
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
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: CreateRunBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const niche = typeof body.niche === 'string' ? body.niche.trim() : '';
  if (!niche) {
    return NextResponse.json({ error: 'O campo "niche" é obrigatório.' }, { status: 422 });
  }

  const run = await prisma.leadSearchRun.create({
    data: {
      tenantId: auth.tenantId,
      niche,
      city:    typeof body.city  === 'string' ? body.city.trim()  || null : null,
      state:   typeof body.state === 'string' ? body.state.trim() || null : null,
      radiusKm:  typeof body.radiusKm  === 'number' ? Math.max(1, body.radiusKm)  : null,
      maxResults: typeof body.maxResults === 'number' ? Math.min(500, Math.max(1, body.maxResults)) : 50,
      minTicket:  typeof body.minTicket  === 'number' && body.minTicket  > 0 ? body.minTicket  : null,
      minRating:  typeof body.minRating  === 'number' && body.minRating  > 0 ? Math.min(5, body.minRating)  : null,
      minReviews: typeof body.minReviews === 'number' && body.minReviews > 0 ? body.minReviews : null,
      requiresWebsite:         body.requiresWebsite         === true,
      requiresCommercialPhone: body.requiresCommercialPhone === true,
      localB2BOnly:            body.localB2BOnly            === true,
      status: 'draft',
    },
  });

  return NextResponse.json({ run }, { status: 201 });
}
