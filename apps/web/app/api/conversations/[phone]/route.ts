import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { getConversationHistory } from '@/src/services/conversationService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { phone } = await params;
    const history = await getConversationHistory(phone, auth.tenantId);
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Falha ao buscar histórico de conversas' }, { status: 500 });
  }
}
