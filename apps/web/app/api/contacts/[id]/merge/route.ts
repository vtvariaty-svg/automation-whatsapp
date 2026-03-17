import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { mergeContacts } from '@/lib/services/contactService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: survivorId } = await params;

  try {
    const body = await request.json();
    const { mergedId } = body;
    if (!mergedId) return NextResponse.json({ error: 'mergedId is required' }, { status: 400 });

    const result = await mergeContacts(auth.tenantId, survivorId, mergedId, auth.userId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
