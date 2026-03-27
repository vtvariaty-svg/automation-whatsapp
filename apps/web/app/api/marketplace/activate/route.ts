import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { marketplaceBots } from '@/lib/marketplace/bots';
import { BOT_TEMPLATE_MAP } from '@/lib/marketplace/botTemplateMap';
import { businessTemplates } from '@/lib/onboarding/templates';
import { checkFeature } from '@/lib/services/entitlementsService';
import {
  PRESET_BLOCK_START,
  PRESET_BLOCK_END,
  extractManagedBlock,
  replaceManagedBlock,
  extractPromptWithoutManagedBlocks,
  composePromptFromBlocks,
} from '@/lib/ai/guidedSetup';

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
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: auth.tenantId } });
      if (!tenant) throw new Error('Tenant não encontrado');

      // ── A. Deactivate system automations from OTHER bots ──────────────────
      await (tx.automationRule as any).updateMany({
        where: {
          tenantId: auth.tenantId,
          sourceType: 'system',
          NOT: { sourceBotKey: bot.id },
        },
        data: { active: false },
      });

      // ── B. Reactivate existing system automations for CURRENT bot ─────────
      await (tx.automationRule as any).updateMany({
        where: {
          tenantId: auth.tenantId,
          sourceType: 'system',
          sourceBotKey: bot.id,
        },
        data: { active: true },
      });

      // ── C. Read ACTIVE triggers AFTER reactivation (correct dedup baseline)
      const existingRules = await tx.automationRule.findMany({
        where: { tenantId: auth.tenantId, active: true },
        select: { triggerValue: true },
      });
      const existingTriggers = new Set(existingRules.map((r) => norm(r.triggerValue)));

      // ── D. Template automations (operational layer of the niche) ──────────
      let templateAutomationsCreated = 0;
      if (template && template.defaultAutomations.length > 0) {
        const templateToCreate = template.defaultAutomations.filter(
          (a) => !existingTriggers.has(norm(a.triggerValue))
        );
        if (templateToCreate.length > 0) {
          await (tx.automationRule as any).createMany({
            data: templateToCreate.map((a) => ({
              tenantId: auth.tenantId,
              name: a.name,
              triggerType: a.triggerType || 'keyword',
              triggerValue: a.triggerValue,
              matchType: a.matchType,
              responseType: a.responseType || 'text',
              responseText: a.responseText,
              active: true,
              sourceType: 'system',
              sourceBotKey: bot.id,
            })),
            skipDuplicates: true,
          });
          templateToCreate.forEach((a) => existingTriggers.add(norm(a.triggerValue)));
          templateAutomationsCreated = templateToCreate.length;
        }
      }

      // ── E. Bot-specific automations (specialisation layer) ────────────────
      const botToCreate = bot.automations.filter(
        (a) => !existingTriggers.has(norm(a.triggerValue))
      );
      if (botToCreate.length > 0) {
        await (tx.automationRule as any).createMany({
          data: botToCreate.map((a) => ({
            tenantId: auth.tenantId,
            name: a.name,
            triggerType: 'keyword',
            triggerValue: a.triggerValue,
            matchType: a.matchType,
            responseType: 'text',
            responseText: a.responseText,
            active: true,
            sourceType: 'system',
            sourceBotKey: bot.id,
          })),
          skipDuplicates: true,
        });
      }

      // ── F. Services: deactivate other bots', reactivate current bot's ─────
      await (tx.service as any).updateMany({
        where: {
          tenantId: auth.tenantId,
          sourceType: 'system',
          NOT: { sourceBotKey: bot.id },
        },
        data: { active: false },
      });

      await (tx.service as any).updateMany({
        where: {
          tenantId: auth.tenantId,
          sourceType: 'system',
          sourceBotKey: bot.id,
        },
        data: { active: true },
      });

      // ── G. Create missing template services (idempotent by name) ──────────
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
          await (tx.service as any).createMany({
            data: svcsToCreate.map((svc) => ({
              tenantId: auth.tenantId,
              name: svc.name,
              durationMinutes: svc.durationMinutes,
              active: true,
              sourceType: 'system',
              sourceBotKey: bot.id,
            })),
            skipDuplicates: true,
          });
          servicesCreated = svcsToCreate.length;
        }
      }

      // ── H. Build PRESET block (bot context only — no overwrite of other layers)
      const hoursText = (tenant as any).businessHours || 'horário comercial';
      const presetLines: string[] = [];
      if (template?.defaultPrompt) {
        presetLines.push(template.defaultPrompt);
        presetLines.push('');
      }
      presetLines.push(bot.prompt);
      presetLines.push('');
      presetLines.push('INFORMAÇÕES DA EMPRESA:');
      presetLines.push(`- Nome: ${tenant.name}`);
      presetLines.push(`- Segmento: ${bot.nicheLabel}`);
      presetLines.push(`- Horário de atendimento: ${hoursText}`);
      presetLines.push('');
      presetLines.push('REGRA GERAL: Responda sempre em português brasileiro de forma clara e objetiva.');

      const presetBlock = `${PRESET_BLOCK_START}\n${presetLines.join('\n')}\n${PRESET_BLOCK_END}`;

      // ── I. Inject PRESET block into aiPrompt — preserve GUIDED + manual ───
      const currentPrompt = (tenant as any).aiPrompt as string | null;
      const guidedBlock   = extractManagedBlock(currentPrompt, '[GUIDED_SETUP_START]', '[GUIDED_SETUP_END]');
      const manualLayer   = extractPromptWithoutManagedBlocks(currentPrompt);
      const newPrompt     = composePromptFromBlocks({ presetBlock, guidedBlock, manualLayer });

      // ── J. Update tenant — businessType / welcomeMessage are NOT touched ──
      await tx.tenant.update({
        where: { id: auth.tenantId },
        data: {
          aiPrompt:     newPrompt,
          activeBotKey: bot.id,
        } as any,
      });

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

    // ── K. Checklist de itens pendentes ──────────────────────────────────────
    const pendingSetup: string[] = [];
    const hasChannel = !!(
      (result.tenant as any).whatsappToken ||
      (result.tenant as any).instagramPageId ||
      (result.tenant as any).facebookPageId
    );
    if (!hasChannel) pendingSetup.push('channel');
    if (!(result.tenant as any).businessHours?.trim()) pendingSetup.push('business_hours');
    if (!(result.tenant as any).welcomeMessage?.trim()) pendingSetup.push('welcome_message');
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
