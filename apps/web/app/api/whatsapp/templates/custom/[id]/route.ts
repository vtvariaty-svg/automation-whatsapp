import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';

export const dynamic = 'force-dynamic';

// ── DELETE /api/whatsapp/templates/custom/[id] ────────────────────────────────
export async function DELETE(
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

  // If submitted to Meta, also delete there
  if (template.metaTemplateId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { whatsappToken: true, whatsappBusinessAccountId: true, whatsappConnection: true },
    });
    const rawToken = tenant?.whatsappConnection?.accessToken || tenant?.whatsappToken;
    const token = rawToken ? decrypt(rawToken) : null;
    const wabaId = tenant?.whatsappConnection?.wabaId || tenant?.whatsappBusinessAccountId;

    if (token && wabaId) {
      try {
        await fetch(
          `https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=${encodeURIComponent(template.name)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        // Log but don't block local deletion
        console.warn(`[CustomTemplate] Falha ao deletar template "${template.name}" na Meta`);
      }
    }
  }

  await prisma.customTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
