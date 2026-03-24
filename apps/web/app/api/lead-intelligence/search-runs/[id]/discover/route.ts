/**
 * POST /api/lead-intelligence/search-runs/[id]/discover
 * Inicia a descoberta de candidatos via Google Places.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { discoverGooglePlaces } from '@/lib/services/lead-intelligence/googlePlacesProvider';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  // Load the run
  const run = await prisma.leadSearchRun.findFirst({
    where: { id: id, tenantId: auth.tenantId },
    include: { candidates: { select: { id: true, placeId: true, companyName: true, city: true, state: true } } },
  });

  if (!run) {
    return NextResponse.json({ error: 'Busca não encontrada.' }, { status: 404 });
  }

  // Set status to queued (to signal it started)
  await prisma.leadSearchRun.update({
    where: { id: run.id },
    data: { status: 'queued' },
  });

  try {
    // Call the Google Places provider
    const results = await discoverGooglePlaces({
      niche: run.niche,
      city: run.city,
      state: run.state,
      radiusKm: run.radiusKm,
      maxResults: run.maxResults,
    });

    let createdCount = 0;
    let skippedCount = 0;
    const preview = [];

    // Deduplicate and persist
    for (const r of results) {
      // 1. Check by placeId first
      const existsByPlaceId = r.placeId ? run.candidates.some((c: any) => c.placeId === r.placeId) : false;
      
      // 2. Check by name + city + state fallback
      const existsByName = run.candidates.some((c: any) => 
        c.companyName.toLowerCase().trim() === r.companyName.toLowerCase().trim() &&
        c.city?.toLowerCase().trim() === r.city?.toLowerCase().trim() &&
        c.state?.toLowerCase().trim() === r.state?.toLowerCase().trim()
      );

      if (existsByPlaceId || existsByName) {
        skippedCount++;
        continue;
      }

      // Create LeadCandidate
      const candidate = await prisma.leadCandidate.create({
        data: {
          tenantId: auth.tenantId,
          searchRunId: run.id,
          companyName: r.companyName,
          placeId: r.placeId,
          website: r.website,
          phone: r.phone,
          address: r.address,
          city: r.city,
          state: r.state,
          category: r.category,
          rating: r.rating,
          reviewsCount: r.reviewsCount,
          source: r.source,
          status: 'pending_review',
        },
      });

      createdCount++;
      if (preview.length < 5) {
        preview.push({ id: candidate.id, companyName: candidate.companyName });
      }
    }

    // Update the totalCandidates and run status to completed, plus add summary
    const summary = {
      provider: 'google_places',
      query: `${run.niche} em ${run.city ?? ''} ${run.state ?? ''}`.trim(),
      discovered: results.length,
      created: createdCount,
      skipped: skippedCount,
      lastDiscoveryAt: new Date().toISOString(),
    };

    const finalRun = await prisma.leadSearchRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        totalCandidates: { increment: createdCount },
        summary: summary,
      },
    });

    return NextResponse.json({
      discovered: results.length,
      created: createdCount,
      skipped: skippedCount,
      preview,
    });

  } catch (error: any) {
    // On error, mark run as failed
    await prisma.leadSearchRun.update({
      where: { id: run.id },
      data: { status: 'failed' },
    });

    return NextResponse.json({ error: error.message || 'Erro na descoberta.' }, { status: 500 });
  }
}
