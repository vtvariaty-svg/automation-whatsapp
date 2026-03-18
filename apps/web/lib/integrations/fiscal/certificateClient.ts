// SERVER-SIDE ONLY — never import this in client components or pages.
// Calls NFE_WEB external certificate endpoints with internal shared secret.

import { mapNfeError } from './errorHandler';

function getConfig() {
  return {
    url:       process.env.NFE_EXTERNAL_API_URL,
    secret:    process.env.NFE_INTERNAL_SECRET,
    companyId: process.env.NFE_EXTERNAL_COMPANY_ID_DEFAULT,
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

export interface CertUploadResult {
  id: string;
  thumbprint: string;
  validFrom: string | null;
  validTo: string | null;
  label: string | null;
}

export interface CertStatusResult {
  hasCertificate: boolean;
  id?: string;
  thumbprint?: string;
  label?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  isExpired?: boolean;
  daysToExpiry?: number | null;
  expiryWarning?: string | null;
  createdAt?: string;
}

function makeError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

/**
 * Uploads (or renews) a PFX certificate for the given company in NFE_WEB.
 * The PFX is passed as base64 string — never persisted in Automation-WhatsApp.
 */
export async function uploadCertificate(
  pfxBase64: string,
  password: string,
  tenantId: string,
  companyId?: string,
  label?: string
): Promise<CertUploadResult> {
  const cfg = getConfig();
  if (!cfg.url || !cfg.secret) {
    throw makeError(503, 'Configuração do serviço fiscal ausente (NFE_EXTERNAL_API_URL / NFE_INTERNAL_SECRET).');
  }

  const targetCompanyId = companyId ?? cfg.companyId;
  if (!targetCompanyId) {
    throw makeError(422, 'company_id não configurado. Defina NFE_EXTERNAL_COMPANY_ID_DEFAULT.');
  }

  const response = await fetch(
    `${cfg.url}/v1/external/certificates/${encodeURIComponent(targetCompanyId)}/upload`,
    {
      method: 'POST',
      headers: internalHeaders(tenantId),
      body: JSON.stringify({ pfxBase64, password, label }),
    }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg = body?.error ?? mapNfeError(response.status, body);
    throw makeError(response.status, msg);
  }

  return body as CertUploadResult;
}

/**
 * Returns the active certificate status for the configured company in NFE_WEB.
 */
export async function getCertificateStatus(
  tenantId: string,
  companyId?: string
): Promise<CertStatusResult> {
  const cfg = getConfig();
  if (!cfg.url || !cfg.secret) {
    throw makeError(503, 'Configuração do serviço fiscal ausente.');
  }

  const targetCompanyId = companyId ?? cfg.companyId;
  if (!targetCompanyId) {
    throw makeError(422, 'company_id não configurado. Defina NFE_EXTERNAL_COMPANY_ID_DEFAULT.');
  }

  const response = await fetch(
    `${cfg.url}/v1/external/certificates/${encodeURIComponent(targetCompanyId)}/status`,
    { headers: internalHeaders(tenantId) }
  );

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeError(response.status, body?.error ?? 'Erro ao consultar status do certificado.');
  }

  return body as CertStatusResult;
}
