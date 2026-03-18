// SERVER-SIDE ONLY
// Helper to read/write the per-tenant NFE company preference from BusinessConfig.

import { prisma } from '@/lib/prisma';

/**
 * Returns the nfeCompanyId stored in BusinessConfig for the given tenant.
 * Throws a descriptive error if not configured — callers should surface this to the user.
 */
export async function getNfeCompanyId(tenantId: string): Promise<string> {
  const config = await prisma.businessConfig.findUnique({
    where: { tenantId },
    select: { nfeCompanyId: true },
  });

  if (!config?.nfeCompanyId) {
    throw Object.assign(
      new Error('Empresa emissora não configurada. Acesse Configurações Fiscais e selecione a empresa padrão.'),
      { statusCode: 422, code: 'NFE_COMPANY_NOT_CONFIGURED' }
    );
  }

  return config.nfeCompanyId;
}

/**
 * Persists the nfeCompanyId for the given tenant.
 */
export async function setNfeCompanyId(tenantId: string, companyId: string): Promise<void> {
  await prisma.businessConfig.upsert({
    where: { tenantId },
    update: { nfeCompanyId: companyId },
    create: { tenantId, nfeCompanyId: companyId },
  });
}
