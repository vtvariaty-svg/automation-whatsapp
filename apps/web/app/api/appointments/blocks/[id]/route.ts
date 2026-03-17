import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { deleteAvailabilityBlock } from '@/src/services/schedulingService';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    await deleteAvailabilityBlock(auth.tenantId, id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Block not found' }, { status: 404 });
  }
}
