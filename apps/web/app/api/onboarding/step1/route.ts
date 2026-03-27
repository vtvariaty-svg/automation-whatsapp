import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { marketplaceBots } from '@/lib/marketplace/bots';
import { BOT_TEMPLATE_MAP } from '@/lib/marketplace/botTemplateMap';
import { businessTemplates } from '@/lib/onboarding/templates';
import {
  PRESET_BLOCK_START,
  PRESET_BLOCK_END,
  extractManagedBlock,
  extractPromptWithoutManagedBlocks,
  composePromptFromBlocks,
} from '@/lib/ai/guidedSetup';

/** Normaliza strings para deduplicação de automações. */
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { companyName, businessType, businessDescription, phone, address, botId } = body;

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Nome da empresa é obrigatório' }, { status: 400 });
    }

    // ── 1. Salvar contexto básico do negócio — SEM aiPrompt, SEM applyBusinessTemplate ──
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        name: companyName.trim(),
        businessType:        businessType        || null,
        businessDescription: businessDescription || null,
        phone:               phone               || null,
        setupStep: 2,
      },
    });

    // ── 2. Upsert BusinessConfig com endereço ─────────────────────────────────
    if (address?.trim()) {
      await prisma.businessConfig.upsert({
        where:  { tenantId: auth.tenantId },
        update: { address: address.trim() },
        create: { tenantId: auth.tenantId, address: address.trim(), timezone: 'America/Sao_Paulo' },
      });
    }

    // ── 3. Ativar bot server-side se botId informado ──────────────────────────
    let botActivated = false;
    if (botId) {
      const bot = marketplaceBots.find((b) => b.id === botId);
      if (bot) {
        await prisma.$transaction(async (tx) => {
          const tenant = await tx.tenant.findUnique({ where: { id: auth.tenantId } });
          if (!tenant) throw new Error('Tenant não encontrado');

          // Resolver template associado ao bot
          const tmplKey  = BOT_TEMPLATE_MAP[bot.id];
          const template = tmplKey ? businessTemplates[tmplKey] : null;

          // A. Desativar automações system de outros bots
          await (tx.automationRule as any).updateMany({
            where: { tenantId: auth.tenantId, sourceType: 'system', NOT: { sourceBotKey: bot.id } },
            data:  { active: false },
          });

          // B. Reativar automações system já existentes deste bot
          await (tx.automationRule as any).updateMany({
            where: { tenantId: auth.tenantId, sourceType: 'system', sourceBotKey: bot.id },
            data:  { active: true },
          });

          // C. Criar automações do template e do bot (sem duplicar por triggerValue)
          const existingRules = await tx.automationRule.findMany({
            where:  { tenantId: auth.tenantId, active: true },
            select: { triggerValue: true },
          });
          const existingTriggers = new Set(existingRules.map((r) => norm(r.triggerValue)));

          const allAutomations = [
            ...(template?.defaultAutomations ?? []),
            ...bot.automations,
          ];
          const toCreate = allAutomations.filter((a) => !existingTriggers.has(norm(a.triggerValue)));
          if (toCreate.length > 0) {
            await (tx.automationRule as any).createMany({
              data: toCreate.map((a) => ({
                tenantId:     auth.tenantId,
                name:         a.name,
                triggerType:  (a as any).triggerType  || 'keyword',
                triggerValue: a.triggerValue,
                matchType:    a.matchType,
                responseType: (a as any).responseType || 'text',
                responseText: a.responseText,
                active:       true,
                sourceType:   'system',
                sourceBotKey: bot.id,
              })),
              skipDuplicates: true,
            });
          }

          // D. Serviços do template (só cria os que não existem por nome)
          if (template && template.defaultServices.length > 0) {
            const existingSvcs = await tx.service.findMany({
              where:  { tenantId: auth.tenantId },
              select: { name: true },
            });
            const existingNames = new Set(existingSvcs.map((s) => norm(s.name)));
            const svcsToCreate  = template.defaultServices.filter((s) => !existingNames.has(norm(s.name)));
            if (svcsToCreate.length > 0) {
              await (tx.service as any).createMany({
                data: svcsToCreate.map((svc) => ({
                  tenantId:     auth.tenantId,
                  name:         svc.name,
                  durationMinutes: svc.durationMinutes,
                  active:       true,
                  sourceType:   'system',
                  sourceBotKey: bot.id,
                })),
                skipDuplicates: true,
              });
            }
          }

          // E. Construir PRESET block (sem sobrescrever guided/manual layers)
          const hoursText = (tenant as any).businessHours || 'horário comercial';
          const presetLines: string[] = [];
          if (template?.defaultPrompt) { presetLines.push(template.defaultPrompt); presetLines.push(''); }
          presetLines.push(bot.prompt);
          presetLines.push('');
          presetLines.push('INFORMAÇÕES DA EMPRESA:');
          presetLines.push(`- Nome: ${tenant.name}`);
          presetLines.push(`- Segmento: ${bot.nicheLabel}`);
          presetLines.push(`- Horário de atendimento: ${hoursText}`);
          presetLines.push('');
          presetLines.push('REGRA GERAL: Responda sempre em português brasileiro de forma clara e objetiva.');

          const presetBlock  = `${PRESET_BLOCK_START}\n${presetLines.join('\n')}\n${PRESET_BLOCK_END}`;
          const currentPrompt = (tenant as any).aiPrompt as string | null;
          const guidedBlock   = extractManagedBlock(currentPrompt, '[GUIDED_SETUP_START]', '[GUIDED_SETUP_END]');
          const manualLayer   = extractPromptWithoutManagedBlocks(currentPrompt);
          const newPrompt     = composePromptFromBlocks({ presetBlock, guidedBlock, manualLayer });

          // F. Persistir activeBotKey + aiPrompt composto
          await tx.tenant.update({
            where: { id: auth.tenantId },
            data:  { aiPrompt: newPrompt, activeBotKey: bot.id } as any,
          });
        });
        botActivated = true;
      }
    }

    return NextResponse.json({ success: true, nextStep: 2, botActivated });
  } catch (error: any) {
    console.error('Onboarding step 1 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
