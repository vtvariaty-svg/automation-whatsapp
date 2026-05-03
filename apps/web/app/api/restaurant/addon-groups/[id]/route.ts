// Food Addon Group [id] API
// GET    /api/restaurant/addon-groups/[id]
// PATCH  /api/restaurant/addon-groups/[id]
// DELETE /api/restaurant/addon-groups/[id] → soft delete (isActive=false)

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const group = await prisma.foodAddonGroup.findFirst({
      where: { id, tenantId: auth.tenantId },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!group) return NextResponse.json({ error: 'Grupo de adicionais não encontrado.' }, { status: 404 });
    return NextResponse.json(group);
  } catch (error: any) {
    console.error('[restaurant/addon-groups/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const group = await prisma.foodAddonGroup.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!group) return NextResponse.json({ error: 'Grupo de adicionais não encontrado.' }, { status: 404 });

    const body = await request.json();
    const { name, productId, minSelect, maxSelect, isRequired, isActive, sortOrder } = body;

    if (minSelect !== undefined || maxSelect !== undefined) {
      const min = minSelect !== undefined ? Number(minSelect) : group.minSelect;
      const max = maxSelect !== undefined ? Number(maxSelect) : group.maxSelect;
      if (!Number.isInteger(min) || min < 0) {
        return NextResponse.json({ error: 'minSelect deve ser um inteiro >= 0.' }, { status: 400 });
      }
      if (!Number.isInteger(max) || max < 0) {
        return NextResponse.json({ error: 'maxSelect deve ser um inteiro >= 0.' }, { status: 400 });
      }
      if (max < min) {
        return NextResponse.json({ error: 'maxSelect deve ser >= minSelect.' }, { status: 400 });
      }
    }

    const updated = await prisma.foodAddonGroup.update({
      where: { id },
      data: {
        ...(name       !== undefined && { name: String(name) }),
        ...(productId  !== undefined && { productId: productId || null }),
        ...(minSelect  !== undefined && { minSelect: Number(minSelect) }),
        ...(maxSelect  !== undefined && { maxSelect: Number(maxSelect) }),
        ...(isRequired !== undefined && { isRequired: Boolean(isRequired) }),
        ...(isActive   !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder  !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[restaurant/addon-groups/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const group = await prisma.foodAddonGroup.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!group) return NextResponse.json({ error: 'Grupo de adicionais não encontrado.' }, { status: 404 });

    await prisma.foodAddonGroup.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[restaurant/addon-groups/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
