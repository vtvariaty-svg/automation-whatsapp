import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { aiPrompt: true, welcomeMessage: true }
    });

    return NextResponse.json({
      aiPrompt: tenant?.aiPrompt || '',
      welcomeMessage: tenant?.welcomeMessage || ''
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { whatDoesCompanyDo, servicesOffered, commonQuestions, welcomeMessage } = body;

    // Get tenant data for prompt generation
    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { name: true, businessType: true, businessHours: true },
    });

    // Get services for prompt
    const services = await prisma.service.findMany({
      where: { tenantId: auth.tenantId, active: true },
      select: { name: true, durationMinutes: true },
    });

    const serviceNames = services.map(s => s.name).join(', ') || servicesOffered || 'diversos serviços';
    const companyName = tenant?.name || 'nossa empresa';
    const hours = tenant?.businessHours || 'horário comercial';

    // Generate system prompt
    const systemPrompt = `Você é o assistente virtual da empresa ${companyName}.
${tenant?.businessType ? `Tipo de negócio: ${tenant.businessType}.` : ''}
${whatDoesCompanyDo ? `Sobre a empresa: ${whatDoesCompanyDo}.` : ''}
A empresa oferece: ${serviceNames}.
Horário de atendimento: ${hours}.
${commonQuestions ? `Perguntas frequentes dos clientes: ${commonQuestions}.` : ''}

Suas responsabilidades:
- Responder dúvidas dos clientes de forma educada e profissional
- Ajudar com informações sobre serviços e preços
- Auxiliar no agendamento de serviços
- Fornecer horários de atendimento quando solicitado
- Sempre ser cordial e representar bem a empresa

Responda sempre em português brasileiro, de forma clara e objetiva.`;

    const finalWelcome = welcomeMessage || `Olá! 👋 Bem-vindo(a) à ${companyName}! Como posso ajudá-lo(a) hoje?`;

    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        aiPrompt: systemPrompt,
        welcomeMessage: finalWelcome,
        setupStep: 5,
      },
    });

    return NextResponse.json({ success: true, nextStep: 5, generatedPrompt: systemPrompt });
  } catch (error: any) {
    console.error('Onboarding step 4 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
