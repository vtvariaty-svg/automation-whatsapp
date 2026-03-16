/**
 * G1 – Go-Live helper library.
 * Computes the 5-item readiness checklist and operational status for a tenant.
 */
import { prisma } from '@/lib/prisma';
import { subHours } from 'date-fns';

export interface ChecklistItem {
  key: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface GoLiveStatus {
  tenantId: string;
  tenantName: string;
  operationalStatus: string;
  checklist: ChecklistItem[];
  allPassed: boolean;
  noUsageAlert: boolean; // true if live but 0 conversations in last 48h
}

export async function computeGoLiveStatus(tenantId: string): Promise<GoLiveStatus> {
  // Fetch tenant base data
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      operationalStatus: true,
      whatsappToken: true,
      instagramToken: true,
      facebookToken: true,
      setupCompleted: true,
    },
  });

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  const now = new Date();
  const cutoff48h = subHours(now, 48);

  // Run all 5 checks + conversations count in parallel
  const [
    activeAutomationsCount,
    subscription,
    adminUsersCount,
    conversationsLast48h,
  ] = await Promise.all([
    // Check 2: automacao_ativa
    prisma.automationRule.count({
      where: { tenantId, active: true },
    }),
    // Check 3: billing_valido
    prisma.subscription.findFirst({
      where: { tenantId },
      select: { plan: true, status: true, trialEnd: true },
    }),
    // Check 4: usuario_configurado
    prisma.user.count({
      where: { tenantId, role: 'admin' },
    }),
    // noUsageAlert check
    prisma.conversation.count({
      where: {
        tenantId,
        createdAt: { gte: cutoff48h },
      },
    }),
  ]);

  // ─── Check 1: canal_conectado ────────────────────────────────────────────
  const canalConectado =
    tenant.whatsappToken != null ||
    tenant.instagramToken != null ||
    tenant.facebookToken != null;

  const connectedChannels: string[] = [];
  if (tenant.whatsappToken) connectedChannels.push('WhatsApp');
  if (tenant.instagramToken) connectedChannels.push('Instagram');
  if (tenant.facebookToken) connectedChannels.push('Facebook');

  // ─── Check 2: automacao_ativa ────────────────────────────────────────────
  const automacaoAtiva = activeAutomationsCount >= 1;

  // ─── Check 3: billing_valido ─────────────────────────────────────────────
  let billingValido = false;
  let billingDetail = 'Nenhuma assinatura encontrada';
  if (subscription) {
    if (subscription.status === 'active') {
      billingValido = true;
      billingDetail = `Plano ${subscription.plan} ativo`;
    } else if (
      subscription.status === 'trialing' &&
      subscription.trialEnd != null &&
      subscription.trialEnd > now
    ) {
      billingValido = true;
      const daysLeft = Math.ceil(
        (subscription.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      billingDetail = `Trial ativo — ${daysLeft} dia(s) restante(s)`;
    } else if (subscription.status === 'trialing' && subscription.trialEnd != null && subscription.trialEnd <= now) {
      billingDetail = 'Trial expirado';
    } else {
      billingDetail = `Assinatura com status: ${subscription.status}`;
    }
  }

  // ─── Check 4: usuario_configurado ────────────────────────────────────────
  const usuarioConfigurado = adminUsersCount >= 1;

  // ─── Check 5: setup_completo ─────────────────────────────────────────────
  const setupCompleto = tenant.setupCompleted === true;

  // ─── Build checklist ─────────────────────────────────────────────────────
  const checklist: ChecklistItem[] = [
    {
      key: 'canal_conectado',
      label: 'Canal conectado',
      passed: canalConectado,
      detail: canalConectado
        ? `Canais ativos: ${connectedChannels.join(', ')}`
        : 'Nenhum canal de mensagens configurado',
    },
    {
      key: 'automacao_ativa',
      label: 'Automação ativa',
      passed: automacaoAtiva,
      detail: automacaoAtiva
        ? `${activeAutomationsCount} automação(ões) ativa(s)`
        : 'Nenhuma automação ativa encontrada',
    },
    {
      key: 'billing_valido',
      label: 'Faturamento válido',
      passed: billingValido,
      detail: billingDetail,
    },
    {
      key: 'usuario_configurado',
      label: 'Usuário admin configurado',
      passed: usuarioConfigurado,
      detail: usuarioConfigurado
        ? `${adminUsersCount} usuário(s) admin configurado(s)`
        : 'Nenhum usuário com role admin encontrado',
    },
    {
      key: 'setup_completo',
      label: 'Configuração concluída',
      passed: setupCompleto,
      detail: setupCompleto
        ? 'Assistente de configuração concluído'
        : 'Assistente de configuração não finalizado',
    },
  ];

  const allPassed = checklist.every((item) => item.passed);
  const noUsageAlert =
    tenant.operationalStatus === 'live' && conversationsLast48h === 0;

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    operationalStatus: tenant.operationalStatus,
    checklist,
    allPassed,
    noUsageAlert,
  };
}
