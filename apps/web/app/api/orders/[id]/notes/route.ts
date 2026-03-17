import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { addOrderNote } from '@/src/services/orderService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'content é obrigatório' }, { status: 400 });

    const order = await addOrderNote(id, auth.tenantId, content);
    return NextResponse.json(order);
  } catch (error: any) {
    const statusCode = error.message.includes('não encontrado') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status: statusCode });
  }
}
