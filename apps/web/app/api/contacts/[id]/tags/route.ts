import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { updateContactTags } from '@/lib/services/contactService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const tags: string[] = Array.isArray(body.tags) ? body.tags : [];
    const updated = await updateContactTags(auth.tenantId, id, tags);
    return NextResponse.json({ tags: updated.tags });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
