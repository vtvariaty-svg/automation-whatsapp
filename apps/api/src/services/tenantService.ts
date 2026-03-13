import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  }
) => {
  const { name, businessDescription, businessType, phone, openingHours, address, faqJson } = data;

  const configData = {
    ...(openingHours !== undefined && { openingHours }),
    ...(address !== undefined && { address }),
    ...(faqJson !== undefined && { faqJson })
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

export const createProduct = async (tenantId: string, data: { name: string, description?: string, category?: string, price: number, currency?: string, stock?: number | null }) => {
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

export const getProduct = async (tenantId: string, productId: string) => {
  return await prisma.product.findFirst({
    where: { id: productId, tenantId }
  });
};

export const updateProduct = async (
  tenantId: string, 
  productId: string, 
  data: { 
    name?: string, 
    description?: string, 
    category?: string, 
    price?: number, 
    currency?: string, 
    stock?: number | null 
  }
) => {
  // First verify the product belongs to this tenant
  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, tenantId }
  });
  if (!existingProduct) throw new Error('Product not found');

  return await prisma.product.update({
    where: { id: productId },
    data
  });
};

export const deleteProduct = async (tenantId: string, productId: string) => {
  // First verify the product belongs to this tenant
  const existingProduct = await prisma.product.findFirst({
    where: { id: productId, tenantId }
  });
  if (!existingProduct) throw new Error('Product not found');

  return await prisma.product.delete({
    where: { id: productId }
  });
};

export const searchProducts = async (tenantId: string, query: string) => {
  // Exclui palavras muito curtas para melhorar a precisão da busca
  const keywords = query.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  if (keywords.length === 0) {
    // Fallback: traz os 5 mais recentes se não houver palavras úteis
    return await prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  }

  // Cria condição OR insensível a maiúsculas para cada palavra-chave
  const searchConditions = keywords.flatMap(keyword => [
    { name: { contains: keyword, mode: 'insensitive' as const } },
    { description: { contains: keyword, mode: 'insensitive' as const } },
    { category: { contains: keyword, mode: 'insensitive' as const } }
  ]);

  return await prisma.product.findMany({
    where: { 
      tenantId,
      OR: searchConditions
    },
    take: 5
  });
};
