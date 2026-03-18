
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function benchmark() {
  console.log('--- Shadow Read Latency Benchmark ---');
  const startTotal = Date.now();
  
  // Prime query
  await prisma.conversation.findFirst({ take: 1 });
  
  const samples = 20;
  const latencies: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    // Simulate typical shadow read query
    await prisma.conversation.findFirst({
      where: { tenantId: 'any', channel: 'whatsapp' }, // Simulating generic fetch
      select: { id: true }
    });
    const end = performance.now();
    latencies.push(end - start);
  }
  
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(samples * 0.5)];
  const p95 = latencies[Math.floor(samples * 0.95)];
  const p99 = latencies[Math.floor(samples * 0.99)];
  
  console.log(`p50: ${p50.toFixed(2)}ms`);
  console.log(`p95: ${p95.toFixed(2)}ms`);
  console.log(`p99: ${p99.toFixed(2)}ms`);
  
  process.exit(0);
}

benchmark().catch(console.error);
