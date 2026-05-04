// Food Addon Groups API
// GET  /api/restaurant/addon-groups  → list addon groups (optionally filtered by productId)
// POST /api/restaurant/addon-groups  → create an addon group

import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') ?? undefined;

  try {
    const groups = await prisma.foodAddonGroup.findMany({
      where: {
        tenantId: auth.tenantId,
        ...(productId && { productId }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { options: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
    });
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('[restaurant/addon-groups GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  try {
    const profile = await prisma.restaurantProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) {
      return NextResponse.json(
        { error: 'Crie um perfil de restaurante antes de adicionar grupos de adicionais.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, productId, minSelect, maxSelect, isRequired, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
    }

    const min = minSelect !== undefined ? Number(minSelect) : 0;
    const max = maxSelect !== undefined ? Number(maxSelect) : 1;

    if (!Number.isInteger(min) || min < 0) {
      return NextResponse.json({ error: 'minSelect deve ser um inteiro >= 0.' }, { status: 400 });
    }
    if (!Number.isInteger(max) || max < 0) {
      return NextResponse.json({ error: 'maxSelect deve ser um inteiro >= 0.' }, { status: 400 });
    }
    if (max < min) {
      return NextResponse.json({ error: 'maxSelect deve ser >= minSelect.' }, { status: 400 });
    }

    // Validate productId belongs to same tenant if provided
    if (productId) {
      const product = await prisma.foodProduct.findFirst({
        where: { id: String(productId), tenantId: auth.tenantId },
      });
      if (!product) {
        return NextResponse.json({ error: 'Produto não encontrado neste tenant.' }, { status: 404 });
      }
    }

    const group = await prisma.foodAddonGroup.create({
      data: {
        tenantId: auth.tenantId,
        restaurantProfileId: profile.id,
        name: String(name),
        productId: productId ? String(productId) : undefined,
        minSelect: min,
        maxSelect: max,
        isRequired: isRequired !== undefined ? Boolean(isRequired) : false,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error('[restaurant/addon-groups POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
