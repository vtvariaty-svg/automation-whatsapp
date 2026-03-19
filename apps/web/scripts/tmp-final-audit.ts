import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const tenantId = '3c1c0768-6e01-4c47-b568-d1d7445bfbee';

async function main() {
  // Bloco 1: Backfill
  const latestAudit = await prisma.migrationAudit.findFirst({
    where: { tenantId, mode: 'dry-run' }, // I only ran dry-run in my previous turns!
    orderBy: { startedAt: 'desc' }
  });

  // Bloco 2 & 3: Shadow & Latency
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { shadowReadEnabled: true, shadowReadSampleRate: true }
  });

  const messagesSinceActivation = await prisma.message.count({
    where: { 
      conversation: { tenantId },
      createdAt: { gte: latestAudit?.finishedAt || new Date(0) }
    }
  });

  // Bloco 4: Hygiene
  const benchmarkMessages = await prisma.message.findMany({
    where: { 
      content: { contains: 'Test message' },
      conversation: { customerPhone: '5511999999999' }
    },
    select: { id: true }
  });

  console.log(JSON.stringify({
    latestAudit,
    tenant,
    messagesSinceActivation,
    benchmarkMessagesCount: benchmarkMessages.length
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
