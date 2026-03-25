import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Lightweight liveness probe — no I/O, no DB.
 * Responds as long as the Next.js process is alive.
 * Use this for load-balancer health checks and uptime monitors.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      service: 'web',
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
