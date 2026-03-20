import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/utils/crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/template-sync
 * Polls Meta for status updates on PENDING custom templates.
 * Run every 5 minutes via Render Cron Job (or equivalent).
 * Protected by CRON_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Cron não configurado' }, { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Find all PENDING custom templates, grouped by tenant
  const pending = await prisma.customTemplate.findMany({
    where: { status: 'PENDING' },
    select: { id: true, tenantId: true, name: true, metaTemplateId: true },
  });

  if (pending.length === 0) return NextResponse.json({ ok: true, updated: 0 });

  // Group by tenantId to fetch credentials once per tenant
  const byTenant = new Map<string, typeof pending>();
  for (const t of pending) {
    const arr = byTenant.get(t.tenantId) || [];
    arr.push(t);
    byTenant.set(t.tenantId, arr);
  }

  let updated = 0;

  for (const [tenantId, templates] of byTenant) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { whatsappToken: true, whatsappBusinessAccountId: true, whatsappConnection: true },
    });

    const rawToken = tenant?.whatsappConnection?.accessToken || tenant?.whatsappToken;
    const token = rawToken ? decrypt(rawToken) : null;
    const wabaId = tenant?.whatsappConnection?.wabaId || tenant?.whatsappBusinessAccountId;

    if (!token || !wabaId) continue;

    try {
      const url = `https://graph.facebook.com/v20.0/${wabaId}/message_templates?fields=name,status,rejected_reason&limit=200`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) continue;

      const data = await res.json();
      const metaByName = new Map<string, { status: string; rejected_reason?: string }>(
        (data.data || []).map((t: any) => [t.name, t])
      );

      for (const tmpl of templates) {
        const metaInfo = metaByName.get(tmpl.name);
        if (!metaInfo) continue;

        const newStatus = metaInfo.status === 'APPROVED' ? 'APPROVED'
          : metaInfo.status === 'REJECTED' ? 'REJECTED'
          : null;

        if (!newStatus) continue;

        await prisma.customTemplate.update({
          where: { id: tmpl.id },
          data: {
            status: newStatus,
            rejectedReason: newStatus === 'REJECTED' ? (metaInfo.rejected_reason || 'Rejeitado pela Meta') : null,
          },
        });
        updated++;
      }
    } catch (err) {
      console.error(`[TemplateSync] Erro ao sincronizar tenant ${tenantId}:`, err);
    }
  }

  console.log(`[TemplateSync] ${updated} templates atualizados de ${pending.length} pendentes`);
  return NextResponse.json({ ok: true, updated, checked: pending.length });
}
