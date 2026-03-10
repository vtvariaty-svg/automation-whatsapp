import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, tenantId } = body;

    if (!status || !tenantId) {
      return NextResponse.json({ error: 'status e tenantId são obrigatórios' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Agendamento não encontrado ou sem permissão' }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
