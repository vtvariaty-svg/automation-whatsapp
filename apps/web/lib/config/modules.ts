/**
 * MODULE_CATALOG — fonte única de verdade para:
 *   onboarding blueprint · sidebar principal · página "Todos os aplicativos"
 *   bloqueio por plano · bloqueio global por superadmin · aviso de manutenção
 */
import type { FeatureKey } from './plans';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModuleCategory =
  | 'atendimento'
  | 'canais'
  | 'vendas'
  | 'crescimento'
  | 'fiscal'
  | 'administracao';

export interface OnboardingMeta {
  /** Planos que incluem esta etapa. '*' = todos. */
  plans: string[];
  /** businessTypes que precisam desta etapa. undefined = todos os tipos do plano. */
  businessTypes?: string[];
  required: boolean;
  order: number;
  label: string;
  description: string;
}

export interface AppModule {
  id: string;
  label: string;
  icon: string;
  href: string;
  /** Label da seção da sidebar (apenas no primeiro item do grupo). */
  sidebarSection?: string;
  category: ModuleCategory;
  description: string;
  /** Plano mínimo para ter acesso. */
  minPlan?: string;
  /** Feature flag de plano específica. */
  requiredFeature?: FeatureKey;
  /** Quando true, item é completamente ocultado se locked (não mostra cadeado). */
  hideWhenLocked?: boolean;
  /**
   * Planos que recebem este módulo na sidebar padrão (sem customização).
   * Vazio = opt-in via "Todos os aplicativos".
   */
  pinnedByDefaultFor: string[];
  /**
   * businessTypes para os quais este módulo é especialmente relevante.
   * Usado para badge "Recomendado" e defaults de sidebar por tipo de negócio.
   */
  recommendedFor?: string[];
  /** Ordem de exibição na sidebar. */
  sidebarOrder: number;
  /** Metadados de onboarding. Ausente = não faz parte do checklist. */
  onboarding?: OnboardingMeta;
}

// ─── Seções da sidebar ────────────────────────────────────────────────────────

export interface SidebarSection {
  id: string;
  label: string;
  moduleIds: string[];
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { id: 'principal',      label: 'Principal',     moduleIds: ['dashboard', 'analytics'] },
  { id: 'atendimento',    label: 'Atendimento',   moduleIds: ['conversations', 'contacts', 'sales', 'appointments', 'orders', 'payments', 'catalog', 'services', 'professionals', 'handoff'] },
  { id: 'canais',         label: 'Canais & IA',   moduleIds: ['channels', 'instagram_comments', 'bots', 'templates', 'broadcasts', 'insights'] },
  { id: 'crescimento',    label: 'Crescimento',   moduleIds: ['setup', 'metrics', 'attribution', 'referral', 'go_live'] },
  { id: 'fiscal',         label: 'Fiscal',        moduleIds: ['fiscal', 'fiscal_new', 'fiscal_history', 'fiscal_whatsapp'] },
  { id: 'administracao',  label: 'Administração', moduleIds: ['agency', 'billing', 'settings'] },
];

// ─── Catálogo central ─────────────────────────────────────────────────────────

