/**
 * POST /api/feedback  — create feedback item (auth required)
 * GET  /api/feedback  — list feedback items (superadmin only)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

// ─── POST /api/feedback ───────────────────────────────────────────────────────

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    category?: string;
    body?: string;
    route?: string;
    channel?: string;
    score?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.category || !body.body) {
    return NextResponse.json({ error: 'category and body are required' }, { status: 400 });
  }

  // Resolve current plan from subscription
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId: auth.tenantId },
    select: { plan: true },
  });

  const item = await prisma.feedbackItem.create({
    data: {
      tenantId: auth.tenantId,
      category: body.category,
      body: body.body,
      route: body.route ?? null,
      channel: body.channel ?? null,
      plan: subscription?.plan ?? null,
      score: body.score ?? null,
      status: 'new',
    },
  });

  return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
}

// ─── GET /api/feedback ────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const category = searchParams.get('category') ?? undefined;

  const items = await prisma.feedbackItem.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(items);
}
