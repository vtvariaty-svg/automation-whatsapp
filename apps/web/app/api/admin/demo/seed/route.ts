import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

const DEMO_TENANT_NAME = 'Studio Bella (Demo)';
const DEMO_EMAIL = 'demo@studiobella.com';
const DEMO_PASSWORD = 'demo1234';

/**
 * POST /api/admin/demo/seed
 * superadmin only — creates a fully-seeded demo tenant.
 * If the demo tenant already exists, returns 409 with existing data.
 */
export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  if (auth.role !== 'superadmin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  try {
    // Check if demo tenant already exists
    const existing = await prisma.tenant.findFirst({
      where: { name: DEMO_TENANT_NAME, isDemo: true },
      include: { users: { where: { email: DEMO_EMAIL } } },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'Demo tenant já existe',
          tenantId: existing.id,
          userId: existing.users[0]?.id ?? null,
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        },
        { status: 409 }
      );
    }

    // Create demo tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: DEMO_TENANT_NAME,
        isDemo: true,
        businessType: 'beauty',
        businessDescription: 'Studio de beleza e estética – dados fictícios para demonstração.',
        setupCompleted: true,
      },
    });

    // Create demo user
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: DEMO_EMAIL,
        passwordHash,
        role: 'admin',
        name: 'Studio Bella Demo',
      },
    });

    // Create subscription
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: 'pro',
        status: 'active',
        currentPeriodStart: new Date(),
      },
    });

    // Create automation rules
    await prisma.automationRule.createMany({
      data: [
        {
          tenantId: tenant.id,
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
          tenantId: tenant.id,
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
          tenantId: tenant.id,
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

    // Create services
    await prisma.service.createMany({
      data: [
        {
          tenantId: tenant.id,
          name: 'Limpeza de Pele',
          durationMinutes: 60,
          active: true,
        },
        {
          tenantId: tenant.id,
          name: 'Micropigmentação',
          durationMinutes: 120,
          active: true,
        },
      ],
    });

    // Create appointments
    await prisma.appointment.createMany({
      data: [
        {
          tenantId: tenant.id,
          customerPhone: '+5511999990001',
          customerName: 'Ana Silva',
          service: 'Limpeza de Pele',
          date: '2026-03-20',
          time: '10:00',
          status: 'agendado',
        },
        {
          tenantId: tenant.id,
          customerPhone: '+5511999990002',
          customerName: 'Bruna Costa',
          service: 'Limpeza de Pele',
          date: '2026-03-20',
          time: '11:00',
          status: 'agendado',
        },
        {
          tenantId: tenant.id,
          customerPhone: '+5511999990003',
          customerName: 'Carla Mendes',
          service: 'Limpeza de Pele',
          date: '2026-03-20',
          time: '14:00',
          status: 'agendado',
        },
      ],
    });

    return NextResponse.json({
      tenantId: tenant.id,
      userId: user.id,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  } catch (error: any) {
    console.error('[demo/seed] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
