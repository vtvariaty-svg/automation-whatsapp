/**
 * G5 – Ops Check definitions.
 * Runs all 6 checks in parallel and returns results.
 * Does NOT persist to DB — caller is responsible for saving.
 */
import { prisma } from '@/lib/prisma';
import { getCircuitSnapshot } from '@/lib/resilience/circuitBreaker';

export interface CheckResult {
  name: string;
  category: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  detail: string;
}

async function checkNeonBackup(): Promise<CheckResult> {
  return {
    name: 'neon_backup',
    category: 'backup',
    status: 'ok',
    detail: 'Neon gerencia backups automáticos diários',
  };
}

async function checkDeadLetterClear(): Promise<CheckResult> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.deadLetterEvent.count({
    where: { status: 'failed', createdAt: { gte: since24h } },
  });

  let status: CheckResult['status'] = 'ok';
  if (count > 5) status = 'critical';
  else if (count > 0) status = 'warning';

  return {
    name: 'dead_letter_clear',
    category: 'recovery',
    status,
    detail: count === 0
      ? 'Nenhum evento com falha nas últimas 24h'
      : `${count} evento(s) com falha nas últimas 24h`,
  };
}

async function checkAuditLogActive(): Promise<CheckResult> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.auditLog.count({
    where: { createdAt: { gte: since24h } },
  });

  const status: CheckResult['status'] = count > 0 ? 'ok' : 'warning';

  return {
    name: 'audit_log_active',
    category: 'audit',
    status,
    detail: count > 0
      ? `${count} registro(s) de auditoria nas últimas 24h`
      : 'Nenhuma atividade registrada nas últimas 24h',
  };
}

async function checkUnresolvedIncidents(): Promise<CheckResult> {
  const count = await prisma.incidentLog.count({
    where: { status: { not: 'resolved' } },
  });

  let status: CheckResult['status'] = 'ok';
  if (count > 2) status = 'critical';
  else if (count > 0) status = 'warning';

  return {
    name: 'unresolved_incidents',
    category: 'incident',
    status,
    detail: count === 0
      ? 'Nenhum incidente aberto'
      : `${count} incidente(s) não resolvido(s)`,
  };
}

async function checkTenantDataExport(): Promise<CheckResult> {
  return {
    name: 'tenant_data_export',
    category: 'compliance',
    status: 'ok',
    detail: 'Exportação disponível via /api/admin/export/:tenantId',
  };
}

async function checkCircuitBreakerHealth(): Promise<CheckResult> {
  const snapshot = getCircuitSnapshot();
  const openCircuits = Object.entries(snapshot).filter(([, v]) => v.open);

  const status: CheckResult['status'] = openCircuits.length > 0 ? 'warning' : 'ok';

  return {
    name: 'circuit_breaker_health',
    category: 'recovery',
    status,
    detail: openCircuits.length === 0
      ? 'Todos os circuit breakers fechados'
      : `${openCircuits.length} circuit(s) aberto(s): ${openCircuits.map(([k]) => k).join(', ')}`,
  };
}

export async function runAllOpsChecks(): Promise<CheckResult[]> {
  const results = await Promise.all([
    checkNeonBackup(),
    checkDeadLetterClear(),
    checkAuditLogActive(),
    checkUnresolvedIncidents(),
    checkTenantDataExport(),
    checkCircuitBreakerHealth(),
  ]);
  return results;
}
