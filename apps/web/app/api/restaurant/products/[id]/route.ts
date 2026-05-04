// Food Product [id] API
// GET    /api/restaurant/products/[id]
// PATCH  /api/restaurant/products/[id]
// DELETE /api/restaurant/products/[id] → soft delete (isActive=false)

import { NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/lib/auth/verticalAccess';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const product = await prisma.foodProduct.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: {
        category: { select: { id: true, name: true } },
        addonGroups: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, include: { options: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } },
      },
    });
    if (!product) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('[restaurant/products/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const product = await prisma.foodProduct.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!product) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });

    const body = await request.json();
    const { name, description, price, categoryId, imageUrl, isActive, isAvailable, sortOrder } = body;

    // Validate price if provided
    if (price !== undefined) {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return NextResponse.json({ error: 'price deve ser um número >= 0.' }, { status: 400 });
      }
    }

    // Validate categoryId if changing
    if (categoryId !== undefined) {
      const category = await prisma.foodCategory.findFirst({
        where: { id: String(categoryId), tenantId: auth.tenantId },
      });
      if (!category) {
        return NextResponse.json({ error: 'Categoria não encontrada neste tenant.' }, { status: 404 });
      }
    }

    const updated = await prisma.foodProduct.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name: String(name) }),
        ...(description !== undefined && { description: String(description) }),
        ...(price       !== undefined && { price: Number(price) }),
        ...(categoryId  !== undefined && { categoryId: String(categoryId) }),
        ...(imageUrl    !== undefined && { imageUrl: imageUrl ? String(imageUrl) : null }),
        ...(isActive    !== undefined && { isActive: Boolean(isActive) }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(sortOrder   !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[restaurant/products/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const product = await prisma.foodProduct.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!product) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });

    // Soft delete — preserve order item snapshots
    await prisma.foodProduct.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[restaurant/products/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
