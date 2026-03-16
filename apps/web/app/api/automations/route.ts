import { NextResponse } from 'next/server';
import { getAutomations, createAutomation } from '@/src/services/automationService';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const list = await getAutomations(auth.tenantId);
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

    const newRule = await createAutomation(auth.tenantId, data);
    return NextResponse.json(newRule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
