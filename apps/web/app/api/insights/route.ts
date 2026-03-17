import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-api';
import { checkFeature } from '@/lib/services/entitlementsService';
import { getOrGenerateInsight } from '@/src/services/conversationInsightService';

async function enforceAiCopilot(user: { tenantId: string; role?: string }) {
  const check = await checkFeature(user.tenantId, 'aiCopilot', user.role);
  if (!check.allowed) return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });
  return null;
}

// GET /api/insights?period=7days  — retorna cache ou gera novo
export async function GET(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const deny = await enforceAiCopilot(user);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '7days';

  try {
    const report = await getOrGenerateInsight(user.tenantId, period, false);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[Insights] Erro ao gerar relatório:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/insights?period=7days  — força regeneração ignorando cache
export async function POST(req: Request) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const deny = await enforceAiCopilot(user);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '7days';

  try {
    const report = await getOrGenerateInsight(user.tenantId, period, true);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[Insights] Erro ao regenerar relatório:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
