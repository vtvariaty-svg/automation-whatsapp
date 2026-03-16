import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

/**
 * GET /api/demo/mode
 * auth required (any role) — returns whether the current tenant is a demo tenant.
 */
export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { isDemo: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      isDemo: tenant.isDemo,
      tenantName: tenant.name,
    });
  } catch (error: any) {
    console.error('[demo/mode] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
