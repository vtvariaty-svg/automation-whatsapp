import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, customerPhone, customerName, service, date, time } = body;

    if (!tenantId || !customerPhone) {
      return NextResponse.json({ error: 'tenantId e customerPhone são obrigatórios' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        customerPhone,
        customerName,
        service,
        date,
        time,
        status: 'agendado'
      }
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
