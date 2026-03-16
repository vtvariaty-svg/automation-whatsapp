import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { marketplaceBots } from '@/lib/marketplace/bots';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { botId } = await request.json();

    if (!botId) {
      return NextResponse.json({ error: 'botId é obrigatório' }, { status: 400 });
    }

    const bot = marketplaceBots.find((b) => b.id === botId);
    if (!bot) {
      return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
    }

    // 1. Buscar triggerValues já existentes para evitar duplicatas
    const existing = await prisma.automationRule.findMany({
      where: { tenantId: auth.tenantId },
      select: { triggerValue: true },
    });
    const existingTriggers = new Set(existing.map((r) => r.triggerValue.toLowerCase()));

    // 2. Criar apenas as automações cujo gatilho ainda não existe
    const toCreate = bot.automations.filter(
      (a) => !existingTriggers.has(a.triggerValue.toLowerCase())
    );

    if (toCreate.length > 0) {
      await prisma.automationRule.createMany({
        data: toCreate.map((a) => ({
          tenantId: auth.tenantId,
          name: a.name,
          triggerType: 'keyword',
          triggerValue: a.triggerValue,
          matchType: a.matchType,
          responseType: 'text',
          responseText: a.responseText,
          active: true,
        })),
      });
    }

    // 3. Montar e gravar o prompt completo
    const hoursText = tenant.businessHours || 'horário comercial';
    const systemPrompt = [
      bot.prompt,
      '',
      'INFORMAÇÕES DA EMPRESA:',
      `- Nome: ${tenant.name}`,
      `- Segmento: ${bot.nicheLabel}`,
      `- Horário de atendimento: ${hoursText}`,
      '',
      'REGRA GERAL: Responda sempre em português brasileiro de forma clara e objetiva.',
    ].join('\n');

    // 4. Atualizar tenant com novo prompt, welcome e businessType
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        aiPrompt: systemPrompt,
        welcomeMessage: bot.welcomeMessage,
        businessType: bot.niche,
      },
    });

    return NextResponse.json({
      success: true,
      botId,
      automationsCreated: toCreate.length,
      automationsSkipped: bot.automations.length - toCreate.length,
    });
  } catch (error: any) {
    console.error('Erro ao ativar bot do marketplace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
