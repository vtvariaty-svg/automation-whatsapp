// Food Category [id] API
// GET    /api/restaurant/categories/[id]
// PATCH  /api/restaurant/categories/[id]
// DELETE /api/restaurant/categories/[id] → soft delete (isActive=false)

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const category = await prisma.foodCategory.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!category) return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('[restaurant/categories/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const category = await prisma.foodCategory.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!category) return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });

    const body = await request.json();
    const { name, description, isActive, sortOrder } = body;

    const updated = await prisma.foodCategory.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name: String(name) }),
        ...(description !== undefined && { description: String(description) }),
        ...(isActive    !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder   !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[restaurant/categories/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const category = await prisma.foodCategory.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!category) return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });

    // Soft delete — products in category are preserved
    await prisma.foodCategory.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[restaurant/categories/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
