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

  const { id: searchRunId } = await context.params;

  let body: { candidateIds?: unknown; format?: unknown } = {};
  try { body = await request.json(); } catch { /* empty body OK */ }

  const run = await prisma.leadSearchRun.findFirst({
    where: { id: searchRunId, tenantId: auth.tenantId },
  });
  if (!run) return NextResponse.json({ error: 'Busca não encontrada' }, { status: 404 });

  const candidateIds = Array.isArray(body.candidateIds) ? body.candidateIds as string[] : [];
  const format = (body.format as string) === 'json' ? 'json' : 'csv';

  const candidates = await prisma.leadCandidate.findMany({
    where: {
      id: { in: candidateIds },
      tenantId: auth.tenantId,
      searchRunId,
    },
    include: {
      score: {
        select: { overallScore: true, verdict: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows = candidates.map(c => ({
    companyName: c.companyName,
    tradeName: c.tradeName,
    cnpj: c.cnpj,
    website: c.website,
    email: c.email,
    phone: c.phone,
    mobilePhone: c.mobilePhone,
    city: c.city,
    state: c.state,
    category: c.category,
    status: c.status,
    overallScore: c.score?.overallScore ?? null,
    verdict: c.score?.verdict ?? null,
  }));

  if (format === 'json') {
    const jsonStr = JSON.stringify(rows, null, 2);
    return new Response(jsonStr, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${searchRunId.slice(0, 8)}.json"`,
      },
    });
  }

  // CSV
  const header = 'companyName,tradeName,cnpj,website,email,phone,mobilePhone,city,state,category,status,overallScore,verdict';
  const csvRows = rows.map(r => [
    r.companyName, r.tradeName, r.cnpj, r.website, r.email,
    r.phone, r.mobilePhone, r.city, r.state, r.category,
    r.status, r.overallScore, r.verdict,
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));

  const csv = [header, ...csvRows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="leads-${searchRunId.slice(0, 8)}.csv"`,
    },
  });
}
