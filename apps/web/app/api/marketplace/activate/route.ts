import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { marketplaceBots } from '@/lib/marketplace/bots';
import { BOT_TEMPLATE_MAP } from '@/lib/marketplace/botTemplateMap';
import { businessTemplates } from '@/lib/onboarding/templates';
import { checkFeature } from '@/lib/services/entitlementsService';

/** Normaliza strings para comparação: trim + lowercase + colapso de espaços. */
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

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

    // Resolve template before entering the transaction so we fail fast if botId is invalid
    const tmplKey = BOT_TEMPLATE_MAP[bot.id];
    const template = tmplKey ? businessTemplates[tmplKey] : null;

    // ── Fluxo crítico em transação atômica ────────────────────────────────────
    // Cobre: leitura de estado atual, update do tenant, criação de automações
    // (template + bot) e criação de serviços faltantes.
    // Em caso de erro em qualquer etapa o banco reverte integralmente.
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: auth.tenantId } });
      if (!tenant) throw new Error('Tenant não encontrado');

      // ── 1. Ler triggerValues existentes (normalizados) ────────────────────
      const existingRules = await tx.automationRule.findMany({
        where: { tenantId: auth.tenantId },
        select: { triggerValue: true },
      });
      const existingTriggers = new Set(existingRules.map((r) => norm(r.triggerValue)));

      // ── 2. Automações-base do template (camada operacional do nicho) ──────
      let templateAutomationsCreated = 0;
      if (template && template.defaultAutomations.length > 0) {
        const templateToCreate = template.defaultAutomations.filter(
          (a) => !existingTriggers.has(norm(a.triggerValue))
        );
        if (templateToCreate.length > 0) {
          await tx.automationRule.createMany({
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
            skipDuplicates: true,
          });
          // Marcar como existentes para o step seguinte evitar colisão intra-transação
          templateToCreate.forEach((a) => existingTriggers.add(norm(a.triggerValue)));
          templateAutomationsCreated = templateToCreate.length;
        }
      }

      // ── 3. Automações específicas do bot (camada de especialização) ───────
      const botToCreate = bot.automations.filter(
        (a) => !existingTriggers.has(norm(a.triggerValue))
      );
      if (botToCreate.length > 0) {
        await tx.automationRule.createMany({
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
          skipDuplicates: true,
        });
      }

      // ── 4. Compor prompt com hierarquia clara ─────────────────────────────
      //   1. template.defaultPrompt — base operacional do nicho
      //   2. bot.prompt             — especialização conversacional/comercial
      //   3. Informações da empresa
      //   4. Regra geral de idioma
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

      // ── 5. Atualizar tenant ───────────────────────────────────────────────
      // businessType NÃO é alterado aqui — pertence à identidade do tenant
      // definida no onboarding e usada pelo sidebar, checklist e módulos.
      // activeBotKey é a fonte de verdade para qual bot/template está ativo;
      // o template é sempre derivável via BOT_TEMPLATE_MAP[activeBotKey].
      // welcomeMessage é de propriedade exclusiva do operador — nunca escrita aqui.
      await tx.tenant.update({
        where: { id: auth.tenantId },
        data: {
          aiPrompt: systemPrompt,
          activeBotKey: bot.id,
        },
      });

      // ── 6. Serviços padrão do template — idempotência por nome ───────────
      // Cria apenas os serviços ainda não existentes (por nome normalizado).
      // Preserva os serviços existentes ao trocar de bot.
      let servicesCreated = 0;
      if (template && template.defaultServices.length > 0) {
        const existingSvcs = await tx.service.findMany({
          where: { tenantId: auth.tenantId },
          select: { name: true },
        });
        const existingSvcNames = new Set(existingSvcs.map((s) => norm(s.name)));

        const svcsToCreate = template.defaultServices.filter(
          (svc) => !existingSvcNames.has(norm(svc.name))
        );
        if (svcsToCreate.length > 0) {
          await tx.service.createMany({
            data: svcsToCreate.map((svc) => ({
              tenantId: auth.tenantId,
              name: svc.name,
              durationMinutes: svc.durationMinutes,
              active: true,
            })),
            skipDuplicates: true,
          });
          servicesCreated = svcsToCreate.length;
        }
      }

      return {
        tenant,
        templateAutomationsCreated,
        botAutomationsCreated: botToCreate.length,
        automationsSkipped:
          (template?.defaultAutomations.length ?? 0) +
          bot.automations.length -
          templateAutomationsCreated -
          botToCreate.length,
        servicesCreated,
      };
    });

    // ── 7. Checklist de itens pendentes ───────────────────────────────────────
    const pendingSetup: string[] = [];
    const hasChannel = !!(
      result.tenant.whatsappToken ||
      result.tenant.instagramPageId ||
      result.tenant.facebookPageId
    );
    if (!hasChannel) pendingSetup.push('channel');
    if (!result.tenant.businessHours?.trim()) pendingSetup.push('business_hours');
    if (!result.tenant.welcomeMessage?.trim()) pendingSetup.push('welcome_message');
    if (bot.suggestedTools.includes('services') || bot.suggestedTools.includes('serviços')) pendingSetup.push('services');
    if (bot.suggestedTools.includes('produtos') || bot.suggestedTools.includes('products')) pendingSetup.push('products');

    return NextResponse.json({
      success: true,
      botId,
      automationsCreated: result.templateAutomationsCreated + result.botAutomationsCreated,
      automationsSkipped: result.automationsSkipped,
      servicesCreated: result.servicesCreated,
      pendingSetup,
    });
  } catch (error: any) {
    console.error('Erro ao ativar bot do marketplace:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
