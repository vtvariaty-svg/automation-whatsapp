/**
 * POST /api/lead-intelligence/candidates/[id]/score
 * Computa e persiste um score determinístico para o LeadCandidate especificado.
 * Nenhuma chamada externa é feita — scoring puramente baseado nos campos armazenados.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

// ─── Scoring helper ───────────────────────────────────────────────────────────

interface ScoreInput {
  // Candidate fields
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  rating: number | null;
  reviewsCount: number | null;
  // Run filters
  runCity: string | null;
  runState: string | null;
  localB2BOnly: boolean;
  minRating: number | null;
  minReviews: number | null;
}

interface ScoreResult {
  icpFitScore: number;
  commercialPotentialScore: number;
  digitalMaturityScore: number;
  approachabilityScore: number;
  confidenceScore: number;
  overallScore: number;
  verdict: 'compensa' | 'revisar' | 'nao_compensa';
  reasons: string[];
}

function cap(value: number, max: number): number {
  return Math.min(value, max);
}

function computeScore(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];

  // 1. icpFitScore (0–35)
  let icpFit = 0;
  if (input.category) {
    icpFit += 10;
    reasons.push('Categoria definida (+10 ICP)');
  }
  const cityMatch =
    input.runCity && input.city &&
    input.city.toLowerCase().trim() === input.runCity.toLowerCase().trim();
  const stateMatch =
    input.runState && input.state &&
    input.state.toLowerCase().trim() === input.runState.toLowerCase().trim();
  if (cityMatch || stateMatch) {
    icpFit += 10;
    reasons.push('Localização coincide com o filtro da busca (+10 ICP)');
  }
  if (!input.localB2BOnly) {
    icpFit += 5;
    reasons.push('Busca não restrita a B2B local (+5 ICP)');
  }
  if (input.companyName) {
    icpFit += 5;
    reasons.push('Razão social preenchida (+5 ICP)');
  }
  if (input.tradeName) {
    icpFit += 5;
    reasons.push('Nome fantasia preenchido (+5 ICP)');
  }
  const icpFitScore = cap(icpFit, 35);

  // 2. commercialPotentialScore (0–25)
  let commercial = 0;
  if (input.minRating !== null) {
    if (input.rating !== null && input.rating >= input.minRating) {
      commercial += 10;
      reasons.push(`Rating ${input.rating} ≥ mínimo ${input.minRating} (+10 Potencial Comercial)`);
    }
  } else if (input.rating !== null) {
    commercial += 5;
    reasons.push('Rating presente (sem filtro mínimo) (+5 Potencial Comercial)');
  }
  if (input.minReviews !== null) {
    if (input.reviewsCount !== null && input.reviewsCount >= input.minReviews) {
      commercial += 10;
      reasons.push(`Reviews ${input.reviewsCount} ≥ mínimo ${input.minReviews} (+10 Potencial Comercial)`);
    }
  } else if (input.reviewsCount !== null) {
    commercial += 5;
    reasons.push('Quantidade de reviews presente (sem filtro mínimo) (+5 Potencial Comercial)');
  }
  const commercialPotentialScore = cap(commercial, 25);

  // 3. digitalMaturityScore (0–20)
  let digital = 0;
  if (input.website) {
    digital += 10;
    reasons.push('Website presente (+10 Maturidade Digital)');
  }
  if (input.email) {
    digital += 5;
    reasons.push('E-mail presente (+5 Maturidade Digital)');
  }
  if (input.rating !== null || input.reviewsCount !== null) {
    digital += 5;
    reasons.push('Presença em plataformas de avaliação (+5 Maturidade Digital)');
  }
  const digitalMaturityScore = cap(digital, 20);

  // 4. approachabilityScore (0–10)
  let approach = 0;
  if (input.phone) {
    approach += 5;
    reasons.push('Telefone fixo presente (+5 Abordabilidade)');
  }
  if (input.mobilePhone) {
    approach += 5;
    reasons.push('Celular presente (+5 Abordabilidade)');
  }
  const approachabilityScore = cap(approach, 10);

  // 5. confidenceScore (0–10)
  let confidence = 0;
  if (input.city)     { confidence += 2; reasons.push('Cidade preenchida (+2 Confiança)'); }
  if (input.state)    { confidence += 2; reasons.push('Estado preenchido (+2 Confiança)'); }
  if (input.category) { confidence += 2; reasons.push('Categoria preenchida (+2 Confiança)'); }
  if (input.cnpj)     { confidence += 2; reasons.push('CNPJ preenchido (+2 Confiança)'); }
  if (input.address)  { confidence += 2; reasons.push('Endereço preenchido (+2 Confiança)'); }
  const confidenceScore = cap(confidence, 10);

  const overallScore = icpFitScore + commercialPotentialScore + digitalMaturityScore + approachabilityScore + confidenceScore;

  let verdict: 'compensa' | 'revisar' | 'nao_compensa';
  if (overallScore >= 80) {
    verdict = 'compensa';
    reasons.push(`Score geral ${overallScore}/100 → Compensa`);
  } else if (overallScore >= 60) {
    verdict = 'revisar';
    reasons.push(`Score geral ${overallScore}/100 → Revisar`);
  } else {
    verdict = 'nao_compensa';
    reasons.push(`Score geral ${overallScore}/100 → Não compensa`);
  }

  return {
    icpFitScore,
    commercialPotentialScore,
    digitalMaturityScore,
    approachabilityScore,
    confidenceScore,
    overallScore,
    verdict,
    reasons,
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find candidate within tenant scope and include its search run
  const candidate = await prisma.leadCandidate.findFirst({
    where: { id, tenantId: auth.tenantId },
    include: { searchRun: true },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Candidato não encontrado.' }, { status: 404 });
  }

  const run = candidate.searchRun;

  const scoreInput: ScoreInput = {
    companyName:  candidate.companyName,
    tradeName:    candidate.tradeName,
    cnpj:         candidate.cnpj,
    website:      candidate.website,
    email:        candidate.email,
    phone:        candidate.phone,
    mobilePhone:  candidate.mobilePhone,
    address:      candidate.address,
    city:         candidate.city,
    state:        candidate.state,
    category:     candidate.category,
    rating:       candidate.rating,
    reviewsCount: candidate.reviewsCount,
    runCity:      run.city,
    runState:     run.state,
    localB2BOnly: run.localB2BOnly,
    minRating:    run.minRating,
    minReviews:   run.minReviews,
  };

  const result = computeScore(scoreInput);

  // Upsert LeadScore
  const score = await prisma.leadScore.upsert({
    where: { leadCandidateId: candidate.id },
    create: {
      tenantId:                auth.tenantId,
      leadCandidateId:         candidate.id,
      overallScore:            result.overallScore,
      icpFitScore:             result.icpFitScore,
      commercialPotentialScore: result.commercialPotentialScore,
      digitalMaturityScore:    result.digitalMaturityScore,
      approachabilityScore:    result.approachabilityScore,
      confidenceScore:         result.confidenceScore,
      verdict:                 result.verdict,
      reasons:                 result.reasons,
    },
    update: {
      overallScore:            result.overallScore,
      icpFitScore:             result.icpFitScore,
      commercialPotentialScore: result.commercialPotentialScore,
      digitalMaturityScore:    result.digitalMaturityScore,
      approachabilityScore:    result.approachabilityScore,
      confidenceScore:         result.confidenceScore,
      verdict:                 result.verdict,
      reasons:                 result.reasons,
    },
  });

  return NextResponse.json({ score });
}
