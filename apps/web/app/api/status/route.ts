import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/status
 *
 * Readiness probe + operator diagnostic.
 * Includes a lightweight DB connectivity check (SELECT 1).
 *
 * Returns 200 when fully operational, 503 when degraded.
 * Does NOT require authentication — intentional for monitoring tooling.
 */
export const dynamic = 'force-dynamic';

const VERSION = '0.1.0';

async function checkDatabase(): Promise<'ok' | 'error'> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'ok';
  } catch {
    return 'error';
  }
}

export async function GET() {
  const dbStatus = await checkDatabase();
  const allOk = dbStatus === 'ok';

  return NextResponse.json(
    {
      service: 'web',
      status: allOk ? 'ok' : 'degraded',
      version: VERSION,
      environment: process.env.NODE_ENV ?? 'unknown',
      commit: process.env.RENDER_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
      },
    },
    { status: allOk ? 200 : 503 }
  );
}
