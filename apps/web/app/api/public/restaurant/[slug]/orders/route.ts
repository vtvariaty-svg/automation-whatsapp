// Public endpoint — no auth required
// POST /api/public/restaurant/[slug]/orders
// Creates a FoodOrder for a published restaurant.
// Prices are always calculated server-side — never trusted from client.
// Does NOT expose tenantId, internal data, or prior orders.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function waLink(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

function sanitize(s: string, max: number): string {
  return String(s).trim().slice(0, max);
}

type ItemPayload = {
  productId: string;
  quantity: number;
  notes?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Rate limit: 10 orders per IP+slug per 10 minutes
  const ip = getClientIp(request);
  const rl = checkRateLimit(`restaurant-order:${ip}:${slug}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas solicitações. Tente novamente em alguns minutos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      },
    );
  }

  // Find published restaurant by slug — never by tenantId from client
  const profile = await prisma.restaurantProfile.findUnique({
    where: { slug },
    select: {
      id: true,
      tenantId: true,
      displayName: true,
      whatsappPhone: true,
      isPublished: true,
      acceptsDelivery: true,
      acceptsPickup: true,
    },
  });

  if (!profile || !profile.isPublished) {
    return NextResponse.json({ error: 'Restaurante não encontrado.' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  // Honeypot
  if (body.website && String(body.website).trim() !== '') {
    return NextResponse.json({ error: 'Solicitação inválida.' }, { status: 400 });
  }

  // --- Basic field validation ---
  const customerName = typeof body.customerName === 'string' ? sanitize(body.customerName, 120) : '';
  const customerPhone = typeof body.customerPhone === 'string'
    ? body.customerPhone.replace(/\D/g, '').slice(0, 20)
    : '';

  if (customerName.length < 2) {
    return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres.' }, { status: 400 });
  }
  if (customerPhone.length < 8) {
    return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 });
  }

  const fulfillmentType = typeof body.fulfillmentType === 'string' ? body.fulfillmentType.toUpperCase() : '';
  if (!['DELIVERY', 'PICKUP'].includes(fulfillmentType)) {
    return NextResponse.json({ error: 'fulfillmentType deve ser DELIVERY ou PICKUP.' }, { status: 400 });
  }
  if (fulfillmentType === 'DELIVERY' && !profile.acceptsDelivery) {
    return NextResponse.json({ error: 'Este restaurante não aceita delivery.' }, { status: 400 });
  }
  if (fulfillmentType === 'PICKUP' && !profile.acceptsPickup) {
    return NextResponse.json({ error: 'Este restaurante não aceita retirada.' }, { status: 400 });
  }

  const customerAddress = typeof body.customerAddress === 'string' ? sanitize(body.customerAddress, 300) : undefined;
  if (fulfillmentType === 'DELIVERY' && !customerAddress) {
    return NextResponse.json({ error: 'Endereço é obrigatório para delivery.' }, { status: 400 });
  }

  const customerNotes = typeof body.customerNotes === 'string' ? sanitize(body.customerNotes, 500) : undefined;
  const paymentMethodText = typeof body.paymentMethodText === 'string' ? sanitize(body.paymentMethodText, 80) : undefined;

  // --- Items validation ---
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'O pedido deve conter pelo menos 1 item.' }, { status: 400 });
  }
  if (body.items.length > 30) {
    return NextResponse.json({ error: 'Máximo de 30 itens por pedido.' }, { status: 400 });
  }

  const rawItems = body.items as ItemPayload[];
  for (const item of rawItems) {
    if (!item.productId || typeof item.productId !== 'string') {
      return NextResponse.json({ error: 'productId inválido.' }, { status: 400 });
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      return NextResponse.json({ error: 'Quantidade deve ser entre 1 e 50.' }, { status: 400 });
    }
  }

  // --- Fetch and validate products server-side ---
  const productIds = [...new Set(rawItems.map(i => i.productId))];
  const dbProducts = await prisma.foodProduct.findMany({
    where: {
      id: { in: productIds },
      restaurantProfileId: profile.id,
      isActive: true,
      isAvailable: true,
    },
    select: { id: true, name: true, price: true },
  });

  const productMap = new Map(dbProducts.map(p => [p.id, p]));
  for (const item of rawItems) {
    if (!productMap.has(item.productId)) {
      return NextResponse.json(
        { error: `Produto inválido ou indisponível.` },
        { status: 400 }
      );
    }
  }

  // --- Calculate totals server-side ---
  type LineItem = { product: { id: string; name: string; price: number }; quantity: number; notes?: string; lineTotal: number };
  const lineItems: LineItem[] = rawItems.map(item => {
    const product = productMap.get(item.productId)!;
    const qty = Number(item.quantity);
    return {
      product,
      quantity: qty,
      notes: item.notes ? sanitize(String(item.notes), 300) : undefined,
      lineTotal: Math.round(product.price * qty * 100) / 100,
    };
  });

  const subtotal = Math.round(lineItems.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  const deliveryFee = 0; // Numeric delivery fee not stored in profile; restaurant confirms via WhatsApp
  const total = subtotal + deliveryFee;

  // --- Build WhatsApp message ---
  const shortId = crypto.randomUUID().slice(0, 8).toUpperCase();
  const fulfillmentLabel = fulfillmentType === 'DELIVERY' ? 'Entrega' : 'Retirada';

  const itemLines = lineItems.map(l => {
    const line = `- ${l.quantity}x ${l.product.name} — ${fmt(l.lineTotal)}`;
    return l.notes ? `${line}\n  Obs: ${l.notes}` : line;
  });

  const waMessage = [
    `Olá, vim pelo cardápio da ${profile.displayName} e acabei de montar um pedido.`,
    ``,
    `Pedido: #${shortId}`,
    `Cliente: ${customerName}`,
    `Telefone: +${customerPhone}`,
    `Tipo: ${fulfillmentLabel}`,
    customerAddress ? `Endereço: ${customerAddress}` : null,
    ``,
    `Itens:`,
    ...itemLines,
    ``,
    `Subtotal: ${fmt(subtotal)}`,
    `Total estimado: ${fmt(total)}`,
    ``,
    `Forma de pagamento: ${paymentMethodText ?? 'A combinar'}`,
    customerNotes ? `Obs: ${customerNotes}` : null,
    ``,
    `Pode confirmar meu pedido?`,
  ].filter(l => l !== null).join('\n');

  const whatsappUrl = profile.whatsappPhone ? waLink(profile.whatsappPhone, waMessage) : null;

  // --- Create FoodOrder + FoodOrderItems in a transaction ---
  const order = await prisma.foodOrder.create({
    data: {
      tenantId: profile.tenantId,
      restaurantProfileId: profile.id,
      customerName,
      customerPhone,
      customerAddress,
      customerNotes,
      fulfillmentType,
      paymentMethodText,
      subtotal,
      deliveryFee: deliveryFee > 0 ? deliveryFee : null,
      total,
      status: 'NEW',
      source: 'public_page',
      whatsappMessage: waMessage,
      items: {
        create: lineItems.map(l => ({
          tenantId: profile.tenantId,
          productId: l.product.id,
          productNameSnapshot: l.product.name,
          quantity: l.quantity,
          unitPrice: l.product.price,
          notes: l.notes,
          total: l.lineTotal,
        })),
      },
    },
    select: { id: true, status: true, total: true },
  });

  return NextResponse.json({
    id: order.id,
    shortId,
    status: order.status,
    total: order.total,
    whatsappUrl,
    message: 'Pedido registrado como solicitação. Aguarde a confirmação do restaurante pelo WhatsApp.',
  }, { status: 201 });
}
