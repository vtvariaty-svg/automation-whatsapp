import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCheckoutSession = async (tenantId: string, contactId: string, productId: string) => {
  // Verify that the product exists and belongs to the tenant
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId }
  });

  if (!product) {
    throw new Error('Produto não encontrado ou não pertence a este tenant.');
  }

  // Generate a mock checkout URL for the product
  // In a real scenario, this would integrate with Stripe, Mercado Pago, Nuvemshop, etc.
  const checkoutUrl = `https://checkout.variaty.com/${tenantId}/p/${productId}?contact=${encodeURIComponent(contactId)}`;

  // Save the sales event in the database
  const salesEvent = await prisma.salesEvent.create({
    data: {
      tenantId,
      contactId,
      productId,
      checkoutUrl,
      status: 'created'
    }
  });

  return {
    checkout_url: salesEvent.checkoutUrl,
    eventId: salesEvent.id
  };
};