export const MODULE_CATALOG: AppModule[] = [

  // ── Principal ──────────────────────────────────────────────────────────────
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    href: '/dashboard',
    sidebarSection: 'Principal',
    category: 'atendimento',
    description: 'Visão geral da operação: mensagens, conversas ativas e métricas do dia.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 1,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    href: '/dashboard/analytics',
    category: 'crescimento',
    description: 'Relatórios de performance, conversões e retenção de clientes.',
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 2,
  },

  // ── Atendimento ────────────────────────────────────────────────────────────
  {
    id: 'conversations',
    label: 'Conversas',
    icon: '💬',
    href: '/dashboard/conversations',
    sidebarSection: 'Atendimento',
    category: 'atendimento',
    description: 'Caixa de entrada unificada: WhatsApp, Instagram e Facebook.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 10,
    onboarding: {
      plans: ['*'],
      required: true,
      order: 50,
      label: 'Testar primeira conversa',
      description: 'Envie uma mensagem teste e confirme que a IA responde corretamente.',
    },
  },
  {
    id: 'contacts',
    label: 'Contatos',
    icon: '👥',
    href: '/dashboard/contacts',
    category: 'atendimento',
    description: 'CRM com histórico completo de interações por cliente.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 11,
  },
  {
    id: 'sales',
    label: 'Vendas',
    icon: '💰',
    href: '/dashboard/sales',
    category: 'vendas',
    description: 'Pipeline de oportunidades, CRM avançado e follow-up automático.',
    minPlan: 'pro',
    requiredFeature: 'advancedCRM',
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 12,
  },
  {
    id: 'appointments',
    label: 'Agenda',
    icon: '📅',
    href: '/dashboard/appointments',
    category: 'atendimento',
    description: 'Agendamentos automáticos pelo WhatsApp com lembretes configuráveis.',
    minPlan: 'standard',
    pinnedByDefaultFor: ['standard', 'pro', 'business'],
    recommendedFor: ['clínica', 'salão', 'estética', 'serviços locais'],
    sidebarOrder: 13,
    onboarding: {
      plans: ['standard', 'pro', 'business'],
      businessTypes: ['clínica', 'salão', 'estética', 'serviços locais', 'outro'],
      required: true,
      order: 30,
      label: 'Configurar agenda',
      description: 'Seus clientes poderão agendar diretamente pelo WhatsApp, sem intervenção humana.',
    },
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: '🛍️',
    href: '/dashboard/orders',
    category: 'vendas',
    description: 'Gestão de pedidos recebidos via WhatsApp com rastreamento de status.',
    minPlan: 'standard',
    pinnedByDefaultFor: ['standard', 'pro', 'business'],
    recommendedFor: ['ecommerce', 'restaurante'],
    sidebarOrder: 14,
    onboarding: {
      plans: ['standard', 'pro', 'business'],
      businessTypes: ['ecommerce', 'restaurante', 'infoproduto'],
      required: false,
      order: 35,
      label: 'Configurar pedidos',
      description: 'Receba e gerencie pedidos diretamente pelo WhatsApp.',
    },
  },
  {
    id: 'payments',
    label: 'Cobranças',
    icon: '💸',
    href: '/dashboard/payments',
    category: 'vendas',
    description: 'Links de pagamento, cobranças via Stripe e Asaas.',
    minPlan: 'standard',
    pinnedByDefaultFor: ['standard', 'pro', 'business'],
    recommendedFor: ['ecommerce', 'restaurante', 'infoproduto', 'serviços locais'],
    sidebarOrder: 15,
    onboarding: {
      plans: ['standard', 'pro', 'business'],
      required: false,
      order: 40,
      label: 'Configurar cobranças',
      description: 'Receba pagamentos integrados diretamente via chat.',
    },
  },
  {
    id: 'catalog',
    label: 'Catálogo & Vendas IA',
    icon: '🏪',
    href: '/dashboard/vendas',
    category: 'vendas',
    description: 'Catálogo de produtos com checkout automático pela IA.',
    minPlan: 'standard',
    pinnedByDefaultFor: ['standard', 'pro', 'business'],
    recommendedFor: ['ecommerce', 'restaurante', 'infoproduto'],
    sidebarOrder: 16,
    onboarding: {
      plans: ['standard', 'pro', 'business'],
      businessTypes: ['ecommerce', 'restaurante', 'infoproduto'],
      required: true,
      order: 25,
      label: 'Configurar catálogo',
      description: 'Adicione produtos e a IA enviará links de compra automaticamente.',
    },
  },
  {
    id: 'services',
    label: 'Serviços',
    icon: '✂️',
    href: '/dashboard/services',
    category: 'atendimento',
    description: 'Catálogo de serviços com duração, buffer e disponibilidade.',
    minPlan: 'standard',
    pinnedByDefaultFor: ['standard', 'pro', 'business'],
    recommendedFor: ['clínica', 'salão', 'estética', 'serviços locais'],
    sidebarOrder: 17,
    onboarding: {
      plans: ['standard', 'pro', 'business'],
      businessTypes: ['clínica', 'salão', 'estética', 'serviços locais'],
      required: true,
      order: 20,
      label: 'Cadastrar serviços',
      description: 'Defina os serviços que você oferece para ativar o agendamento automático.',
    },
  },
  {
    id: 'professionals',
    label: 'Profissionais',
    icon: '👤',
    href: '/dashboard/professionals',
    category: 'atendimento',
    description: 'Equipe com agendas individuais e disponibilidade configurável.',
    minPlan: 'standard',
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 18,
  },
  {
    id: 'handoff',
    label: 'Avisos & Escalação',
    icon: '🔔',
    href: '/dashboard/avisos',
    category: 'atendimento',
    description: 'Quando e como a IA deve transferir para atendimento humano.',
    pinnedByDefaultFor: ['standard', 'pro', 'business'],
    sidebarOrder: 19,
  },

  // ── Canais & IA ───────────────────────────────────────────────────────────
  {
    id: 'channels',
    label: 'Canais',
    icon: '📡',
    href: '/dashboard/integrations',
    sidebarSection: 'Canais & IA',
    category: 'canais',
    description: 'Conectar e gerenciar WhatsApp, Instagram e Facebook.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 30,
    onboarding: {
      plans: ['standard', 'pro', 'business'],
      required: true,
      order: 10,
      label: 'Conectar canal',
      description: 'Conecte seu WhatsApp ou Instagram para começar a receber mensagens.',
    },
  },
  {
    id: 'instagram_comments',
    label: 'Comentários Instagram',
    icon: '💬',
    href: '/dashboard/instagram-comments',
    category: 'canais',
    description: 'Respostas automáticas a comentários em posts do Instagram.',
    minPlan: 'standard',
    requiredFeature: 'instagramComments',
    pinnedByDefaultFor: [],
    sidebarOrder: 31,
  },
  {
    id: 'bots',
    label: 'Bots & IA',
    icon: '🤖',
    href: '/dashboard/bots',
    category: 'canais',
    description: 'Personalidade da IA, prompt e fluxos de resposta.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 32,
    onboarding: {
      plans: ['*'],
      required: true,
      order: 15,
      label: 'Configurar IA',
      description: 'Configure a personalidade e o comportamento do seu assistente de IA.',
    },
  },
  {
    id: 'templates',
    label: 'Templates WhatsApp',
    icon: '📋',
    href: '/dashboard/templates',
    category: 'canais',
    description: 'Templates aprovados pela Meta para envios em massa.',
    minPlan: 'standard',
    requiredFeature: 'whatsapp',
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 33,
  },
  {
    id: 'broadcasts',
    label: 'Envios em Lote',
    icon: '📨',
    href: '/dashboard/broadcasts',
    category: 'canais',
    description: 'Campanhas para segmentos de contatos via WhatsApp.',
    minPlan: 'standard',
    requiredFeature: 'whatsapp',
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 34,
  },
  {
    id: 'insights',
    label: 'Insights de IA',
    icon: '🔍',
    href: '/dashboard/insights',
    category: 'crescimento',
    description: 'Análise automatizada de padrões de conversa e oportunidades.',
    minPlan: 'pro',
    requiredFeature: 'aiCopilot',
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 35,
  },

  // ── Crescimento ───────────────────────────────────────────────────────────
  {
    id: 'setup',
    label: 'Setup & Ativação',
    icon: '✅',
    href: '/dashboard/setup',
    sidebarSection: 'Crescimento',
    category: 'crescimento',
    description: 'Checklist de ativação e progresso de configuração inicial.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 40,
  },
  {
    id: 'metrics',
    label: 'Métricas',
    icon: '🚀',
    href: '/dashboard/activation',
    category: 'crescimento',
    description: 'Métricas de ativação, engajamento e uso da plataforma.',
    pinnedByDefaultFor: ['standard', 'pro', 'business'],
    sidebarOrder: 41,
  },
  {
    id: 'attribution',
    label: 'Atribuição',
    icon: '🎯',
    href: '/dashboard/attribution',
    category: 'crescimento',
    description: 'Rastreamento de origem de leads e atribuição de conversões.',
    minPlan: 'pro',
    requiredFeature: 'advancedAnalytics',
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 42,
  },
  {
    id: 'referral',
    label: 'Indicações',
    icon: '🎁',
    href: '/dashboard/referral',
    category: 'crescimento',
    description: 'Programa de indicações para aquisição de novos clientes.',
    pinnedByDefaultFor: [],
    sidebarOrder: 43,
  },
  {
    id: 'go_live',
    label: 'Go-Live',
    icon: '🚦',
    href: '/dashboard/go-live',
    category: 'crescimento',
    description: 'Checklist final para colocar a operação em produção.',
    pinnedByDefaultFor: [],
    sidebarOrder: 44,
  },

  // ── Fiscal ────────────────────────────────────────────────────────────────
  {
    id: 'fiscal',
    label: 'Fiscal',
    icon: '🧾',
    href: '/dashboard/fiscal',
    sidebarSection: 'Fiscal',
    category: 'fiscal',
    description: 'Emissão de NF-e integrada ao WhatsApp.',
    minPlan: 'pro',
    hideWhenLocked: true,
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 50,
  },
  {
    id: 'fiscal_new',
    label: 'Nova emissão',
    icon: '📝',
    href: '/dashboard/fiscal/nova',
    category: 'fiscal',
    description: 'Emitir nova nota fiscal eletrônica.',
    minPlan: 'pro',
    hideWhenLocked: true,
    pinnedByDefaultFor: ['pro', 'business'],
    sidebarOrder: 51,
  },
  {
    id: 'fiscal_history',
    label: 'Histórico NF-e',
    icon: '📋',
    href: '/dashboard/fiscal/historico',
    category: 'fiscal',
    description: 'Histórico de notas fiscais emitidas.',
    minPlan: 'pro',
    hideWhenLocked: true,
    pinnedByDefaultFor: [],
    sidebarOrder: 52,
  },
  {
    id: 'fiscal_whatsapp',
    label: 'NF por WhatsApp',
    icon: '📱',
    href: '/dashboard/fiscal/whatsapp',
    category: 'fiscal',
    description: 'Emissão de NF-e acionada por conversa no WhatsApp.',
    minPlan: 'pro',
    hideWhenLocked: true,
    pinnedByDefaultFor: [],
    sidebarOrder: 53,
  },

  // ── Administração ─────────────────────────────────────────────────────────
  {
    id: 'agency',
    label: 'Agência',
    icon: '🏢',
    href: '/dashboard/agency',
    sidebarSection: 'Administração',
    category: 'administracao',
    description: 'Painel de gestão multi-conta para agências e revendedores.',
    minPlan: 'business',
    requiredFeature: 'agencyReseller',
    pinnedByDefaultFor: ['business'],
    sidebarOrder: 60,
  },
  {
    id: 'billing',
    label: 'Assinatura',
    icon: '💳',
    href: '/dashboard/billing',
    category: 'administracao',
    description: 'Gerenciar plano, fatura e método de pagamento.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 61,
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: '⚙️',
    href: '/dashboard/settings',
    category: 'administracao',
    description: 'Configurações gerais da conta, IA e workspace.',
    pinnedByDefaultFor: ['free', 'standard', 'pro', 'business'],
    sidebarOrder: 62,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getModuleById(id: string): AppModule | undefined {
  return MODULE_CATALOG.find(m => m.id === id);
}

export function getModuleByHref(href: string): AppModule | undefined {
  // Exact match first, then prefix match for sub-pages
  return (
    MODULE_CATALOG.find(m => m.href === href) ??
    MODULE_CATALOG.find(m => href.startsWith(m.href + '/'))
  );
}

/** IDs pinned por padrão para um plano, sem customização do tenant. */
export function getDefaultPinnedIds(plan: string): string[] {
  const slug = plan ?? 'free';
  return MODULE_CATALOG
    .filter(m => m.pinnedByDefaultFor.includes(slug))
    .sort((a, b) => a.sidebarOrder - b.sidebarOrder)
    .map(m => m.id);
}

/**
 * IDs pinned por padrão, ajustados pelo businessType do tenant.
 * Para free ou sem businessType, retorna o conjunto padrão por plano.
 * Para planos pagos com businessType reconhecido, prioriza módulos relevantes.
 */
export function getDefaultPinnedIdsForBusinessType(
  plan: string,
  businessType: string | null | undefined,
): string[] {
  const base = getDefaultPinnedIds(plan);
  if (!businessType || plan === 'free') return base;

  const bType = businessType.toLowerCase();
  const AGENDA_TYPES = new Set(['clínica', 'salão', 'estética', 'serviços locais']);
  const SALES_TYPES  = new Set(['ecommerce', 'restaurante', 'infoproduto']);

  // Módulos irrelevantes por businessType: remover do padrão
  const toRemove = new Set<string>();
  if (AGENDA_TYPES.has(bType)) {
    toRemove.add('catalog');
    toRemove.add('orders');
  }
  if (SALES_TYPES.has(bType)) {
    toRemove.add('services');
    toRemove.add('appointments');
    toRemove.add('professionals');
  }

  return base.filter(id => !toRemove.has(id));
}

/** Nomes de todas as categorias com label legível. */
export const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  atendimento:   'Atendimento',
  canais:        'Canais & IA',
  vendas:        'Vendas',
  crescimento:   'Crescimento',
  fiscal:        'Fiscal',
  administracao: 'Administração',
};
