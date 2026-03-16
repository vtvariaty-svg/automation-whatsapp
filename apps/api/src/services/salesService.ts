import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY environment variable is required');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia' as any,
});

export const createCheckoutSession = async (tenantId: string, contactId: string, productId: string) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId }
  });

  if (!product) {
    throw new Error('Produto não encontrado ou não pertence a este tenant.');
  }

  const baseUrl = process.env.BASE_URL || 'https://automation-whatsapp.onrender.com';

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: (product.currency || 'BRL').toLowerCase(),
          product_data: {
            name: product.name,
            ...(product.description && { description: product.description }),
          },
          unit_amount: Math.round(product.price * 100), // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancel`,
    metadata: {
      tenantId,
      contactId,
      productId,
    },
  });

  const checkoutUrl = session.url!;

  const salesEvent = await prisma.salesEvent.create({
    data: {
      tenantId,
      contactId,
      productId,
      checkoutUrl,
      status: 'created'
    }
  });

  const openOpp = await prisma.salesOpportunity.findFirst({
    where: { tenantId, contactId, status: { in: ['novo_lead', 'interessado'] } },
    orderBy: { createdAt: 'desc' }
  });

  if (openOpp) {
    await prisma.salesOpportunity.update({
      where: { id: openOpp.id },
      data: {
        status: 'checkout_enviado',
        productId: product.id,
        value: product.price
      }
    });
  }

  return {
    checkout_url: salesEvent.checkoutUrl,
    eventId: salesEvent.id
  };
};
