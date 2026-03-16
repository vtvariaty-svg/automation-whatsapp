/**
 * GET   /api/admin/ops/incidents         — List incidents (optional ?status= filter)
 * POST  /api/admin/ops/incidents         — Create new incident
 * PATCH /api/admin/ops/incidents         — Update incident status
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function GET(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  const incidents = await prisma.incidentLog.findMany({
    where: statusFilter
      ? { status: statusFilter }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(incidents);
}

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { title, severity, description } = body;

  if (!title || !severity || !description) {
    return NextResponse.json({ error: 'title, severity and description are required' }, { status: 400 });
  }

  const incident = await prisma.incidentLog.create({
    data: {
      title,
      severity,
      description,
      createdBy: auth.userId,
    },
  });

  return NextResponse.json(incident, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { id, status, description } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const data: Record<string, unknown> = { status };
  if (description !== undefined) data.description = description;
  if (status === 'resolved') data.resolvedAt = new Date();

  const incident = await prisma.incidentLog.update({
    where: { id },
    data,
  });

  return NextResponse.json(incident);
}
