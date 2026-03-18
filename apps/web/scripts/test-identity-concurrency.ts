// Script de Teste Objetivo para Anti-Ghosting e Concorrência de Webhooks BSUID
// Para executar via TSX: npx tsx scripts/test-identity-concurrency.ts

import { resolveWhatsAppIdentity } from '../lib/services/identityResolver';
import { prisma } from '../lib/prisma';

async function verifyDbState(tenantId: string, bsuid: string, waId: string) {
    const ids = await prisma.contactIdentifier.findMany({
        where: { tenantId, value: { in: [bsuid, waId] } }
    });
    
    // Agrupar contatos linkados a esses IDs
    const contactIds = new Set(ids.map(i => i.contactId));
    
    // Listar as raízes resultantes e checar quantidade de ghosts
    const contacts = await prisma.contact.findMany({
        where: { id: { in: Array.from(contactIds) } },
        include: { identifiers: true }
    });

    console.log(`\n=== ESTADO FINAL (Tenant: ${tenantId}) ===`);
    console.log(`-> Identificadores encontrados: ${ids.length}`);
    console.log(`-> Contatos únicos atrelados : ${contacts.length}`);
    
    let isGhostingPresent = false;
    contacts.forEach(c => {
        if (c.identifiers.length === 0) {
            console.log(`[ALERTA] -> GHOST CONTACT ENCONTRADO: ID ${c.id}`);
            isGhostingPresent = true;
        }
    });

    if (contacts.length === 1 && !isGhostingPresent) {
        console.log("✅ OK - Sem Ghosting. BSUID Híbrido convergiu perfeitamente.");
    } else {
        console.log("❌ FALHA - Concorrência vazou no banco de dados.");
    }
}

async function runTests() {
  const tenants = {
      t1: 'TEST_T1_' + Date.now(),
      t2: 'TEST_T2_' + Date.now(),
      t3: 'TEST_T3_' + Date.now(),
      t4: 'TEST_T4_' + Date.now(),
  };

  const waId = '5511999990000';
  const bsuid = 'BSUID_8888_' + Date.now();

  try {
      await prisma.tenant.createMany({
          data: Object.values(tenants).map(id => ({ id, name: 'T', phone: '123' }))
      });

      console.log(`\n[Teste 1] waId-only vs waId-only (20 concorrências)...`);
      const t1Promises = Array(20).fill(0).map((_, i) => resolveWhatsAppIdentity(tenants.t1, {
          channel: 'whatsapp' as any, accountId: '12', from: waId, messageId: 'm'+i, text: 't', timestamp: Date.now(), raw: {}, waId
      }));
      await Promise.all(t1Promises);
      await verifyDbState(tenants.t1, bsuid, waId);

      console.log(`\n[Teste 2] Híbrido (bsuid+waId) vs waId-only (20 concorrências)...`);
      const t2Promises = Array(20).fill(0).map((_, i) => resolveWhatsAppIdentity(tenants.t2, {
          channel: 'whatsapp' as any, accountId: '12', from: waId, messageId: 'm'+i, text: 't', timestamp: Date.now(), raw: {},
          waId: waId, // Todos tem waId
          userId: i % 2 === 0 ? bsuid : undefined // Metade Híbrido, Metade waId-only
      }));
      await Promise.all(t2Promises);
      await verifyDbState(tenants.t2, bsuid, waId);

      console.log(`\n[Teste 3] Híbrido (bsuid+waId) vs userId-only (20 concorrências)...`);
      const t3Promises = Array(20).fill(0).map((_, i) => resolveWhatsAppIdentity(tenants.t3, {
          channel: 'whatsapp' as any, accountId: '12', from: waId, messageId: 'm'+i, text: 't', timestamp: Date.now(), raw: {},
          waId: i % 2 === 0 ? waId : undefined, // Metade Híbrido, Metade userId-only
          userId: bsuid // Todos tem bsuid
      }));
      await Promise.all(t3Promises);
      await verifyDbState(tenants.t3, bsuid, waId);

      console.log(`\n[Teste 4] Status-only sem âncora anterior (não deve criar Contato)...`);
      const statusResult = await resolveWhatsAppIdentity(tenants.t4, {
          channel: 'whatsapp' as any, accountId: '12', from: '', messageId: 's1', text: null, timestamp: Date.now(), raw: {},
          isStatus: true, statusType: 'delivered', recipientId: bsuid
      });
      console.log(statusResult === null ? "✅ OK - Ignorado perfeitamente." : "❌ FALHA - Fantasma criado.");

  } finally {
      // Limpeza
      await prisma.tenant.deleteMany({ where: { id: { in: Object.values(tenants) } } }).catch(()=>null);
  }
}

runTests().catch(e => {
    console.error("Critical Test Failure: ", e);
    process.exit(1);
});
