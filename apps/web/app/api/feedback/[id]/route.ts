/**
 * PATCH /api/feedback/:id  — update feedback status (superadmin only)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (auth.role !== 'superadmin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const validStatuses = ['new', 'reviewing', 'planned', 'resolved'];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.feedbackItem.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Feedback item not found' }, { status: 404 });
  }
}
