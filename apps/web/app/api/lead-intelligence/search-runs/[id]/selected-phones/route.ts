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
  const format = (body.format as string) === 'txt' ? 'txt' : 'csv';

  const candidates = await prisma.leadCandidate.findMany({
    where: {
      id: { in: candidateIds },
      tenantId: auth.tenantId,
      searchRunId,
    },
    select: {
      id: true,
      companyName: true,
      tradeName: true,
      phone: true,
      mobilePhone: true,
      city: true,
      state: true,
      status: true,
    },
  });

  const seen = new Set<string>();
  const rows: typeof candidates = [];
  let skipped = 0;

  for (const c of candidates) {
    const num = c.mobilePhone || c.phone;
    if (!num) { skipped++; continue; }
    const clean = num.replace(/\D/g, '');
    if (seen.has(clean)) { skipped++; continue; }
    seen.add(clean);
    rows.push(c);
  }

  const selected = candidateIds.length;
  const withPhone = rows.length + skipped - (candidates.length - rows.length - skipped < 0 ? 0 : 0);
  const deduplicated = rows.length;

  const headers: Record<string, string> = {
    'X-Phones-Selected': String(selected),
    'X-Phones-WithPhone': String(candidates.filter(c => c.mobilePhone || c.phone).length),
    'X-Phones-Deduplicated': String(deduplicated),
    'X-Phones-Skipped': String(skipped),
  };

  if (format === 'txt') {
    const lines = rows.map(c => (c.mobilePhone || c.phone)!.replace(/\D/g, '')).join('\n');
    return new Response(lines, {
      headers: {
        ...headers,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="numeros-${searchRunId.slice(0, 8)}.txt"`,
      },
    });
  }

  // CSV
  const csvLines = [
    'companyName,tradeName,phone,city,state,status',
    ...rows.map(c => [
      `"${(c.companyName || '').replace(/"/g, '""')}"`,
      `"${(c.tradeName || '').replace(/"/g, '""')}"`,
      `"${((c.mobilePhone || c.phone) || '').replace(/\D/g, '')}"`,
      `"${(c.city || '').replace(/"/g, '""')}"`,
      `"${(c.state || '').replace(/"/g, '""')}"`,
      `"${c.status}"`,
    ].join(',')),
  ];

  return new Response(csvLines.join('\n'), {
    headers: {
      ...headers,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="numeros-${searchRunId.slice(0, 8)}.csv"`,
    },
  });
}
