/**
 * GET /api/ai-guided-setup   — returns current structured setup + hasWelcome flag
 * PUT /api/ai-guided-setup   — saves structured setup, merges managed prompt block,
 *                              updates businessHours / name, auto-suggests welcome when empty
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import {
  normalizeGuidedAnswers,
  buildManagedPromptBlock,
  mergePromptBlock,
  buildSuggestedWelcome,
} from '@/lib/ai/guidedSetup';

export async function GET(req: Request) {
  const auth = await getAuthTenant(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = await prisma.tenant.findUnique({
      where:  { id: auth.tenantId },
      select: { aiGuidedSetup: true, welcomeMessage: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    const setup = normalizeGuidedAnswers(tenant.aiGuidedSetup);

    return NextResponse.json({
      setup,
      hasWelcome: !!tenant.welcomeMessage?.trim(),
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
      select: { aiPrompt: true, welcomeMessage: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Build and merge the managed block into the existing prompt
    const newBlock  = buildManagedPromptBlock(answers);
    const newPrompt = mergePromptBlock(tenant.aiPrompt, newBlock);

    const updates: Record<string, unknown> = {
      aiGuidedSetup: answers,
      aiPrompt:      newPrompt,
    };

    // Scalar fields — only when explicitly provided
    if (answers.companyName)   updates.name          = answers.companyName;
    if (answers.businessHours) updates.businessHours = answers.businessHours;

    // Auto-suggest welcome ONLY when currently empty and we have enough context
    if (!tenant.welcomeMessage?.trim() && Object.keys(answers).length >= 2) {
      updates.welcomeMessage = buildSuggestedWelcome(answers);
    }

    await prisma.tenant.update({ where: { id: auth.tenantId }, data: updates });

    return NextResponse.json({
      ok:           true,
      managedBlock: newBlock,
      newPrompt:    newPrompt,
      newWelcome:   (updates.welcomeMessage as string) ?? null,
    });
  } catch (err: any) {
    console.error('[ai-guided-setup] PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
