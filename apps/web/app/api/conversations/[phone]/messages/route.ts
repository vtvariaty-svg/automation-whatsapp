import { NextResponse } from 'next/server';
// @ts-ignore
import { getConversationHistory } from '@/src/services/conversationService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phone } = await params;

  try {
    const messages = await getConversationHistory(phone, auth.tenantId);
    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
