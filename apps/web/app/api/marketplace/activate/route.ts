import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { marketplaceBots } from '@/lib/marketplace/bots';
import { BOT_TEMPLATE_MAP } from '@/lib/marketplace/botTemplateMap';
import { businessTemplates } from '@/lib/onboarding/templates';
import { checkFeature } from '@/lib/services/entitlementsService';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const check = await checkFeature(auth.tenantId, 'premiumTemplates', auth.role);
  if (!check.allowed) return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });

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

    // Resolve template for this bot
    const tmplKey = BOT_TEMPLATE_MAP[bot.id];
    const template = tmplKey ? businessTemplates[tmplKey] : null;

    // 1. Buscar triggerValues já existentes para evitar duplicatas
    const existing = await prisma.automationRule.findMany({
      where: { tenantId: auth.tenantId },
      select: { triggerValue: true },
    });
    const existingTriggers = new Set(existing.map((r) => r.triggerValue.toLowerCase()));

    // 2. Criar automações do template (base operacional do nicho) — dedup por triggerValue
    let templateAutomationsCreated = 0;
    if (template && template.defaultAutomations.length > 0) {
      const templateToCreate = template.defaultAutomations.filter(
        (a) => !existingTriggers.has(a.triggerValue.toLowerCase())
      );
      if (templateToCreate.length > 0) {
        await prisma.automationRule.createMany({
          data: templateToCreate.map((a) => ({
            tenantId: auth.tenantId,
            name: a.name,
            triggerType: a.triggerType || 'keyword',
            triggerValue: a.triggerValue,
            matchType: a.matchType,
            responseType: a.responseType || 'text',
            responseText: a.responseText,
            active: true,
          })),
        });
        templateToCreate.forEach((a) => existingTriggers.add(a.triggerValue.toLowerCase()));
        templateAutomationsCreated = templateToCreate.length;
      }
    }

    // 3. Criar automações específicas do bot — dedup por triggerValue
    const botToCreate = bot.automations.filter(
      (a) => !existingTriggers.has(a.triggerValue.toLowerCase())
    );

    if (botToCreate.length > 0) {
      await prisma.automationRule.createMany({
        data: botToCreate.map((a) => ({
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

    // 4. Compor prompt com hierarquia clara:
    //    1. template.defaultPrompt — base operacional do nicho
    //    2. bot.prompt             — especialização conversacional/comercial
    //    3. Informações da empresa
    //    4. Regra geral de idioma
    const hoursText = tenant.businessHours || 'horário comercial';
    const parts: string[] = [];

    if (template?.defaultPrompt) {
      parts.push(template.defaultPrompt);
      parts.push('');
    }

    parts.push(bot.prompt);
    parts.push('');
    parts.push('INFORMAÇÕES DA EMPRESA:');
    parts.push(`- Nome: ${tenant.name}`);
    parts.push(`- Segmento: ${bot.nicheLabel}`);
    parts.push(`- Horário de atendimento: ${hoursText}`);
    parts.push('');
    parts.push('REGRA GERAL: Responda sempre em português brasileiro de forma clara e objetiva.');

    const systemPrompt = parts.join('\n');

    // 5. Atualizar tenant com novo prompt, activeBotKey e businessType coerente com o template
    // welcomeMessage é de propriedade exclusiva do operador — bot activation nunca a escreve.
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        aiPrompt: systemPrompt,
        activeBotKey: bot.id,
        ...(template?.businessType ? { businessType: template.businessType } : {}),
      },
    });

    // 6. Aplicar serviços padrão do template com idempotência por nome
    // Cria apenas os serviços ainda não existentes — preserva os existentes ao trocar de bot.
    let servicesCreated = 0;
    if (template && template.defaultServices.length > 0) {
      const existingSvcs = await prisma.service.findMany({
        where: { tenantId: auth.tenantId },
        select: { name: true },
      });
      const existingSvcNames = new Set(existingSvcs.map((s) => s.name.toLowerCase()));

      const svcsToCreate = template.defaultServices.filter(
        (svc) => !existingSvcNames.has(svc.name.toLowerCase())
      );

      if (svcsToCreate.length > 0) {
        await prisma.service.createMany({
          data: svcsToCreate.map((svc) => ({
            tenantId: auth.tenantId,
            name: svc.name,
            durationMinutes: svc.durationMinutes,
            active: true,
          })),
        });
        servicesCreated = svcsToCreate.length;
      }
    }

    // 7. Calcular itens pendentes para o checklist de ativação
    const pendingSetup: string[] = [];
    const hasChannel = !!(tenant.whatsappToken || tenant.instagramPageId || tenant.facebookPageId);
    if (!hasChannel) pendingSetup.push('channel');
    if (!tenant.businessHours?.trim()) pendingSetup.push('business_hours');
    if (!tenant.welcomeMessage?.trim()) pendingSetup.push('welcome_message');
    if (bot.suggestedTools.includes('services') || bot.suggestedTools.includes('serviços')) pendingSetup.push('services');
    if (bot.suggestedTools.includes('produtos') || bot.suggestedTools.includes('products')) pendingSetup.push('products');

    return NextResponse.json({
      success: true,
      botId,
      automationsCreated: templateAutomationsCreated + botToCreate.length,
      automationsSkipped: (template?.defaultAutomations.length ?? 0) + bot.automations.length - templateAutomationsCreated - botToCreate.length,
      servicesCreated,
      pendingSetup,
    });
  } catch (error: any) {
    console.error('Erro ao ativar bot do marketplace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
