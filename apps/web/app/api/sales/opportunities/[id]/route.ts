import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: oppId } = await params;

    const session = await requireAuth(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status } = body;

    // Verify ownership
    const existing = await prisma.salesOpportunity.findUnique({
      where: { id: oppId }
    });

    if (!existing || existing.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const updated = await prisma.salesOpportunity.update({
      where: { id: oppId },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
