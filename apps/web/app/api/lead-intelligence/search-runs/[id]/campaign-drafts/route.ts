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

  const run = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!run) {
    return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });
  }

  const drafts = await prisma.leadCampaignDraft.findMany({
    where: { searchRunId: id, tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      leadCandidate: {
        select: {
          id: true,
          companyName: true,
          email: true,
          phone: true,
          mobilePhone: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({ drafts });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const run = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId },
  });

  if (!run) {
    return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });
  }

  let body: { channel?: string; candidateIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if (body.channel !== 'email' && body.channel !== 'whatsapp') {
    return NextResponse.json({ error: 'O canal (channel) deve ser "email" ou "whatsapp"' }, { status: 400 });
  }

  const channel = body.channel;

  const candidateWhere: any = {
    searchRunId: id,
    tenantId: auth.tenantId,
  };

  if (body.candidateIds && Array.isArray(body.candidateIds) && body.candidateIds.length > 0) {
    candidateWhere.id = { in: body.candidateIds };
  }

  const candidates = await prisma.leadCandidate.findMany({
    where: candidateWhere,
    include: { suppressions: { where: { active: true } } }
  });

  const requestedCount = candidates.length;
  let eligibleCount = 0;
  let createdCount = 0;
  let skippedCount = 0;
  let suppressedCount = 0;

  for (const candidate of candidates) {
    let isEligible = false;

    const hasSuppression = candidate.suppressions.some((s: any) => s.channel === 'all' || s.channel === channel);
    if (hasSuppression) {
      suppressedCount++;
      continue;
    }

    if (channel === 'email') {
      isEligible = candidate.outreachStatus === 'ready_email' || candidate.outreachStatus === 'ready_multichannel';
    } else if (channel === 'whatsapp') {
      isEligible = candidate.outreachStatus === 'ready_whatsapp' || candidate.outreachStatus === 'ready_multichannel';
    }

    if (!isEligible) {
      skippedCount++;
      continue;
    }

    eligibleCount++;

    const existingDraft = await prisma.leadCampaignDraft.findFirst({
      where: {
        leadCandidateId: candidate.id,
        searchRunId: id,
        channel: channel,
        status: 'draft',
      },
    });

    if (existingDraft) {
      skippedCount++;
      continue;
    }

    let subject = null;
    let messageBody = '';

    const name = candidate.tradeName || candidate.companyName;

    if (channel === 'email') {
      subject = `Oportunidade de parceria para ${name}`;
      messageBody = `Olá, equipe da ${name}! Tudo bem?\n\nAcompanhamos o trabalho de vocês e acreditamos haver sinergia com nossas soluções. Adoraríamos marcar um breve bate-papo para explorarmos possíveis colaborações.\n\nFicamos à disposição para conversarmos.\n\nUm abraço!`;
    } else if (channel === 'whatsapp') {
      messageBody = `Olá, somos parceiros da ${name}? Estou entrando em contato de forma breve e profissional para verificar se teríamos espaço para uma troca de ideias sobre soluções voltadas para o seu setor. Se for de interesse, posso mandar mais detalhes. Um abraço!`;
    }

    await prisma.leadCampaignDraft.create({
      data: {
        tenantId: auth.tenantId,
        searchRunId: id,
        leadCandidateId: candidate.id,
        channel: channel,
        status: 'draft',
        subject,
        messageBody,
        readinessSnapshot: {
          outreachStatus: candidate.outreachStatus,
          email: candidate.email,
          phone: candidate.phone,
          mobilePhone: candidate.mobilePhone,
        },
      },
    });

    createdCount++;
  }

  return NextResponse.json({
    summary: {
      requested: requestedCount,
      eligible: eligibleCount,
      created: createdCount,
      skipped: skippedCount,
      suppressed: suppressedCount,
    },
  });
}
