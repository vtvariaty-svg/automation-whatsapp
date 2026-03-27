/**
 * GET /api/ai-guided-setup   — returns current structured setup + hasWelcome flag
 * PUT /api/ai-guided-setup   — saves structured setup, updates GUIDED block in aiPrompt.
 *
 * Ownership: this route owns ONLY `aiGuidedSetup` and the GUIDED block inside `aiPrompt`.
 * It NEVER writes: tenant.name, tenant.businessHours, tenant.welcomeMessage.
 * Those fields belong to their respective sections in the AI Control Center.
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import {
  normalizeGuidedAnswers,
  buildManagedPromptBlock,
  extractManagedBlock,
  extractPromptWithoutManagedBlocks,
  composePromptFromBlocks,
  PRESET_BLOCK_START,
  PRESET_BLOCK_END,
} from '@/lib/ai/guidedSetup';

export async function GET(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = await prisma.tenant.findUnique({
      where:  { id: auth.tenantId },
      select: { aiGuidedSetup: true, welcomeMessage: true } as any,
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const setup = normalizeGuidedAnswers((tenant as any).aiGuidedSetup);

    return NextResponse.json({
      setup,
      hasWelcome: !!(tenant as any).welcomeMessage?.trim(),
    });
  } catch (err: any) {
    console.error('[ai-guided-setup] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const answers = normalizeGuidedAnswers(body.setup);

    const tenant = await prisma.tenant.findUnique({
      where:  { id: auth.tenantId },
      select: { aiPrompt: true } as any,
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Build new GUIDED block
    const newGuidedBlock = buildManagedPromptBlock(answers);

    // Preserve PRESET block and manual layer — only replace GUIDED block
    const currentPrompt = (tenant as any).aiPrompt as string | null;
    const presetBlock   = extractManagedBlock(currentPrompt, PRESET_BLOCK_START, PRESET_BLOCK_END);
    const manualLayer   = extractPromptWithoutManagedBlocks(currentPrompt);
    const newPrompt     = composePromptFromBlocks({
      presetBlock,
      guidedBlock: newGuidedBlock,
      manualLayer,
    });

    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        aiGuidedSetup: answers,
        aiPrompt:      newPrompt,
      } as any,
    });

    return NextResponse.json({
      ok:           true,
      managedBlock: newGuidedBlock,
      newPrompt,
      newWelcome:   null,
    });
  } catch (err: any) {
    console.error('[ai-guided-setup] PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
