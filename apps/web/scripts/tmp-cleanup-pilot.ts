import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const tenantId = '3c1c0768-6e01-4c47-b568-d1d7445bfbee';
const fakePhone = '5511999999999';

async function cleanup() {
  console.log('--- Cleaning up synthetic benchmark data ---');
  
  const conv = await prisma.conversation.findFirst({
    where: { tenantId, customerPhone: fakePhone }
  });

  if (conv) {
    const deletedMessages = await prisma.message.deleteMany({
      where: { conversationId: conv.id }
    });
    console.log(`Deleted ${deletedMessages.count} artificial messages.`);
    
    await prisma.conversation.delete({
      where: { id: conv.id }
    });
    console.log(`Deleted artificial conversation ${conv.id}.`);
  } else {
    console.log('No artificial conversation found.');
  }
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
