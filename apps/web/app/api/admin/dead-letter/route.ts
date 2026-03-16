/**
 * GET  /api/admin/dead-letter?status=failed&limit=50  — list events
 * PATCH /api/admin/dead-letter                         — resolve by id
 */
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/authService';
import { isSuperAdmin } from '@/lib/superadmin';
import { prisma } from '@/lib/prisma';
import { resolveDeadLetter } from '@/lib/resilience/deadLetter';
import { getCircuitSnapshot } from '@/lib/resilience/circuitBreaker';

function isSuperOrAdmin(role?: string) {
  return isSuperAdmin(role) || role === 'admin';
}

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || !isSuperOrAdmin(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'failed';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);

    const events = await prisma.deadLetterEvent.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const circuits = getCircuitSnapshot();

    return NextResponse.json({ events, circuits });
  } catch (error: any) {
    console.error('[DeadLetter] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload || !isSuperOrAdmin(payload.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await resolveDeadLetter(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[DeadLetter] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
