import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { submitToMeta } from '@/src/services/customTemplateService';

export const dynamic = 'force-dynamic';

// ── POST /api/whatsapp/templates/custom/[id]/submit ───────────────────────────
// Re-submits a DRAFT or REJECTED template to Meta
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    console.log(`[TemplatesCustom][SUBMIT] tenantId: ${auth.tenantId} id: ${id}`);

    const template = await prisma.customTemplate.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

    if (template.status === 'APPROVED' || template.status === 'PENDING') {
      return NextResponse.json({ error: `Template já está com status ${template.status}` }, { status: 409 });
    }

    const result = await submitToMeta(auth.tenantId, id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updated = await prisma.customTemplate.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`[TemplatesCustom][SUBMIT][ERROR] ${error.message}\n`, error.stack);
    return NextResponse.json({ error: 'Falha interna ao submeter template' }, { status: 500 });
  }
}
