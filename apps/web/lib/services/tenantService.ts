import { prisma } from '../prisma';

export const getTenantConfig = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { businessConfig: true }
  });
  if (!tenant) throw new Error('Tenant not found');
  
  return {
    name: tenant.name,
    businessDescription: tenant.businessDescription,
    businessType: tenant.businessType,
    phone: tenant.phone,
    aiPrompt: tenant.aiPrompt,
    businessHours: tenant.businessHours,
    businessConfig: tenant.businessConfig
  };
};

export const updateTenantConfig = async (
  tenantId: string, 
  data: {
    name?: string;
    businessDescription?: string;
    businessType?: string;
    phone?: string;
    openingHours?: string;
    address?: string;
    faqJson?: string;
    templateBookingConfirmed?: string;
    templateReminder24h?: string;
  }
) => {
  const { name, businessDescription, businessType, phone, openingHours, address, faqJson, templateBookingConfirmed, templateReminder24h } = data;

  const configData = {
    ...(openingHours !== undefined && { openingHours }),
    ...(address !== undefined && { address }),
    ...(faqJson !== undefined && { faqJson }),
    ...(templateBookingConfirmed !== undefined && { templateBookingConfirmed }),
    ...(templateReminder24h !== undefined && { templateReminder24h })
  };

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(name && { name }),
      ...(businessDescription !== undefined && { businessDescription }),
      ...(businessType !== undefined && { businessType }),
      ...(phone !== undefined && { phone }),
      businessConfig: {
        upsert: {
          create: configData,
          update: configData
        }
      }
    },
    include: { businessConfig: true }
  });

  return tenant;
};

export const createProduct = async (tenantId: string, data: { 
  name: string, 
  description?: string, 
  price: number,
  salesMode?: string,
  salesCtaText?: string,
  externalSalesUrl?: string,
  salesShortText?: string,
  aliases?: string[],
  salesPriority?: number,
  requiresHumanApproval?: boolean
}) => {
  return await prisma.product.create({
    data: {
      ...data,
      tenantId
    }
  });
};

export const listProducts = async (tenantId: string) => {
  return await prisma.product.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
};
