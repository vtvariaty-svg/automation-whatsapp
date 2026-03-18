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
  const tenantId = 'TEST_CONCURRENCY_' + Date.now();
  const waId = '5511999990000';
  const bsuid = 'BSUID_8888_' + Date.now();
  const recipientUserId = bsuid;

  // Garantir tenant mockado (se houver foreign keys no database relacionadas)
  await prisma.tenant.create({
      data: { id: tenantId, name: 'Tenant de Teste', phone: '123' }
  });

  try {
      console.log(`\n[Teste 1] Disparando 20 Webhooks simultâneos para Contato Virgem (Inbound Híbrido)...`);
      
      const payloadVirgem = {
          channel: 'whatsapp' as any,
          accountId: '1234',
          from: waId,
          messageId: 'msg_' + Date.now(),
          text: 'Hello!',
          timestamp: Date.now(),
          raw: {},
          waId: waId,
          userId: bsuid,
          username: 'JohnHibrido',
          profileName: 'John H',
      };

      const promises = Array(20).fill(0).map(() => resolveWhatsAppIdentity(tenantId, payloadVirgem));
      
      const start = Date.now();
      const results = await Promise.all(promises);
      const end = Date.now();
      
      console.log(`[Latência] 20 requisições simultâneas completadas em ${end - start}ms.`);
      
      const successful = results.filter(r => r !== null);
      console.log(`-> ${successful.length} promessas processaram com sucesso.`);

      await verifyDbState(tenantId, bsuid, waId);


      console.log(`\n[Teste 2] Disparando Webhook de Statuscego pós-criação (Apenas recipientUserId)...`);
      const payloadStatus = {
          channel: 'whatsapp' as any,
          accountId: '1234',
          from: '',
          messageId: 'msg_status_' + Date.now(),
          text: null,
          timestamp: Date.now(),
          raw: {},
          isStatus: true,
          statusType: 'delivered',
          recipientId: bsuid,
      };

      await resolveWhatsAppIdentity(tenantId, payloadStatus);
      await verifyDbState(tenantId, bsuid, waId);

  } finally {
      // Limpeza
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(()=>null);
  }
}

runTests().catch(e => {
    console.error("Critical Test Failure: ", e);
    process.exit(1);
});
