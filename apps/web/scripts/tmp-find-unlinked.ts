import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.conversation.groupBy({
    by: ['tenantId'],
    where: { contactId: null },
    _count: { id: true },
    orderBy: {
      _count: { id: 'desc' }
    },
    take: 5
  });
  console.log(JSON.stringify(result, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
