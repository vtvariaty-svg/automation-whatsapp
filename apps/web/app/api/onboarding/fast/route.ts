/**
 * POST /api/onboarding/fast
 * L5 – Fast Onboarding: applies a niche template in a single call.
 *
 * Body:
 *   niche          – template key (estética, clínica, restaurante, serviços locais, infoproduto, salão, ecommerce, outro)
 *   companyName    – used to personalise the AI prompt
 *   businessHours  – e.g. "Seg-Sex 9h–18h"
 *   welcomeMessage – optional override of the template default
 *   aiPromptAppend – optional extra instructions appended to the prompt
 */
import { NextResponse } from 'next/server';
import { getAuthTenant } from '@/lib/getAuthTenant';
import { prisma } from '@/lib/prisma';
import { applyBusinessTemplate } from '@/lib/onboarding/applyTemplate';

export async function POST(request: Request) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { niche, companyName, businessHours, welcomeMessage, aiPromptAppend } =
    await request.json();

  if (!niche || !companyName) {
    return NextResponse.json({ error: 'niche and companyName are required' }, { status: 400 });
  }

  // Apply template (creates services + automations + sets AI prompt)
  const result = await applyBusinessTemplate(
    auth.tenantId,
    niche,
    companyName,
    businessHours || 'horário comercial',
  );

  // Override welcome message if the user customised it
  const updates: Record<string, string> = {
    name: companyName,
    businessHours: businessHours || '',
  };
  if (welcomeMessage?.trim()) {
    updates.welcomeMessage = welcomeMessage.trim();
  }
  if (aiPromptAppend?.trim()) {
    const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId }, select: { aiPrompt: true } });
    updates.aiPrompt = (tenant?.aiPrompt ?? '') + '\n\n' + aiPromptAppend.trim();
  }

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { ...updates, setupCompleted: true, setupStep: 6 },
  });

  // Count what was created so the UI can show "X automações publicadas"
  const [automationCount, serviceCount] = await Promise.all([
    prisma.automationRule.count({ where: { tenantId: auth.tenantId, active: true } }),
    prisma.service.count({ where: { tenantId: auth.tenantId, active: true } }),
  ]);

  return NextResponse.json({
    success: true,
    niche,
    automationCount,
    serviceCount,
    appliedTemplate: result.appliedTemplate,
  });
}
