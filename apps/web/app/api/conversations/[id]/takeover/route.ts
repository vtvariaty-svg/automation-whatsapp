import { NextResponse } from 'next/server';
// @ts-ignore
import { takeoverConversation } from '@/src/services/conversationService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');
  const { id } = await params;

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const result = await takeoverConversation(id, tenantId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
