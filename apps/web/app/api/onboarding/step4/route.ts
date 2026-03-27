import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { marketplaceBots } from '@/lib/marketplace/bots';
import { extractManagedBlock, PRESET_BLOCK_START, PRESET_BLOCK_END } from '@/lib/ai/guidedSetup';

export async function GET(request: Request) {
  try {
    const auth = await getAuthTenant(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: {
        aiPrompt: true,
        welcomeMessage: true,
        aiGuidedSetup: true,
        activeBotKey: true,
      },
    });

    const activeBotKey = (tenant as any)?.activeBotKey as string | null;
    const bot = activeBotKey ? marketplaceBots.find((b) => b.id === activeBotKey) : null;

    const presetBlock = extractManagedBlock(
      (tenant as any)?.aiPrompt,
      PRESET_BLOCK_START,
      PRESET_BLOCK_END,
    );

    const presetPromptPreview = presetBlock
      ? presetBlock.replace(PRESET_BLOCK_START, '').replace(PRESET_BLOCK_END, '').trim()
      : null;

    return NextResponse.json({
      presetPromptPreview,
      guidedSetupDone: !!(tenant as any)?.aiGuidedSetup,
      welcomeMessage: (tenant as any)?.welcomeMessage ?? '',
      botName: bot?.name ?? null,
      hasBotActive: !!activeBotKey,
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
    const { welcomeMessage } = body;

    // Only save welcomeMessage — DO NOT generate or overwrite aiPrompt or any managed block
    await prisma.tenant.update({
      where: { id: auth.tenantId },
      data: {
        ...(welcomeMessage !== undefined && {
          welcomeMessage: welcomeMessage?.trim() || null,
        }),
        setupStep: 5,
      } as any,
    });

    return NextResponse.json({ success: true, nextStep: 5 });
  } catch (error: any) {
    console.error('Onboarding step 4 error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
