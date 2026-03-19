import { saveUserMessage } from '../src/services/conversationService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const tenantId = '3c1c0768-6e01-4c47-b568-d1d7445bfbee';
const phone = '5511999999999';

async function benchmark(iterations = 50) {
  const timings: number[] = [];
  console.log(`Starting baseline benchmark for tenant ${tenantId} (${iterations} iterations)...`);
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await saveUserMessage(phone, `Test message ${i}`, tenantId, 'ai', 'whatsapp');
    const end = performance.now();
    timings.push(end - start);
  }

  timings.sort((a, b) => a - b);
  const p50 = timings[Math.floor(timings.length * 0.5)];
  const p95 = timings[Math.floor(timings.length * 0.95)];
  const p99 = timings[Math.floor(timings.length * 0.99)];
  const avg = timings.reduce((a, b) => a + b, 0) / timings.length;

  console.log(`\n--- Baseline Results ---`);
  console.log(`P50: ${p50.toFixed(2)}ms`);
  console.log(`P95: ${p95.toFixed(2)}ms`);
  console.log(`P99: ${p99.toFixed(2)}ms`);
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`Errors: 0 (Manual Check)`);
}

benchmark().catch(console.error).finally(() => prisma.$disconnect());
