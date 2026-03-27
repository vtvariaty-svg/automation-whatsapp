/**
 * GET /api/setup/checklist
 * Returns adaptive setup checklist for the current tenant, based on their plan.
 * Steps and completion status reflect real data from the database.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { marketplaceBots } from '@/lib/marketplace/bots';
import { extractPromptWithoutManagedBlocks } from '@/lib/ai/guidedSetup';

export const dynamic = 'force-dynamic';

// ─── Step definitions: contextual by plan + businessType ─────────────────────

const AGENDA_TYPES = new Set(['clínica', 'salão', 'estética', 'serviços locais']);
const SALES_TYPES  = new Set(['ecommerce', 'restaurante', 'infoproduto']);

function getContextualStepDefs(plan: string, businessType: string | null): StepDef[] {
  const bType = (businessType ?? 'outro').toLowerCase();
  const isAgenda = AGENDA_TYPES.has(bType);
  const isSales  = SALES_TYPES.has(bType);

  // Base steps always included
  const steps: StepDef[] = [
    { id: 'profile', title: 'Contexto do Negócio', description: 'Configure nome, tipo de negócio, telefone e endereço.', href: '/onboarding/step/1', cta: 'Configurar contexto', priority: 1 },
  ];

  if (plan === 'free' || plan === 'starter') {
    steps.push(
      { id: 'instagram',          title: 'Conectar Instagram',        description: 'Vincule sua conta para receber DMs automaticamente.',          href: '/dashboard/integrations',          cta: 'Conectar Instagram', priority: 2 },
      { id: 'automation',         title: 'Criar automação',           description: 'Adicione pelo menos 1 resposta automática por palavra-chave.', href: '/dashboard/vendas?tab=automacoes', cta: 'Criar automação',    priority: 3 },
      { id: 'first_conversation', title: 'Receber primeira conversa', description: 'Aguarde ou dispare uma mensagem teste para o canal conectado.',href: '/dashboard/conversations',         cta: 'Ver conversas',      priority: 4 },
    );
    return steps;
  }

  // Paid plans
  steps.push(
    { id: 'welcome',   title: 'Mensagem de boas-vindas', description: 'Configure a mensagem enviada automaticamente no primeiro contato pelo WhatsApp.', href: '/dashboard/atendimento-ia#welcome', cta: 'Configurar boas-vindas', priority: 2 },
    { id: 'whatsapp',  title: 'Conectar WhatsApp',  description: 'Vincule o WhatsApp Business para atendimento automático.',    href: '/onboarding/step/2',       cta: 'Conectar WhatsApp',  priority: 3 },
    { id: 'instagram', title: 'Conectar Instagram', description: 'Vincule sua conta para receber DMs automaticamente.',          href: '/dashboard/integrations',  cta: 'Conectar Instagram', priority: 4 },
  );

  if (plan === 'standard' || plan === 'trial') {
    steps.push({ id: 'trial', title: 'Trial de 7 dias ativo', description: 'Seu período gratuito está contando. Explore todos os recursos.', href: '/dashboard/billing', cta: 'Ver assinatura', priority: 4 });
  }

  // businessType-specific setup steps
  if (isAgenda) {
    steps.push(
      { id: 'services',     title: 'Cadastrar serviços', description: 'Defina os serviços que você oferece para ativar o agendamento automático.', href: '/dashboard/services',      cta: 'Cadastrar serviços',   priority: 5 },
      { id: 'appointments', title: 'Configurar agenda',  description: 'Seus clientes poderão agendar diretamente pelo WhatsApp.',                  href: '/dashboard/appointments',  cta: 'Configurar agenda',    priority: 6 },
    );
  } else if (isSales) {
    steps.push(
      { id: 'catalog', title: 'Configurar catálogo', description: 'Adicione produtos e a IA enviará links de compra automaticamente.', href: '/dashboard/vendas',    cta: 'Configurar catálogo', priority: 5 },
      { id: 'payments', title: 'Configurar cobranças', description: 'Receba pagamentos integrados diretamente via chat.',               href: '/dashboard/payments', cta: 'Configurar cobranças', priority: 6 },
    );
  } else {
    // Generic: include both agenda and sales basics
    steps.push(
      { id: 'catalog',  title: 'Configurar catálogo ou serviços', description: 'Cadastre produtos ou serviços para a IA apresentar aos clientes.', href: '/dashboard/vendas',    cta: 'Gerenciar catálogo',  priority: 5 },
    );
  }

  steps.push(
    { id: 'automation', title: 'Criar automação', description: 'Adicione pelo menos 1 resposta automática por palavra-chave.', href: '/dashboard/vendas?tab=automacoes', cta: 'Criar automação', priority: 7 },
  );

  if (plan === 'pro' || plan === 'business') {
    steps.push(
      { id: 'facebook', title: 'Conectar Facebook', description: 'Vincule o Facebook Messenger para operação omnichannel.', href: '/dashboard/integrations', cta: 'Conectar Facebook', priority: 8 },
    );
  }

  if (plan === 'pro') {
    steps.push(
      { id: 'crm', title: 'Ativar CRM avançado', description: 'Configure tags, segmentos e pipeline de vendas.', href: '/dashboard/sales', cta: 'Configurar CRM', priority: 9 },
    );
  }

  if (plan === 'business') {
    steps.push(
      { id: 'team',    title: 'Configurar equipe',   description: 'Adicione membros da equipe e configure permissões.',               href: '/dashboard/settings', cta: 'Gerenciar equipe', priority: 9 },
      { id: 'go_live', title: 'Ativar plataforma',   description: 'Verifique o checklist e coloque o sistema em produção.',           href: '/dashboard/go-live',  cta: 'Ativar agora',     priority: 10 },
    );
  }

  steps.push(
    { id: 'first_conversation', title: 'Receber primeira conversa', description: 'Aguarde ou dispare uma mensagem teste para o canal conectado.', href: '/dashboard/conversations', cta: 'Ver conversas', priority: 99 },
  );

  return steps.sort((a, b) => a.priority - b.priority);
}

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
  const [
    tenant,
    instagramConn,
    automationCount,
    conversationCount,
    subscription,
    userCount,
    serviceCount,
    productCount,
    orderCount,
    payConfig,
  ] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        businessType: true,
        phone: true,
        whatsappToken: true,
        facebookToken: true,
        operationalStatus: true,
        welcomeMessage: true,
        activeBotKey: true,
        aiPrompt: true,
        aiGuidedSetup: true,
        businessHours: true,
        businessConfig: {
          select: {
            address: true,
            openingHours: true,
          }
        }
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
    prisma.service.count({ where: { tenantId, active: true } }),
    prisma.product.count({ where: { tenantId, active: true } }),
    prisma.order.count({ where: { tenantId } }),
    prisma.tenantPaymentConfig.findUnique({ where: { tenantId }, select: { enabled: true } }).catch(() => null),
  ]);

  // Optional model counts — wrapped to avoid compile/runtime issues on missing tables
  const templateCount: number =
    await (prisma as any).whatsAppTemplate?.count({ where: { tenantId } }).catch(() => 0) ?? 0;
  const contactCount: number =
    await (prisma as any).contact?.count({ where: { tenantId } }).catch(() => 0) ?? 0;

  const now = new Date();
  const hasWhatsapp = tenant?.whatsappToken != null;
  const manualPrompt = extractPromptWithoutManagedBlocks(tenant?.aiPrompt);

  return {
    profile: !!(tenant?.name?.trim() && tenant?.businessType?.trim() && tenant?.phone?.trim() && tenant?.businessConfig?.address?.trim()),
    welcome: !!tenant?.welcomeMessage?.trim(),
    whatsapp: hasWhatsapp,
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
    // businessType-aware steps (considering fallback if no bot active)
    services: serviceCount > 0,
    appointments: (serviceCount > 0 || !!tenant?.businessConfig?.openingHours?.trim()) && hasWhatsapp,
    catalog: productCount > 0,
    orders: orderCount > 0,
    payments: payConfig?.enabled === true,
    // AI Control Center Canonical settings
    preset: !!tenant?.activeBotKey,
    guided_setup: !!tenant?.aiGuidedSetup,
    identity_manual: !!(manualPrompt.length > 0 || tenant?.businessHours?.trim())
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
    select: { 
      activeBotKey: true, 
      whatsappToken: true, 
      facebookToken: true, 
      businessHours: true, 
      aiPrompt: true, 
      welcomeMessage: true,
      aiGuidedSetup: true,
      businessConfig: {
        select: {
          openingHours: true,
        }
      }
    },
  });

  if (!tenant?.activeBotKey) return null;

  const bot = marketplaceBots.find((b) => b.id === tenant.activeBotKey);
  if (!bot) return null;

  const needsCatalog = bot.modules.includes('catalogo');
  const needsAgenda  = bot.modules.includes('agenda');

  const [instagramConn, productCount, serviceCount] = await Promise.all([
    prisma.instagramConnection.findUnique({ where: { tenantId }, select: { status: true } }),
    prisma.product.count({ where: { tenantId, active: true } }),
    prisma.service.count({ where: { tenantId, active: true } }),
  ]);

  const hasChannel = !!(tenant.whatsappToken || tenant.facebookToken || instagramConn?.status === 'connected');
  const manualPromptContent = extractPromptWithoutManagedBlocks(tenant.aiPrompt);

  const steps: BotSetupStep[] = [
    {
      id: 'bot_channel',
      title: 'Canal de atendimento conectado',
      description: 'Conecte WhatsApp, Instagram ou Facebook para o bot poder atender.',
      href: '/dashboard/integrations',
      cta: 'Conectar canal',
      done: hasChannel,
    },
    {
      id: 'bot_preset',
      title: 'Bot preset ativado',
      description: 'Escolha um modelo de bot pré-configurado para o seu negócio.',
      href: '/dashboard/bots',
      cta: 'Escolher bot',
      done: !!tenant.activeBotKey,
    },
    {
      id: 'bot_guided',
      title: 'Configuração guiada concluída',
      description: 'Ensine o contexto do seu negócio respondendo às perguntas da IA.',
      href: '/dashboard/atendimento-ia#guided-setup',
      cta: 'Iniciar configuração guiada',
      done: !!tenant.aiGuidedSetup,
    },
    {
      id: 'bot_prompt',
      title: 'Identidade da IA (Manual) revisada',
      description: 'Revise e personalize o prompt manual para dar o toque final no tom da IA.',
      href: '/dashboard/atendimento-ia#ai-identity',
      cta: 'Revisar prompt manual',
      done: !!(manualPromptContent.trim().length > 0 || tenant.businessHours?.trim()),
    },
    {
      id: 'bot_welcome',
      title: 'Boas-vindas configurada',
      description: 'Configure a mensagem inicial — bots não definem esta mensagem automaticamente por segurança.',
      href: '/dashboard/atendimento-ia#welcome',
      cta: 'Configurar boas-vindas',
      done: !!tenant.welcomeMessage?.trim(),
    },
  ];

  // Modules: Catalog OR Services
  if (needsCatalog) {
    steps.push({
      id: 'bot_catalog',
      title: 'Catálogo de produtos',
      description: 'Adicione pelo menos 1 produto ativo para o bot poder apresentar e vender.',
      href: '/dashboard/vendas',
      cta: 'Gerenciar produtos',
      done: productCount > 0,
    });
  }
  if (needsAgenda) {
    steps.push({
      id: 'bot_services',
      title: 'Serviços cadastrados',
      description: 'Adicione pelo menos 1 serviço ativo para a agenda do bot funcionar.',
      href: '/dashboard/services',
      cta: 'Gerenciar serviços',
      done: serviceCount > 0,
    });
  }

  // Operational module for scheduling bots
  if (needsAgenda) {
    steps.push({
      id: 'bot_operational',
      title: 'Configuração operacional',
      description: 'Defina os horários e regras para que a IA possa agendar atendimentos.',
      href: '/dashboard/atendimento-ia#atendimento-ia',
      cta: 'Configurações operacionais',
      done: !!(tenant.businessConfig?.openingHours?.trim()),
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

  const [subscription, tenantMeta] = await Promise.all([
    prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true, status: true, trialEnd: true },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { businessType: true },
    }),
  ]);

  const plan = subscription?.plan ?? 'free';
  const businessType = tenantMeta?.businessType ?? null;
  const stepDefs = getContextualStepDefs(plan, businessType);

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
