import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/services/authService';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const opportunities = await prisma.salesOpportunity.findMany({
      where: { tenantId: decoded.tenantId },
      include: {
        product: { select: { name: true, price: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(opportunities);
  } catch (error: any) {
    console.error('Failure fetching opportunities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
