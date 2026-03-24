/**
 * GET /api/lead-intelligence/search-runs/[id]/export?format=csv|json
 * Exporta apenas os candidatos aprovados do LeadSearchRun do tenant autenticado.
 * Parâmetro format: csv (padrão) | json
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

// Campos exportados
const EXPORT_FIELDS = [
  'companyName',
  'tradeName',
  'cnpj',
  'website',
  'email',
  'phone',
  'mobilePhone',
  'address',
  'city',
  'state',
  'category',
  'rating',
  'reviewsCount',
  'overallScore',
  'verdict',
  'status',
] as const;

type ExportField = typeof EXPORT_FIELDS[number];

interface ExportRow {
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
  overallScore: number | null;
  verdict: string | null;
  status: string;
}

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: ExportRow[]): string {
  const header = EXPORT_FIELDS.join(',');
  const lines = rows.map(row =>
    EXPORT_FIELDS.map((field: ExportField) => escapeCsvValue(row[field] as string | number | null)).join(','),
  );
  return [header, ...lines].join('\r\n');
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Enforce tenant ownership
  const run = await prisma.leadSearchRun.findFirst({
    where: { id, tenantId: auth.tenantId },
  });
  if (!run) {
    return NextResponse.json({ error: 'Busca não encontrada.' }, { status: 404 });
  }

  // Parse format param
  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'csv';

  // Fetch only approved candidates with their scores
  const candidates = await prisma.leadCandidate.findMany({
    where: { searchRunId: id, tenantId: auth.tenantId, status: 'approved' },
    orderBy: { createdAt: 'asc' },
    include: { score: true },
  });

  // Build export rows
  const rows: ExportRow[] = candidates.map(c => ({
    companyName:  c.companyName,
    tradeName:    c.tradeName,
    cnpj:         c.cnpj,
    website:      c.website,
    email:        c.email,
    phone:        c.phone,
    mobilePhone:  c.mobilePhone,
    address:      c.address,
    city:         c.city,
    state:        c.state,
    category:     c.category,
    rating:       c.rating,
    reviewsCount: c.reviewsCount,
    overallScore: c.score?.overallScore ?? null,
    verdict:      c.score?.verdict ?? null,
    status:       c.status,
  }));

  if (format === 'json') {
    return NextResponse.json({ run: { id: run.id, niche: run.niche }, total: rows.length, candidates: rows });
  }

  // Default: CSV
  const csv = buildCsv(rows);
  const filename = `leads-aprovados-${run.id.slice(0, 8)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
