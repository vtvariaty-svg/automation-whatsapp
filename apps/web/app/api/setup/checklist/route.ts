/**
 * GET /api/setup/checklist
 * Returns adaptive setup checklist for the current tenant, based on their plan.
 * Steps and completion status reflect real data from the database.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { marketplaceBots } from '@/lib/marketplace/bots';

export const dynamic = 'force-dynamic';

// ─── Step definitions per plan ────────────────────────────────────────────────

const PLAN_STEPS: Record<string, StepDef[]> = {
  free: [
    { id: 'profile',            title: 'Perfil inicial',           description: 'Configure nome, tipo de negócio e horários de atendimento.',    href: '/onboarding/step/1',        cta: 'Configurar perfil',   priority: 1 },
    { id: 'instagram',          title: 'Conectar Instagram',        description: 'Vincule sua conta para receber DMs automaticamente.',           href: '/dashboard/integrations',   cta: 'Conectar Instagram',  priority: 2 },
    { id: 'automation',         title: 'Criar automação',           description: 'Adicione pelo menos 1 resposta automática por palavra-chave.',  href: '/dashboard/vendas?tab=automacoes',    cta: 'Criar automação',     priority: 3 },
    { id: 'first_conversation', title: 'Receber primeira conversa', description: 'Aguarde ou dispare uma mensagem teste para o canal conectado.', href: '/dashboard/conversations',  cta: 'Ver conversas',       priority: 4 },
  ],
  standard: [
    { id: 'profile',            title: 'Perfil inicial',                  description: 'Configure nome, tipo de negócio e horários de atendimento.',    href: '/onboarding/step/1',        cta: 'Configurar perfil',     priority: 1 },
    { id: 'trial',              title: 'Trial de 7 dias ativo',           description: 'Seu período gratuito está contando. Explore todos os recursos.', href: '/dashboard/billing',        cta: 'Ver assinatura',        priority: 2 },
    { id: 'instagram',          title: 'Conectar Instagram',              description: 'Vincule sua conta para receber DMs automaticamente.',           href: '/dashboard/integrations',   cta: 'Conectar Instagram',    priority: 3 },
    { id: 'whatsapp',           title: 'Conectar WhatsApp',               description: 'Vincule o WhatsApp Business para atendimento automático.',      href: '/onboarding/step/2',        cta: 'Conectar WhatsApp',     priority: 4 },
    { id: 'automation',         title: 'Criar automação',                 description: 'Adicione pelo menos 1 resposta automática por palavra-chave.',  href: '/dashboard/vendas?tab=automacoes',    cta: 'Criar automação',       priority: 5 },
    { id: 'template',           title: 'Configurar template WhatsApp',    description: 'Crie um template aprovado pela Meta para mensagens ativas.',   href: '/dashboard/templates',      cta: 'Criar template',        priority: 6 },
    { id: 'first_conversation', title: 'Receber primeira conversa',       description: 'Aguarde ou dispare uma mensagem teste para o canal conectado.', href: '/dashboard/conversations',  cta: 'Ver conversas',         priority: 7 },
  ],
  pro: [
    { id: 'profile',            title: 'Perfil inicial',           description: 'Configure nome, tipo de negócio e horários de atendimento.',    href: '/onboarding/step/1',        cta: 'Configurar perfil',     priority: 1 },
    { id: 'whatsapp',           title: 'Conectar WhatsApp',        description: 'Vincule o WhatsApp Business para atendimento automático.',      href: '/onboarding/step/2',        cta: 'Conectar WhatsApp',     priority: 2 },
    { id: 'instagram',          title: 'Conectar Instagram',       description: 'Vincule sua conta para receber DMs automaticamente.',           href: '/dashboard/integrations',   cta: 'Conectar Instagram',    priority: 3 },
    { id: 'facebook',           title: 'Conectar Facebook',        description: 'Vincule o Facebook Messenger para operação omnichannel.',       href: '/dashboard/integrations',   cta: 'Conectar Facebook',     priority: 4 },
    { id: 'automation',         title: 'Criar automação',          description: 'Adicione pelo menos 1 resposta automática por palavra-chave.',  href: '/dashboard/vendas?tab=automacoes',    cta: 'Criar automação',       priority: 5 },
    { id: 'crm',                title: 'Ativar CRM avançado',      description: 'Configure tags, segmentos e pipeline de vendas.',              href: '/dashboard/sales',          cta: 'Configurar CRM',        priority: 6 },
    { id: 'first_conversation', title: 'Receber primeira conversa', description: 'Valide os canais com uma mensagem de teste.',                 href: '/dashboard/conversations',  cta: 'Ver conversas',         priority: 7 },
  ],
  business: [
    { id: 'profile',            title: 'Perfil inicial',              description: 'Configure nome, tipo de negócio e horários de atendimento.',    href: '/onboarding/step/1',        cta: 'Configurar perfil',     priority: 1 },
    { id: 'whatsapp',           title: 'Conectar WhatsApp',           description: 'Vincule o WhatsApp Business.',                                  href: '/onboarding/step/2',        cta: 'Conectar WhatsApp',     priority: 2 },
    { id: 'instagram',          title: 'Conectar Instagram',          description: 'Vincule sua conta Instagram.',                                  href: '/dashboard/integrations',   cta: 'Conectar Instagram',    priority: 3 },
    { id: 'facebook',           title: 'Conectar Facebook',           description: 'Vincule o Facebook Messenger.',                                 href: '/dashboard/integrations',   cta: 'Conectar Facebook',     priority: 4 },
    { id: 'automation',         title: 'Criar automação principal',   description: 'Publique pelo menos 1 resposta automática ativa.',              href: '/dashboard/vendas?tab=automacoes',    cta: 'Criar automação',       priority: 5 },
    { id: 'team',               title: 'Configurar equipe',           description: 'Adicione membros da equipe e configure permissões.',            href: '/dashboard/settings',       cta: 'Gerenciar equipe',      priority: 6 },
    { id: 'go_live',            title: 'Ativar plataforma',           description: 'Verifique o checklist e coloque o sistema em produção.',        href: '/dashboard/go-live',        cta: 'Ativar agora',          priority: 7 },
    { id: 'first_conversation', title: 'Receber primeira conversa',   description: 'Confirme que os canais estão respondendo.',                    href: '/dashboard/conversations',  cta: 'Ver conversas',         priority: 8 },
  ],
};

// Free and Standard steps apply to legacy plans too
PLAN_STEPS['starter'] = PLAN_STEPS['free'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepDef {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  priority: number;
}

type StepStatus = 'completed' | 'next' | 'pending';

interface ChecklistStep extends StepDef {
  status: StepStatus;
}

interface BotSetupStep {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

interface BotSetup {
  botId: string;
  botName: string;
  steps: BotSetupStep[];
  completed: number;
  total: number;
}

// ─── Completion map ────────────────────────────────────────────────────────────

async function buildCompletionMap(tenantId: string): Promise<Record<string, boolean>> {
  const [tenant, instagramConn, automationCount, conversationCount, subscription, userCount] =
    await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          businessType: true,
          whatsappToken: true,
          facebookToken: true,
          operationalStatus: true,
        },
      }),
      prisma.instagramConnection.findUnique({ where: { tenantId }, select: { status: true } }),
      prisma.automationRule.count({ where: { tenantId, active: true } }),
      prisma.conversation.count({ where: { tenantId } }),
      prisma.subscription.findUnique({
        where: { tenantId },
        select: { status: true, trialEnd: true },
      }),
      prisma.user.count({ where: { tenantId } }),
    ]);

  // Optional model counts — wrapped to avoid compile/runtime issues on missing tables
  const templateCount: number =
    await (prisma as any).whatsAppTemplate?.count({ where: { tenantId } }).catch(() => 0) ?? 0;
  const contactCount: number =
    await (prisma as any).contact?.count({ where: { tenantId } }).catch(() => 0) ?? 0;

  const now = new Date();

  return {
    profile: !!(tenant?.name?.trim() && tenant?.businessType?.trim()),
    whatsapp: tenant?.whatsappToken != null,
    instagram: instagramConn?.status === 'connected',
    facebook: tenant?.facebookToken != null,
    automation: automationCount > 0,
    template: templateCount > 0,
    first_conversation: conversationCount > 0,
    trial: !!(
      subscription?.status === 'trialing' &&
      subscription?.trialEnd &&
      subscription.trialEnd > now
    ),
    crm: contactCount > 0,
    team: userCount > 1,
    go_live: tenant?.operationalStatus === 'live',
  };
}

// ─── Basic activation analytics (read-only, no new tables) ─────────────────────

async function buildAnalytics(tenantId: string) {
  const [firstAutomation, firstConversation, totalAutomations, totalConversations] =
    await Promise.all([
      prisma.automationRule.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.conversation.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      prisma.automationRule.count({ where: { tenantId, active: true } }),
      prisma.conversation.count({ where: { tenantId } }),
    ]);

  return {
    firstAutomationAt: firstAutomation?.createdAt ?? null,
    firstConversationAt: firstConversation?.createdAt ?? null,
    totalActiveAutomations: totalAutomations,
    totalConversations,
  };
}

// ─── Bot setup section ────────────────────────────────────────────────────────

async function buildBotSetup(tenantId: string): Promise<BotSetup | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { activeBotKey: true, whatsappToken: true, facebookToken: true, businessHours: true, aiPrompt: true, welcomeMessage: true },
  });

  if (!tenant?.activeBotKey) return null;

  const bot = marketplaceBots.find((b) => b.id === tenant.activeBotKey);
  if (!bot) return null;

  const needsCatalog = bot.modules.includes('catalogo');

  const [instagramConn, activeCatalogCount] = await Promise.all([
    prisma.instagramConnection.findUnique({ where: { tenantId }, select: { status: true } }),
    needsCatalog
      ? prisma.product.count({ where: { tenantId, active: true } })
      : Promise.resolve(0),
  ]);

  const hasChannel = !!(tenant.whatsappToken || tenant.facebookToken || instagramConn?.status === 'connected');

  const steps: BotSetupStep[] = [
    {
      id: 'bot_channel',
      title: 'Canal conectado',
      description: 'Conecte WhatsApp, Instagram ou Facebook para o bot atender.',
      href: '/dashboard/integrations',
      cta: 'Conectar canal',
      done: hasChannel,
    },
    {
      id: 'bot_hours',
      title: 'Horário de atendimento',
      description: 'Informe os horários para o bot informar os clientes corretamente.',
      href: '/onboarding/step/1',
      cta: 'Configurar horários',
      done: !!tenant.businessHours?.trim(),
    },
    {
      id: 'bot_prompt',
      title: 'Prompt da IA revisado',
      description: 'Revise e personalize o prompt gerado pelo bot.',
      href: '/dashboard/bots?tab=comportamento',
      cta: 'Revisar prompt',
      done: !!tenant.aiPrompt?.trim(),
    },
    {
      id: 'bot_welcome',
      title: 'Mensagem de boas-vindas revisada',
      description: 'Revise a mensagem de boas-vindas configurada pelo bot.',
      href: '/dashboard/bots?tab=comportamento',
      cta: 'Revisar boas-vindas',
      done: !!tenant.welcomeMessage?.trim(),
    },
  ];

  // CAT1 — catalog step only for bots that sell products
  if (needsCatalog) {
    steps.push({
      id: 'bot_catalog',
      title: 'Produtos no catálogo',
      description: 'Adicione pelo menos 1 produto ativo para o bot poder apresentar e vender.',
      href: '/dashboard/vendas',
      cta: 'Gerenciar produtos',
      done: activeCatalogCount > 0,
    });
  }

  const completed = steps.filter((s) => s.done).length;

  return { botId: bot.id, botName: bot.name, steps, completed, total: steps.length };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tenantId } = auth;

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { plan: true, status: true, trialEnd: true },
  });

  const plan = subscription?.plan ?? 'free';
  const stepDefs = PLAN_STEPS[plan] ?? PLAN_STEPS['free'];

  const [completionMap, analytics, botSetup] = await Promise.all([
    buildCompletionMap(tenantId),
    buildAnalytics(tenantId),
    buildBotSetup(tenantId),
  ]);

  // Build steps with real status
  const steps: ChecklistStep[] = stepDefs.map((def) => ({
    ...def,
    status: completionMap[def.id] ? 'completed' : 'pending',
  }));

  // Mark the first non-completed step as 'next'
  const firstPending = steps.find((s) => s.status === 'pending');
  if (firstPending) firstPending.status = 'next';

  const completed = steps.filter((s) => s.status === 'completed').length;
  const total = steps.length;

  return NextResponse.json({
    plan,
    trialEnd: subscription?.trialEnd ?? null,
    isTrialing: subscription?.status === 'trialing',
    progress: { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 },
    steps,
    analytics,
    ...(botSetup ? { botSetup } : {}),
  });
}
