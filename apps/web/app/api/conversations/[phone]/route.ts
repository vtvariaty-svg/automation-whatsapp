import { NextResponse } from 'next/server';
// @ts-ignore - Importing from JS file
import { getConversationHistory } from '@/src/services/conversationService';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;
    const history = await getConversationHistory(phone);
    
    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Falha ao buscar histórico de conversas' }, { status: 500 });
  }
}
