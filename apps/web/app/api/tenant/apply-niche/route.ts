import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { applyBusinessTemplate } from '@/lib/onboarding/applyTemplate';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { businessType } = await request.json();

    if (!businessType) {
      return NextResponse.json({ error: 'Nicho é obrigatório' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    await applyBusinessTemplate(
      auth.tenantId,
      businessType,
      tenant.name,
      tenant.businessHours || '',
      true // forcePrompt — atualiza prompt e welcome sem apagar dados existentes
    );

    return NextResponse.json({ success: true, businessType });
  } catch (error: any) {
    console.error('Erro ao aplicar nicho:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
