import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const product = await prisma.product.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

  const data = await req.json();

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name        !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category    !== undefined && { category: data.category }),
      ...(data.price       !== undefined && { price: Number(data.price) }),
      ...(data.stock       !== undefined && { stock: data.stock !== null ? Number(data.stock) : null }),
      ...(data.active      !== undefined && { active: Boolean(data.active) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const product = await prisma.product.findFirst({
    where: { id, tenantId: user.tenantId },
  });
  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
