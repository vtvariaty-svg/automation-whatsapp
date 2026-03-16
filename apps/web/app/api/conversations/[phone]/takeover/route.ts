import { NextResponse } from 'next/server';
// @ts-ignore
import { takeoverConversation } from '@/src/services/conversationService';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { audit } from '@/lib/audit';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phone } = await params;

  try {
    const result = await takeoverConversation(phone, auth.tenantId);
    audit(auth.tenantId, 'conversation.takeover', { phone }, auth.userId, 'conversation', phone);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
