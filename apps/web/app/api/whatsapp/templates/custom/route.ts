import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { submitToMeta } from '@/src/services/customTemplateService';

export const dynamic = 'force-dynamic';

// ── GET /api/whatsapp/templates/custom ────────────────────────────────────────
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const templates = await prisma.customTemplate.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(templates);
}

// ── POST /api/whatsapp/templates/custom ───────────────────────────────────────
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json();
  const { name, category = 'UTILITY', language = 'pt_BR', bodyText, header, footer, exampleVars = [] } = body;

  if (!name || !bodyText) {
    return NextResponse.json({ error: 'name e bodyText são obrigatórios' }, { status: 400 });
  }

  if (!/^[a-z0-9_]+$/.test(name)) {
    return NextResponse.json({ error: 'Nome deve conter apenas letras minúsculas, números e underscore' }, { status: 400 });
  }

  const uniquePlaceholders = [...new Set((bodyText.match(/\{\{\d+\}\}/g) || []))];
  if (uniquePlaceholders.length > 0 && exampleVars.length < uniquePlaceholders.length) {
    return NextResponse.json({
      error: `O template tem ${uniquePlaceholders.length} variável(is). Forneça ${uniquePlaceholders.length} exemplo(s) em exampleVars.`,
    }, { status: 400 });
  }

  const existing = await prisma.customTemplate.findUnique({
    where: { tenantId_name: { tenantId: auth.tenantId, name } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Já existe um template com esse nome' }, { status: 409 });
  }

  const template = await prisma.customTemplate.create({
    data: {
      tenantId: auth.tenantId,
      name,
      category,
      language,
      body: bodyText,
      header: header || null,
      footer: footer || null,
      exampleVars,
      status: 'DRAFT',
    },
  });

  const submissionResult = await submitToMeta(auth.tenantId, template.id);

  if (submissionResult.error) {
    return NextResponse.json({ ...template, submissionWarning: submissionResult.error }, { status: 201 });
  }

  const updated = await prisma.customTemplate.findUnique({ where: { id: template.id } });
  return NextResponse.json(updated, { status: 201 });
}
