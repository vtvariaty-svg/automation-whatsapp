// SERVER-SIDE ONLY — reads NFE_EXTERNAL_API_URL and NFE_INTERNAL_SECRET from env.
// Never import this file in client components or pages.
// All secrets stay on the server boundary.

import type { NfeIssuePayload, NfeIssueResponse, NfeStatusResponse, NfeClientError } from './types';
import { mapNfeError, isRetryable } from './errorHandler';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

function getConfig() {
  return {
    url:    process.env.NFE_EXTERNAL_API_URL,
    secret: process.env.NFE_INTERNAL_SECRET,
  };
}

function internalHeaders(tenantId: string): Record<string, string> {
  const { secret } = getConfig();
  return {
    'Content-Type':      'application/json',
    'X-Internal-Secret': secret ?? '',
    'X-Tenant-Id':       tenantId,
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function makeError(
  statusCode: number,
  code: string | undefined,
  message: string,
  retryable: boolean
): NfeClientError {
  return { statusCode, code, message, retryable };
}

/**
 * Issues an NF-e via NFE_WEB internal API.
 *
 * Retries automatically on transient errors (408 / 429 / 5xx) using the SAME
 * idempotencyKey — this is correct and safe per the NFE_WEB idempotency contract.
 * The caller generates idempotencyKey once per user-initiated attempt.
 */
export async function issueExternalNfe(
  payload: NfeIssuePayload,
  idempotencyKey: string,
  tenantId: string
): Promise<NfeIssueResponse> {
  const { url, secret } = getConfig();

  if (!url || !secret) {
    throw makeError(
      503,
      'NFE_CONFIG_MISSING',
      'Configuração do serviço fiscal ausente. Verifique NFE_EXTERNAL_API_URL e NFE_INTERNAL_SECRET.',
      false
    );
  }

  let lastError: NfeClientError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAY_MS * attempt);
    }

    try {
      const response = await fetch(`${url}/api/v1/external/nfe/issue`, {
        method: 'POST',
        headers: {
          ...internalHeaders(tenantId),
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));

      if (response.ok) {
        return body as NfeIssueResponse;
      }

      const errMsg = mapNfeError(response.status, body);
      const retryable = isRetryable(response.status);
      lastError = makeError(response.status, body?.code, errMsg, retryable);

      if (!retryable) break; // Business/validation errors must not be retried
    } catch {
      lastError = makeError(503, 'NETWORK_ERROR', 'Falha de conexão com o serviço fiscal.', true);
    }
  }

  throw lastError!;
}

/**
 * Queries NF-e status by internal invoice ID from NFE_WEB.
 */
export async function getExternalNfeStatusById(
  invoiceId: string,
  tenantId: string
): Promise<NfeStatusResponse> {
  const { url, secret } = getConfig();

  if (!url || !secret) {
    throw makeError(503, 'NFE_CONFIG_MISSING', 'Configuração do serviço fiscal ausente.', false);
  }

  const response = await fetch(
    `${url}/api/v1/external/nfe/id/${encodeURIComponent(invoiceId)}/status`,
    { headers: internalHeaders(tenantId) }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw makeError(response.status, body?.code, mapNfeError(response.status, body), false);
  }
  return body as NfeStatusResponse;
}

/**
 * Queries NF-e status by external_reference_id from NFE_WEB.
 */
export async function getExternalNfeStatusByReference(
  externalReferenceId: string,
  tenantId: string
): Promise<NfeStatusResponse> {
  const { url, secret } = getConfig();

  if (!url || !secret) {
    throw makeError(503, 'NFE_CONFIG_MISSING', 'Configuração do serviço fiscal ausente.', false);
  }

  const response = await fetch(
    `${url}/api/v1/external/nfe/ref/${encodeURIComponent(externalReferenceId)}/status`,
    { headers: internalHeaders(tenantId) }
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw makeError(response.status, body?.code, mapNfeError(response.status, body), false);
  }
  return body as NfeStatusResponse;
}
