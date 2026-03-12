import { NextResponse } from 'next/server';
// @ts-ignore
import { takeoverConversation } from '@/src/services/conversationService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;
  try {
    const body = await request.json();
    const { tenantId, status } = body;

    if (!tenantId || !status) {
      return NextResponse.json({ error: 'tenantId and status are required' }, { status: 400 });
    }

    const validStatuses = ['open', 'human', 'closed', 'waiting'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await takeoverConversation(phone, tenantId, status);

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
