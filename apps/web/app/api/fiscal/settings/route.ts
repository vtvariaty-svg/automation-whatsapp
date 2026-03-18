// GET  — returns current nfeCompanyId for the authenticated tenant
// PUT  — saves nfeCompanyId chosen by the tenant

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getNfeCompanyId, setNfeCompanyId } from '@/lib/fiscal/nfeSettings';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const companyId = await getNfeCompanyId(auth.tenantId);
    return NextResponse.json({ nfeCompanyId: companyId });
  } catch {
    return NextResponse.json({ nfeCompanyId: null });
  }
}

export async function PUT(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido.' }, { status: 400 });
  }

  const { nfeCompanyId } = body;
  if (!nfeCompanyId || typeof nfeCompanyId !== 'string') {
    return NextResponse.json({ error: 'nfeCompanyId é obrigatório.' }, { status: 400 });
  }

  await setNfeCompanyId(auth.tenantId, nfeCompanyId);
  return NextResponse.json({ ok: true, nfeCompanyId });
}
