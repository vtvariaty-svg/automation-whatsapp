import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getBroadcasts, createBroadcast, processPendingBroadcasts } from '@/src/services/broadcastService';

export const dynamic = 'force-dynamic';

// GET /api/broadcasts — lista broadcasts do tenant
export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const broadcasts = await getBroadcasts(auth.tenantId);
    return NextResponse.json(broadcasts);
  } catch (error: any) {
    console.error('[Broadcasts] Erro ao listar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/broadcasts — cria novo broadcast
export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    const { templateName, templateLang, variables, recipients, scheduledAt, source, idempotencyKey } = body;

    if (!templateName) {
      return NextResponse.json({ error: 'Template é obrigatório' }, { status: 400 });
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Pelo menos um destinatário é obrigatório' }, { status: 400 });
    }

    // Validar destinatários
    const validRecipients = recipients.filter((r: any) => r.phone?.replace(/\D/g, '').length >= 10);
    if (validRecipients.length === 0) {
      return NextResponse.json({ error: 'Nenhum destinatário com telefone válido' }, { status: 400 });
    }

    const broadcast = await createBroadcast({
      tenantId: auth.tenantId,
      templateName,
      templateLang,
      variables,
      recipients: validRecipients,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      createdBy: auth.userId,
      source,
      idempotencyKey,
    });

    // For immediate sends (no scheduledAt), trigger processing right away
    // without blocking the response — cron will also pick up any missed ones.
    if (!scheduledAt) {
      processPendingBroadcasts().catch(err =>
        console.error('[Broadcast] Auto-process error:', err)
      );
    }

    return NextResponse.json(broadcast, { status: 201 });
  } catch (error: any) {
    console.error('[Broadcasts] Erro ao criar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
