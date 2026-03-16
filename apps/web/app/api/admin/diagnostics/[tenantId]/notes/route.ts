/**
 * POST /api/admin/diagnostics/:tenantId/notes
 * Superadmin only — add a support note to a tenant.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { tenantId } = await params;
  const { body } = await request.json();

  if (!body || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const note = await prisma.supportNote.create({
    data: {
      tenantId,
      authorId: auth.userId,
      body: body.trim(),
    },
  });

  return NextResponse.json(note, { status: 201 });
}
