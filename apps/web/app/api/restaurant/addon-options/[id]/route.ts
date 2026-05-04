// Food Addon Option [id] API
// GET    /api/restaurant/addon-options/[id]
// PATCH  /api/restaurant/addon-options/[id]
// DELETE /api/restaurant/addon-options/[id] → soft delete (isActive=false)

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
    const option = await prisma.foodAddonOption.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!option) return NextResponse.json({ error: 'Opção de adicional não encontrada.' }, { status: 404 });
    return NextResponse.json(option);
  } catch (error: any) {
    console.error('[restaurant/addon-options/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const option = await prisma.foodAddonOption.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!option) return NextResponse.json({ error: 'Opção de adicional não encontrada.' }, { status: 404 });

    const body = await request.json();
    const { name, priceDelta, isActive, sortOrder } = body;

    if (priceDelta !== undefined && isNaN(Number(priceDelta))) {
      return NextResponse.json({ error: 'priceDelta deve ser um número.' }, { status: 400 });
    }

    const updated = await prisma.foodAddonOption.update({
      where: { id },
      data: {
        ...(name       !== undefined && { name: String(name) }),
        ...(priceDelta !== undefined && { priceDelta: Number(priceDelta) }),
        ...(isActive   !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder  !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[restaurant/addon-options/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const access = await requireRestaurantAccess(request);
  if (!access.ok) return access.response;
  const auth = access;

  const { id } = await params;

  try {
    const option = await prisma.foodAddonOption.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!option) return NextResponse.json({ error: 'Opção de adicional não encontrada.' }, { status: 404 });

    // Soft delete — order item addons may reference this option
    await prisma.foodAddonOption.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[restaurant/addon-options/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
