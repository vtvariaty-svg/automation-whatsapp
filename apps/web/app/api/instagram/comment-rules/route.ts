import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { checkFeature } from '@/lib/services/entitlementsService';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'instagramComments', auth.role);
  if (!check.allowed) return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });

  const rules = await prisma.instagramCommentRule.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const check = await checkFeature(auth.tenantId, 'instagramComments', auth.role);
  if (!check.allowed) return NextResponse.json({ error: check.upgradeMessage }, { status: 403 });

  const body = await request.json();
  const { name, scope = 'global', postId, triggerType, triggerValue, matchType = 'contains', actions, active = true } = body;
  if (!name || !triggerType || !triggerValue || !actions) {
    return NextResponse.json({ error: 'name, triggerType, triggerValue, actions required' }, { status: 400 });
  }

  const rule = await prisma.instagramCommentRule.create({
    data: { tenantId: auth.tenantId, name, scope, postId, triggerType, triggerValue, matchType, actions, active },
  });
  return NextResponse.json(rule, { status: 201 });
}
