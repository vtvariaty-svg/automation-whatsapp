import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';

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

  // Validate name: snake_case only
  if (!/^[a-z0-9_]+$/.test(name)) {
    return NextResponse.json({ error: 'Nome deve conter apenas letras minúsculas, números e underscore' }, { status: 400 });
  }

  // Check if placeholder count matches exampleVars
  const placeholders = (bodyText.match(/\{\{\d+\}\}/g) || []);
  const uniquePlaceholders = [...new Set(placeholders)];
  if (uniquePlaceholders.length > 0 && exampleVars.length < uniquePlaceholders.length) {
    return NextResponse.json({
      error: `O template tem ${uniquePlaceholders.length} variável(is). Forneça ${uniquePlaceholders.length} exemplo(s) em exampleVars.`,
    }, { status: 400 });
  }

  // Check uniqueness
  const existing = await prisma.customTemplate.findUnique({
    where: { tenantId_name: { tenantId: auth.tenantId, name } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Já existe um template com esse nome' }, { status: 409 });
  }

  // Save locally first
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

  // Try to submit to Meta
  const submissionResult = await submitToMeta(auth.tenantId, template.id);

  if (submissionResult.error) {
    // Return template with DRAFT status + submission warning
    return NextResponse.json({
      ...template,
      submissionWarning: submissionResult.error,
    }, { status: 201 });
  }

  // Return updated template with PENDING status
  const updated = await prisma.customTemplate.findUnique({ where: { id: template.id } });
  return NextResponse.json(updated, { status: 201 });
}

// ── Helper: submit template to Meta ──────────────────────────────────────────

export async function submitToMeta(tenantId: string, templateId: string): Promise<{ ok: boolean; error?: string }> {
  const template = await prisma.customTemplate.findUnique({ where: { id: templateId } });
  if (!template) return { ok: false, error: 'Template não encontrado' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { whatsappToken: true, whatsappBusinessAccountId: true, whatsappConnection: true },
  });

  const rawToken = tenant?.whatsappConnection?.accessToken || tenant?.whatsappToken;
  const token = rawToken ? decrypt(rawToken) : null;
  const wabaId = tenant?.whatsappConnection?.wabaId || tenant?.whatsappBusinessAccountId;

  if (!token || !wabaId) {
    return { ok: false, error: 'WhatsApp Business não configurado. Template salvo como rascunho — submeta após configurar a integração.' };
  }

  // Build Meta components
  const components: any[] = [];

  if (template.header) {
    components.push({ type: 'HEADER', format: 'TEXT', text: template.header });
  }

  const bodyComponent: any = { type: 'BODY', text: template.body };
  if (template.exampleVars.length > 0) {
    bodyComponent.example = { body_text: [template.exampleVars] };
  }
  components.push(bodyComponent);

  if (template.footer) {
    components.push({ type: 'FOOTER', text: template.footer });
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: template.name, category: template.category, language: template.language, components }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.error?.error_user_msg || data.error?.message || 'Erro ao submeter template à Meta';
      await prisma.customTemplate.update({
        where: { id: templateId },
        data: { status: 'REJECTED', rejectedReason: msg },
      });
      return { ok: false, error: msg };
    }

    // Meta returns { id, status } — status is usually PENDING
    await prisma.customTemplate.update({
      where: { id: templateId },
      data: {
        metaTemplateId: String(data.id),
        status: data.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
      },
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
