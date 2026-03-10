import { NextResponse } from 'next/server';
// @ts-ignore
import { takeoverConversation } from '@/src/services/conversationService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const { phone } = await params;

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const result = await takeoverConversation(phone, tenantId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
