/**
 * POST /api/ai-control-center/reset
 *
 * Scoped reset — clears only the section indicated by `scope`.
 *
 * scope='preset'      → null activeBotKey, remove PRESET block, delete system automations,
 *                        deactivate system services
 * scope='guided_setup'→ null aiGuidedSetup, remove GUIDED block
 *                        (name / businessHours / welcomeMessage are NOT touched)
 * scope='identity'    → remove manual prompt layer (keep PRESET + GUIDED blocks), null businessHours
 * scope='welcome'     → null welcomeMessage
 * scope='automations' → deleteMany manual AutomationRule only (sourceType='manual')
 * scope='all'         → all of the above in one transaction
 */

import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import {
  PRESET_BLOCK_START,
  PRESET_BLOCK_END,
  removeManagedBlock,
  extractManagedBlock,
  composePromptFromBlocks,
} from '@/lib/ai/guidedSetup';

type Scope = 'all' | 'preset' | 'guided_setup' | 'identity' | 'welcome' | 'automations' | 'business_context' | 'scheduling';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let scope: Scope;
  try {
    const body = await request.json();
    scope = body.scope;
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const validScopes: Scope[] = ['all', 'preset', 'guided_setup', 'identity', 'welcome', 'automations', 'business_context', 'scheduling'];
  if (!validScopes.includes(scope)) {
    return NextResponse.json({ error: `scope inválido. Use: ${validScopes.join(' | ')}` }, { status: 400 });
  }

  try {
    const stats: Record<string, number | null> = {};

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: auth.tenantId },
        select: { aiPrompt: true } as any,
      });
      const currentPrompt = (tenant as any)?.aiPrompt as string | null ?? '';

      const doPreset          = scope === 'preset'          || scope === 'all';
      const doGuidedSetup     = scope === 'guided_setup'    || scope === 'all';
      const doIdentity        = scope === 'identity'        || scope === 'all';
      const doWelcome         = scope === 'welcome'         || scope === 'all';
      const doAutomations     = scope === 'automations'     || scope === 'all';
      const doBusinessContext = scope === 'business_context' || scope === 'all';
      const doScheduling      = scope === 'scheduling'      || scope === 'all';

      // ── PRESET scope ─────────────────────────────────────────────────────
      if (doPreset) {
        // Remove PRESET block from aiPrompt
        const withoutPreset = removeManagedBlock(currentPrompt, PRESET_BLOCK_START, PRESET_BLOCK_END);

        await (tx.tenant as any).update({
          where: { id: auth.tenantId },
          data: { activeBotKey: null, aiPrompt: withoutPreset },
        });

        const { count: automationsDeleted } = await (tx.automationRule as any).deleteMany({
          where: { tenantId: auth.tenantId, sourceType: 'system' },
        });
        const { count: servicesDeactivated } = await (tx.service as any).updateMany({
          where: { tenantId: auth.tenantId, sourceType: 'system' },
          data: { active: false },
        });
        stats.automationsDeleted   = automationsDeleted;
        stats.servicesDeactivated  = servicesDeactivated;
      }

      // ── GUIDED_SETUP scope ───────────────────────────────────────────────
      if (doGuidedSetup) {
        // Use the prompt after any preset removal if both scopes apply
        const basePrompt = doPreset
          ? removeManagedBlock(currentPrompt, PRESET_BLOCK_START, PRESET_BLOCK_END)
          : currentPrompt;

        const withoutGuided = removeManagedBlock(basePrompt, '[GUIDED_SETUP_START]', '[GUIDED_SETUP_END]');

        await (tx.tenant as any).update({
          where: { id: auth.tenantId },
          data: { aiGuidedSetup: null, aiPrompt: withoutGuided },
        });
      }

      // ── IDENTITY scope ───────────────────────────────────────────────────
      if (doIdentity) {
        // Keep PRESET and GUIDED blocks; strip manual layer; null businessHours
        let base = currentPrompt;
        if (doPreset)      base = removeManagedBlock(base, PRESET_BLOCK_START, PRESET_BLOCK_END);
        if (doGuidedSetup) base = removeManagedBlock(base, '[GUIDED_SETUP_START]', '[GUIDED_SETUP_END]');

        const presetBlock  = doPreset      ? null : extractManagedBlock(base, PRESET_BLOCK_START, PRESET_BLOCK_END);
        const guidedBlock  = doGuidedSetup ? null : extractManagedBlock(base, '[GUIDED_SETUP_START]', '[GUIDED_SETUP_END]');
        const identityPrompt = composePromptFromBlocks({ presetBlock, guidedBlock, manualLayer: null });

        await (tx.tenant as any).update({
          where: { id: auth.tenantId },
          data: { aiPrompt: identityPrompt, businessHours: null },
        });
      }

      // ── WELCOME scope ────────────────────────────────────────────────────
      if (doWelcome) {
        await (tx.tenant as any).update({
          where: { id: auth.tenantId },
          data: { welcomeMessage: null },
        });
      }

      // ── AUTOMATIONS scope (manual only) ──────────────────────────────────
      if (doAutomations) {
        const { count: manualDeleted } = await (tx.automationRule as any).deleteMany({
          where: { tenantId: auth.tenantId, sourceType: 'manual' },
        });
        stats.manualAutomationsDeleted = manualDeleted;
      }

      // ── BUSINESS_CONTEXT scope ───────────────────────────────────────────
      if (doBusinessContext) {
        await (tx.tenant as any).update({
          where: { id: auth.tenantId },
          data: {
            name: '', // Required field
            businessType: null,
            phone: null,
            businessConfig: {
              upsert: {
                create: { address: null },
                update: { address: null },
              },
            },
          },
        });
      }

      // ── SCHEDULING scope ─────────────────────────────────────────────────
      if (doScheduling) {
        // Delete related entities (manual + system)
        const { count: svcCount } = await (tx.service as any).deleteMany({
          where: { tenantId: auth.tenantId },
        });
        const { count: profCount } = await (tx.professional as any).deleteMany({
          where: { tenantId: auth.tenantId },
        });
        const { count: blockCount } = await (tx.availabilityBlock as any).deleteMany({
          where: { tenantId: auth.tenantId },
        });

        // Clear scheduling operational config
        await (tx.tenant as any).update({
          where: { id: auth.tenantId },
          data: {
            businessConfig: {
              upsert: {
                create: {
                  openingHours: null,
                  templateBookingConfirmed: null,
                  templateReminder24h: null,
                },
                update: {
                  openingHours: null,
                  templateBookingConfirmed: null,
                  templateReminder24h: null,
                },
              },
            },
          },
        });

        stats.servicesDeleted = svcCount;
        stats.professionalsDeleted = profCount;
        stats.blocksDeleted = blockCount;
      }
    });

    return NextResponse.json({ success: true, scope, ...stats });
  } catch (error: any) {
    console.error('[ai-control-center/reset] Erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
