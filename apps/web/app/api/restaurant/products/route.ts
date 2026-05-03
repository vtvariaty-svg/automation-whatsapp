// Food Products API
// GET  /api/restaurant/products  → list products for tenant's restaurant
// POST /api/restaurant/products  → create a product

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId') ?? undefined;

  try {
    const profile = await prisma.restaurantProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) return NextResponse.json([], { status: 200 });

    const products = await prisma.foodProduct.findMany({
      where: {
        tenantId: auth.tenantId,
        restaurantProfileId: profile.id,
        ...(categoryId && { categoryId }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { category: { select: { id: true, name: true } } },
    });
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('[restaurant/products GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.restaurantProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) {
      return NextResponse.json(
        { error: 'Crie um perfil de restaurante antes de adicionar produtos.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, price, categoryId, imageUrl, isAvailable, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
    }
    if (price === undefined || price === null) {
      return NextResponse.json({ error: 'price é obrigatório.' }, { status: 400 });
    }
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'price deve ser um número >= 0.' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId é obrigatório.' }, { status: 400 });
    }

    // Validate categoryId belongs to same tenant
    const category = await prisma.foodCategory.findFirst({
      where: { id: String(categoryId), tenantId: auth.tenantId },
    });
    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada neste tenant.' }, { status: 404 });
    }

    const product = await prisma.foodProduct.create({
      data: {
        tenantId: auth.tenantId,
        restaurantProfileId: profile.id,
        categoryId: String(categoryId),
        name: String(name),
        description: description ? String(description) : undefined,
        price: priceNum,
        imageUrl: imageUrl ? String(imageUrl) : undefined, // URL only, no upload
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('[restaurant/products POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
