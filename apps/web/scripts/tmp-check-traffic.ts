import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const tenantId = '3c1c0768-6e01-4c47-b568-d1d7445bfbee';

async function checkRealTraffic() {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { shadowReadEnabled: true, shadowReadSampleRate: true }
  });

  const recentMessagesCount = await prisma.message.count({
    where: {
      conversation: { tenantId },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      // Assumindo que ignoramos os que têm conteúdo "Teste E2E" se houver
      NOT: { content: { contains: 'teste E2E' } }
    }
  });

  console.log(JSON.stringify({ tenant, recentMessagesCount }, null, 2));
}

checkRealTraffic().catch(console.error).finally(() => prisma.$disconnect());
