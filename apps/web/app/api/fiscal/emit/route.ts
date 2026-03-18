import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { getSubscription } from '@/lib/services/subscriptionService';
import { planAtLeast } from '@/lib/config/plans';
import { issueExternalNfe } from '@/lib/integrations/fiscal/nfeClient';
import { prisma } from '@/lib/prisma';
import { getNfeCompanyId } from '@/lib/fiscal/nfeSettings';
import type { NfeIssuePayload } from '@/lib/integrations/fiscal/types';

const NFE_STATUS_MAP: Record<string, string> = {
  AUTHORIZED: 'autorizado',
  PROCESSING: 'processando',
  PENDING: 'processando',
  ERROR: 'erro_sefaz',
  REJECTED: 'erro_sefaz',
  CANCELLED: 'cancelado_sefaz',
  CANCELED: 'cancelado_sefaz',
};

/**
 * Maps NFE_WEB status string to local FiscalDocumentStatus.
 * Returns the mapped value, or 'processando' as fallback.
 * Logs a warning when the status is unknown — never fails silently.
 */
function mapNfeStatusToLocal(
  nfeStatus: string,
  ctx: { tenantId: string; externalReferenceId: string }
): string {
  const key = nfeStatus?.toUpperCase();
  const local = NFE_STATUS_MAP[key];
  if (!local) {
    console.warn(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'warn',
        module: 'fiscal',
        tenantId: ctx.tenantId,
        external_reference_id: ctx.externalReferenceId,
        raw_status: nfeStatus,
        mapped_to: 'processando',
        msg: 'Status NFE_WEB desconhecido — fallback para processando. Adicione ao NFE_STATUS_MAP se necessário.',
      })
    );
    return 'processando';
  }
  return local;
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Server-side plan gate — PRO+ required for fiscal module
  const sub = await getSubscription(auth.tenantId);
  const tenantPlan = sub?.plan ?? 'free';
  if (!planAtLeast(tenantPlan, 'pro')) {
    return NextResponse.json(
      { error: 'Módulo Fiscal disponível a partir do plano Pro. Faça upgrade para continuar.' },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  if (!body.customer) {
    return NextResponse.json({ error: 'Dados do cliente são obrigatórios.' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Ao menos um item é obrigatório.' }, { status: 400 });
  }

  const enabled = process.env.NFE_EXTERNAL_ENABLED === 'true';

  // ── Mock mode ──────────────────────────────────────────────────────────────
  if (!enabled) {
    const mockId = `mock-${Date.now()}`;
    const extRef = `${auth.tenantId.slice(0, 8)}-nfe-mock-${Date.now()}`;

    await prisma.fiscalEmissionRecord.create({
      data: {
        tenantId: auth.tenantId,
        externalReferenceId: extRef,
        invoiceId: null,
        requestId: `req-mock-${mockId}`,
        protocol: null,
        status: 'emitido_mock',
        mode: 'mock',
        tipo: body.tipo ?? 'nfe',
        customerNome: body.customer?.name ?? 'Cliente',
        customerDocumento: body.customer?.document ?? '',
        total: body.total ?? 0,
        itensJson: body.items ? JSON.stringify(body.items) : null,
      },
    });

    return NextResponse.json({
      mode: 'mock',
      request_id: `req-mock-${mockId}`,
      idempotency_key: crypto.randomUUID(),
      status: 'emitido_mock',
      invoice_id: mockId,
      external_reference_id: extRef,
      protocol: null,
    });
  }

  // ── Real mode ──────────────────────────────────────────────────────────────

  // Resolve company_id: body > BusinessConfig.nfeCompanyId (per-tenant, from DB)
  let companyId = body.company_id;
  if (!companyId) {
    try {
      companyId = await getNfeCompanyId(auth.tenantId);
    } catch (err: any) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.statusCode ?? 422 });
    }
  }

  // external_reference_id is stable per business transaction.
  // Generated once here if not provided by the client — never changes on retry.
  const externalRefId =
    body.external_reference_id ??
    `${auth.tenantId.slice(0, 8)}-nfe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Idempotency-Key: one per user-initiated attempt group.
  // nfeClient will reuse this same key across its internal retries (correct by contract).
  const idempotencyKey = crypto.randomUUID();

  const payload: NfeIssuePayload = {
    external_reference_id: externalRefId,
    company_id: companyId,
    natureza_operacao: body.natureza_operacao ?? 'Venda de Mercadoria',
    customer: body.customer,
    items: body.items,
  };

  try {
    const result = await issueExternalNfe(payload, idempotencyKey, auth.tenantId);

    const localStatus = mapNfeStatusToLocal(result.status, {
      tenantId: auth.tenantId,
      externalReferenceId: externalRefId,
    });

    await prisma.fiscalEmissionRecord.create({
      data: {
        tenantId: auth.tenantId,
        externalReferenceId: externalRefId,
        invoiceId: result.invoice_id ?? null,
        requestId: result.request_id ?? null,
        protocol: result.protocol ?? null,
        status: localStatus,
        rawStatus: result.status, // preserve original NFE_WEB value for traceability
        mode: 'real',
        tipo: body.tipo ?? 'nfe',
        customerNome: body.customer.name,
        customerDocumento: body.customer.document,
        total: body.total ?? 0,
        itensJson: body.items ? JSON.stringify(body.items) : null,
      },
    });

    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'info',
        module: 'fiscal',
        tenantId: auth.tenantId,
        request_id: result.request_id,
        external_reference_id: externalRefId,
        invoice_id: result.invoice_id,
        raw_status: result.status,
        local_status: localStatus,
        msg: 'NF-e emitida com sucesso',
      })
    );

    return NextResponse.json({
      mode: 'real',
      ...result,
      external_reference_id: externalRefId,
      local_status: localStatus,
    });
  } catch (err: any) {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: 'error',
        module: 'fiscal',
        tenantId: auth.tenantId,
        external_reference_id: externalRefId,
        msg: 'Erro na emissão NF-e',
        statusCode: err.statusCode,
        code: err.code,
        error: err.message,
      })
    );

    return NextResponse.json(
      {
        error: err.message ?? 'Erro na emissão fiscal',
        code: err.code,
        retryable: err.retryable ?? false,
      },
      { status: err.statusCode ?? 500 }
    );
  }
}
