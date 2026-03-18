// SERVER-SIDE ONLY
// Proxies /fiscal/companies from NFE_WEB to the frontend using the internal shared secret.

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url    = process.env.NFE_EXTERNAL_API_URL;
  const secret = process.env.NFE_INTERNAL_SECRET;

  if (!url || !secret) {
    return NextResponse.json({ error: 'Integração fiscal não configurada.' }, { status: 503 });
  }

  try {
    const res = await fetch(`${url}/fiscal/companies`, {
      headers: {
        'X-Internal-Secret': secret,
        'X-Tenant-Id':       auth.tenantId,
      },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ error: body?.error ?? 'Erro ao buscar empresas.' }, { status: res.status });
    }

    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: 'Falha de conexão com o serviço fiscal.' }, { status: 503 });
  }
}
