import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthTenant } from '@/lib/getAuthTenant';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthTenant(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;

  const execution = await prisma.leadCampaignExecution.findFirst({
    where: { id, tenantId: auth.tenantId },
    include: {
      items: {
        orderBy: { processedAt: 'desc' },
        include: {
          leadCandidate: { select: { id: true, companyName: true, email: true, phone: true, mobilePhone: true } },
          draft: { select: { id: true, channel: true, subject: true } }
        }
      }
    }
  });

  if (!execution) {
    return NextResponse.json({ error: 'Execução não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ execution });
}
