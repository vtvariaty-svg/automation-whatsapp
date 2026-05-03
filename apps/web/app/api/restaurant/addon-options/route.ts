// Food Addon Options API
// GET  /api/restaurant/addon-options  → list options (filter by addonGroupId)
// POST /api/restaurant/addon-options  → create an option

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const addonGroupId = searchParams.get('addonGroupId') ?? undefined;

  try {
    const options = await prisma.foodAddonOption.findMany({
      where: {
        tenantId: auth.tenantId,
        ...(addonGroupId && { addonGroupId }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(options);
  } catch (error: any) {
    console.error('[restaurant/addon-options GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { name, addonGroupId, priceDelta, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
    }
    if (!addonGroupId) {
      return NextResponse.json({ error: 'addonGroupId é obrigatório.' }, { status: 400 });
    }

    // Validate addonGroupId belongs to same tenant
    const group = await prisma.foodAddonGroup.findFirst({
      where: { id: String(addonGroupId), tenantId: auth.tenantId },
    });
    if (!group) {
      return NextResponse.json({ error: 'Grupo de adicionais não encontrado neste tenant.' }, { status: 404 });
    }

    const delta = priceDelta !== undefined ? Number(priceDelta) : 0;
    if (isNaN(delta)) {
      return NextResponse.json({ error: 'priceDelta deve ser um número.' }, { status: 400 });
    }

    const option = await prisma.foodAddonOption.create({
      data: {
        tenantId: auth.tenantId,
        addonGroupId: String(addonGroupId),
        name: String(name),
        priceDelta: delta,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error: any) {
    console.error('[restaurant/addon-options POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
