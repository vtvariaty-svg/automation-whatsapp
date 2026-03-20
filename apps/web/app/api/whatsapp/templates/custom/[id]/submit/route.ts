import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { submitToMeta } from '../../route';

export const dynamic = 'force-dynamic';

// ── POST /api/whatsapp/templates/custom/[id]/submit ───────────────────────────
// Re-submits a DRAFT or REJECTED template to Meta
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { id } = await params;

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
}
