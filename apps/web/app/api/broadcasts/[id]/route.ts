import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getBroadcastDetail, cancelBroadcast } from '@/src/services/broadcastService';

export const dynamic = 'force-dynamic';

// GET /api/broadcasts/[id] — detalhes do broadcast com recipients
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const broadcast = await getBroadcastDetail(auth.tenantId, id);
    if (!broadcast) {
      return NextResponse.json({ error: 'Envio não encontrado' }, { status: 404 });
    }

    return NextResponse.json(broadcast);
  } catch (error: any) {
    console.error('[Broadcasts] Erro ao buscar detalhes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/broadcasts/[id] — cancela broadcast
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await getAuthTenant(request);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const broadcast = await cancelBroadcast(auth.tenantId, id);
    return NextResponse.json(broadcast);
  } catch (error: any) {
    console.error('[Broadcasts] Erro ao cancelar:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
