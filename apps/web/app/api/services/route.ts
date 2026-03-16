import { NextResponse } from 'next/server';
import { getServices, createService } from '@/src/services/schedulingService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const list = await getServices(auth.tenantId);
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { tenantId: _ignored, ...data } = body;

    const newService = await createService(auth.tenantId, data);
    return NextResponse.json(newService);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
