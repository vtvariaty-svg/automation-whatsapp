import { saveUserMessage, getConversationHistory, saveAIMessage } from '../src/services/conversationService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const tenantId = '3c1c0768-6e01-4c47-b568-d1d7445bfbee';

async function runTest() {
  console.log('--- S2 E2E Direct Validation ---');
  
  // 1. Known Contact (from baseline or existing)
  const knownPhone = '5521990886292';
  console.log(`\nScenario 1: Known Contact (${knownPhone})`);
  const identityKnown: any = { contactId: 'clv_known_mock', confidence: 'high' }; // In real it would come from resolver
  await saveUserMessage(knownPhone, 'Oi, teste E2E contato conhecido', tenantId, 'ai', 'whatsapp', identityKnown);
  await getConversationHistory(knownPhone, tenantId, 'whatsapp', identityKnown);

  // 2. New Contact (random)
  const newPhone = `55119${Math.floor(Math.random() * 90000000 + 10000000)}`;
  console.log(`\nScenario 2: New Contact (${newPhone})`);
  const identityNew: any = { contactId: 'clv_new_mock', confidence: 'high' };
  await saveUserMessage(newPhone, 'Oi, teste E2E contato NOVO', tenantId, 'ai', 'whatsapp', identityNew);
  
  // 3. Follow-up
  console.log(`\nScenario 3: Follow-up (${newPhone})`);
  await saveUserMessage(newPhone, 'Segunda mensagem do contato novo', tenantId, 'ai', 'whatsapp', identityNew);
  
  // 4. AI response
  console.log(`\nScenario 4: AI Response`);
  await saveAIMessage(newPhone, 'Resposta da IA simulação E2E', tenantId, 'ai', true, 'whatsapp', identityNew);

  console.log('\n--- E2E Simulation Completed ---');
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
