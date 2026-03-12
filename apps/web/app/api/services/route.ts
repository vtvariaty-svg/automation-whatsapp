import { NextResponse } from 'next/server';
import { getServices, createService } from '@/src/services/schedulingService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const list = await getServices(tenantId);
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, ...data } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const newService = await createService(tenantId, data);
    return NextResponse.json(newService);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
