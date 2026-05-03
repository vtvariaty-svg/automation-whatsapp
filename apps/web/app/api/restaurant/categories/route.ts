// Food Categories API
// GET  /api/restaurant/categories  → list categories for tenant's restaurant
// POST /api/restaurant/categories  → create a category

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const profile = await prisma.restaurantProfile.findUnique({
      where: { tenantId: auth.tenantId },
    });
    if (!profile) return NextResponse.json([], { status: 200 });

    const categories = await prisma.foodCategory.findMany({
      where: { tenantId: auth.tenantId, restaurantProfileId: profile.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('[restaurant/categories GET]', error);
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
        { error: 'Crie um perfil de restaurante antes de adicionar categorias.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name é obrigatório.' }, { status: 400 });
    }

    const category = await prisma.foodCategory.create({
      data: {
        tenantId: auth.tenantId,
        restaurantProfileId: profile.id,
        name: String(name),
        description: description ? String(description) : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error('[restaurant/categories POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
