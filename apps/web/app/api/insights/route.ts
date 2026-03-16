import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-api';
import { getOrGenerateInsight } from '@/src/services/conversationInsightService';

// GET /api/insights?period=7days  — retorna cache ou gera novo
export async function GET(req: Request) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

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
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

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
