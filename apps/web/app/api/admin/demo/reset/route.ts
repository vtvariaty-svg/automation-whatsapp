import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

/**
 * POST /api/admin/demo/reset
 * superadmin only — deletes all Appointments, AutomationRules, and Services
 * for the given demo tenant and re-seeds them to their original state.
 * Body: { tenantId: string }
 */
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  let body: { tenantId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { tenantId } = body;
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId é obrigatório' }, { status: 400 });
  }

  // Confirm tenant exists and is a demo tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, isDemo: true, name: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
  }
  if (!tenant.isDemo) {
    return NextResponse.json({ error: 'Tenant não é um demo tenant' }, { status: 400 });
  }

  try {
    // Delete existing data
    await prisma.appointment.deleteMany({ where: { tenantId } });
    await prisma.automationRule.deleteMany({ where: { tenantId } });
    await prisma.service.deleteMany({ where: { tenantId } });

    // Re-seed automation rules
    await prisma.automationRule.createMany({
      data: [
        {
          tenantId,
          name: 'Resposta Preço',
          triggerType: 'keyword',
          triggerValue: 'preço',
          matchType: 'contains',
          responseType: 'text',
          responseText:
            'Olá! Nossos preços variam conforme o serviço. Limpeza de Pele: R$ 150 | Micropigmentação: R$ 600. Posso te ajudar com mais detalhes?',
          active: true,
        },
        {
          tenantId,
          name: 'Resposta Horário',
          triggerType: 'keyword',
          triggerValue: 'horário',
          matchType: 'contains',
          responseType: 'text',
          responseText:
            'Nosso horário de atendimento é de Segunda a Sábado, das 9h às 19h. Quer agendar um horário?',
          active: true,
        },
        {
          tenantId,
          name: 'Resposta Agendar',
          triggerType: 'keyword',
          triggerValue: 'agendar',
          matchType: 'contains',
          responseType: 'text',
          responseText:
            'Ótimo! Para agendar, me informe seu nome, o serviço desejado e a data preferida. Vamos verificar a disponibilidade!',
          active: true,
        },
      ],
    });

    // Re-seed services
    await prisma.service.createMany({
      data: [
        {
          tenantId,
          name: 'Limpeza de Pele',
          durationMinutes: 60,
          active: true,
        },
        {
          tenantId,
          name: 'Micropigmentação',
          durationMinutes: 120,
          active: true,
        },
      ],
    });

    // Re-seed appointments
    await prisma.appointment.createMany({
      data: [
        {
          tenantId,
          customerPhone: '+5511999990001',
          customerName: 'Ana Silva',
          service: 'Limpeza de Pele',
          date: '2026-03-20',
          time: '10:00',
          status: 'agendado',
        },
        {
          tenantId,
          customerPhone: '+5511999990002',
          customerName: 'Bruna Costa',
          service: 'Limpeza de Pele',
          date: '2026-03-20',
          time: '11:00',
          status: 'agendado',
        },
        {
          tenantId,
          customerPhone: '+5511999990003',
          customerName: 'Carla Mendes',
          service: 'Limpeza de Pele',
          date: '2026-03-20',
          time: '14:00',
          status: 'agendado',
        },
      ],
    });

    return NextResponse.json({ ok: true, tenantId });
  } catch (error: any) {
    console.error('[demo/reset] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
