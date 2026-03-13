import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/services/authService';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { status } = body;

    const oppId = params.id;

    // Verify ownership
    const existing = await prisma.salesOpportunity.findUnique({
      where: { id: oppId }
    });

    if (!existing || existing.tenantId !== decoded.tenantId) {
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
