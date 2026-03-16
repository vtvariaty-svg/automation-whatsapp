/**
 * POST /api/sandbox/run
 * Body: { scenario: ScenarioId }  — or omit to run ALL scenarios sequentially.
 * Runs the scenario for the authenticated tenant, persists to SandboxRun, returns result.
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { runScenario, ALL_SCENARIO_IDS, ScenarioId } from '@/lib/sandbox/scenarioRunner';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const scenarios: ScenarioId[] = body.scenario ? [body.scenario] : ALL_SCENARIO_IDS;

  const runs = [];

  for (const scenario of scenarios) {
    // Mark run as running
    const run = await prisma.sandboxRun.create({
      data: { tenantId: auth.tenantId, scenario, status: 'running', steps: [] },
    });

    try {
      const result = await runScenario(auth.tenantId, scenario);
      const updated = await prisma.sandboxRun.update({
        where: { id: run.id },
        data: {
          status: result.status,
          steps: result.steps as any,
          summary: result.summary,
          finishedAt: new Date(),
        },
      });
      runs.push(updated);
    } catch (e: any) {
      await prisma.sandboxRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          steps: [],
          summary: `Runner error: ${e.message}`,
          finishedAt: new Date(),
        },
      });
      runs.push({ id: run.id, scenario, status: 'failed', summary: e.message });
    }
  }

  return NextResponse.json(runs);
}
