import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';
import { syncTemplateStatusFromMeta } from '@/src/services/customTemplateService';

export const dynamic = 'force-dynamic';

// ── GET /api/whatsapp/templates/custom/[id] ───────────────────────────────────
// Returns the current local custom template record for this tenant.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    console.log(`[TemplatesCustom][GET_ID] tenantId: ${auth.tenantId} id: ${id}`);

    const template = await prisma.customTemplate.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error(`[TemplatesCustom][GET_ID][ERROR] ${error.message}\n`, error.stack);
    return NextResponse.json({ error: 'Falha interna ao buscar template' }, { status: 500 });
  }
}

// ── PATCH /api/whatsapp/templates/custom/[id] ─────────────────────────────────
// Syncs status from Meta provider and persists: metaTemplateId, status,
// rejectedReason, lastSyncAt. Returns the updated local record.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    console.log(`[TemplatesCustom][PATCH] tenantId: ${auth.tenantId} id: ${id}`);

    const template = await prisma.customTemplate.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });

    const result = await syncTemplateStatusFromMeta(auth.tenantId, id);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? 'Erro ao sincronizar status com a Meta' },
        { status: 400 }
      );
    }

    const updated = await prisma.customTemplate.findUnique({ where: { id } });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`[TemplatesCustom][PATCH][ERROR] ${error.message}\n`, error.stack);
    return NextResponse.json({ error: 'Falha interna ao sincronizar template' }, { status: 500 });
  }
}

// ── DELETE /api/whatsapp/templates/custom/[id] ────────────────────────────────
// Deletes the local template and attempts to delete on Meta if submitted.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    console.log(`[TemplatesCustom][DELETE] tenantId: ${auth.tenantId} id: ${id}`);

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
          console.warn(`[CustomTemplate] Falha ao deletar template "${template.name}" na Meta`);
        }
      }
    }

    await prisma.customTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[TemplatesCustom][DELETE][ERROR] ${error.message}\n`, error.stack);
    return NextResponse.json({ error: 'Falha ao deletar template' }, { status: 500 });
  }
}
