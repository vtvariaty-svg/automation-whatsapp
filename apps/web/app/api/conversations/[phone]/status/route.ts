import { NextResponse } from 'next/server';
// @ts-ignore
import { takeoverConversation } from '@/src/services/conversationService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phone } = await params;
  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const validStatuses = ['open', 'human', 'closed', 'waiting'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await takeoverConversation(phone, auth.tenantId, status);

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
