/**
 * SC1/SC2 – Support Copilot API
 * POST /api/support-copilot
 * Answers product questions in context (route, plan, role, channels).
 * Uses platform-level OPENAI_API_KEY — does NOT use tenant key.
 * Rate limit: 20 questions/hour per tenant.
 *
 * Agent upgrade: if OpenCrow is configured, the AI call is delegated to the
 * agent layer. Falls back to the existing OpenAI path if agent fails.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { getPageKnowledge, GENERAL_FAQ, getFaqAnswer } from '@/lib/supportCopilot/knowledgeBase';
import OpenAI from 'openai';
import { runAgentCopilotAssist } from '@/lib/agent';

const RATE_LIMIT_PER_HOUR = 20;

// Suggested links per topic keyword
const SUGGESTED_LINKS: { keywords: string[]; href: string; label: string }[] = [
  { keywords: ['whatsapp', 'canal', 'conectar', 'waba'], href: '/dashboard/integrations', label: 'Conectar canais' },
  { keywords: ['automação', 'automação', 'resposta rápida', 'keyword'], href: '/dashboard/vendas?tab=automacoes', label: 'Automações' },
  { keywords: ['ia', 'prompt', 'inteligência'], href: '/dashboard/ai', label: 'Configuração de IA' },
  { keywords: ['assinatura', 'plano', 'upgrade', 'trial', 'billing'], href: '/dashboard/billing', label: 'Assinatura' },
  { keywords: ['conversa', 'inbox', 'mensagem', 'atendimento'], href: '/dashboard/conversations', label: 'Conversas' },
  { keywords: ['agenda', 'agendamento'], href: '/dashboard/appointments', label: 'Agenda' },
  { keywords: ['pedido', 'produto', 'catálogo'], href: '/dashboard/orders', label: 'Pedidos' },
  { keywords: ['comentário', 'instagram', 'comment'], href: '/dashboard/instagram-comments', label: 'Comentários Instagram' },
  { keywords: ['analytics', 'métricas', 'funil'], href: '/dashboard/analytics', label: 'Analytics' },
  { keywords: ['configuração', 'empresa', 'nicho'], href: '/dashboard/settings', label: 'Configurações' },
  { keywords: ['go-live', 'ativar', 'produção'], href: '/dashboard/go-live', label: 'Go-Live' },
];

function getSuggestedLinks(question: string): { href: string; label: string }[] {
  const q = question.toLowerCase();
  return SUGGESTED_LINKS.filter((s) => s.keywords.some((k) => q.includes(k)))
    .slice(0, 3)
    .map(({ href, label }) => ({ href, label }));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { question, route, history = [] } = body as {
    question: string;
    route?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  };

  if (!question?.trim()) {
    return NextResponse.json({ error: 'question required' }, { status: 400 });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.supportCopilotLog.count({
    where: { tenantId: auth.tenantId, createdAt: { gte: since } },
  });
  if (count >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json({
      answer: 'Você atingiu o limite de 20 perguntas por hora. Tente novamente mais tarde ou entre em contato com o suporte.',
      confidence: 'high',
      suggested_links: [],
      suggested_actions: [],
      fallback_needed: false,
    });
  }

  // ── Tenant context ──────────────────────────────────────────────────────────
  const [subscription, tenant] = await Promise.all([
    prisma.subscription.findUnique({
      where: { tenantId: auth.tenantId },
      select: { plan: true, status: true, trialEnd: true },
    }),
    prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { whatsappToken: true, instagramToken: true, facebookToken: true, setupCompleted: true },
    }),
  ]);

  const plan = subscription?.plan ?? 'starter';
  const subStatus = subscription?.status ?? 'unknown';
  const trialEnd = subscription?.trialEnd;
  const isTrialing = subStatus === 'trialing';
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : null;

  const channels = [
    tenant?.whatsappToken ? 'WhatsApp' : null,
    tenant?.instagramToken ? 'Instagram' : null,
    tenant?.facebookToken ? 'Facebook' : null,
  ]
    .filter(Boolean)
    .join(', ') || 'nenhum canal conectado';

  // ── SC5: FAQ fast-path (no OpenAI call) ─────────────────────────────────────
  const faqAnswer = getFaqAnswer(question);
  if (faqAnswer) {
    const suggested_links = getSuggestedLinks(question);
    prisma.supportCopilotLog
      .create({
        data: {
          tenantId: auth.tenantId,
          question: question.slice(0, 500),
          answer: faqAnswer.slice(0, 1000),
          route: route?.slice(0, 100),
          plan,
          role: auth.role,
        },
      })
      .catch(() => {});
    return NextResponse.json({
      answer: faqAnswer,
      confidence: 'high',
      suggested_links,
      suggested_actions: [],
      fallback_needed: false,
      source: 'faq',
    });
  }

  // ── Build system prompt ─────────────────────────────────────────────────────
  const pageKB = getPageKnowledge(route ?? '');
  const trialInfo = isTrialing && trialDaysLeft !== null
    ? `Trial ativo: ${trialDaysLeft} dia(s) restante(s).`
    : subStatus === 'canceled' ? 'ATENÇÃO: assinatura cancelada.'
    : subStatus === 'past_due' ? 'ATENÇÃO: pagamento em atraso.'
    : '';

  const systemPrompt = `Você é o Copiloto de Suporte da Variaty Secretary IA, um SaaS de automação omnichannel (WhatsApp, Instagram, Facebook) com IA para pequenas e médias empresas.

CONTEXTO DO USUÁRIO:
- Rota atual: ${route ?? 'desconhecida'}
- Plano: ${plan} | Status: ${subStatus}${trialInfo ? ` | ${trialInfo}` : ''}
- Role: ${auth.role}
- Canais conectados: ${channels}
- Setup completo: ${tenant?.setupCompleted ? 'sim' : 'não'}

${pageKB ? `CONTEXTO DESTA PÁGINA:\n${pageKB}\n` : ''}${GENERAL_FAQ}
REGRAS DE RESPOSTA:
1. Responda SEMPRE em português do Brasil
2. Seja conciso — máximo 3 parágrafos curtos ou 5 bullets
3. Seja específico ao contexto do usuário (plano, canais, status)
4. Se a feature não estiver disponível no plano atual, explique e sugira upgrade para o plano correto
5. Se não tiver certeza, diga: "Não tenho certeza sobre isso. Entre em contato: suporte@variaty.com.br"
6. NÃO sugira ações destrutivas, irreversíveis ou fora do sistema
7. Se o usuário não tiver setup completo, priorize orientar para o onboarding`;

  // ── Agent assist (primary, if configured) ──────────────────────────────────
  let answer: string = '';
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let fallback_needed = false;
  let answeredByAgent = false;

  try {
    const agentResult = await runAgentCopilotAssist({
      tenantId: auth.tenantId,
      userId: auth.userId,
      role: auth.role,
      question,
      route,
      history,
    });
    if (agentResult) {
      answer = agentResult.answer;
      confidence = agentResult.confidence as 'high' | 'medium' | 'low';
      answeredByAgent = true;
    }
  } catch {
    // Agent assist failure — fall through to OpenAI
  }

  // ── Call OpenAI (fallback when agent is not configured or fails) ────────────
  if (!answeredByAgent) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('no_key');

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: question },
    ];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 450,
      temperature: 0.2,
    });

    answer = completion.choices[0]?.message?.content?.trim() ?? '';
    if (!answer) throw new Error('empty_response');

    // Low confidence heuristic — if answer contains uncertainty phrases
    if (/não tenho certeza|não sei|suporte@/i.test(answer)) {
      confidence = 'low';
      fallback_needed = true;
    } else if (/pode ser|talvez|provavelmente/i.test(answer)) {
      confidence = 'medium';
    }
  } catch {
    answer = 'Não consegui processar sua pergunta no momento. Entre em contato com nosso suporte em suporte@variaty.com.br';
    confidence = 'low';
    fallback_needed = true;
  }
  } // end if (!answeredByAgent)

  // ── Suggested links ─────────────────────────────────────────────────────────
  const suggested_links = getSuggestedLinks(question);

  // ── Suggested actions (based on context) ───────────────────────────────────
  const suggested_actions: string[] = [];
  if (!tenant?.whatsappToken && /whatsapp|canal|conectar/i.test(question)) {
    suggested_actions.push('Conectar WhatsApp em Canais');
  }
  if (!tenant?.setupCompleted) {
    suggested_actions.push('Completar configuração inicial em Onboarding');
  }
  if (isTrialing && trialDaysLeft !== null && trialDaysLeft <= 2) {
    suggested_actions.push('Assinar um plano para não perder o acesso');
  }

  // ── Log async ───────────────────────────────────────────────────────────────
  prisma.supportCopilotLog
    .create({
      data: {
        tenantId: auth.tenantId,
        question: question.slice(0, 500),
        answer: answer.slice(0, 1000),
        route: route?.slice(0, 100),
        plan,
        role: auth.role,
        confidence,
        fallbackNeeded: fallback_needed,
        source: 'ai',
      },
    })
    .catch(() => {});

  return NextResponse.json({ answer, confidence, suggested_links, suggested_actions, fallback_needed });
}
