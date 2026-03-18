import { prisma } from '@/lib/prisma';
import { NormalizedInboundEvent } from '@/lib/channels/types';
import { channelLog } from '@/lib/channels/logger';
import { createHash } from 'crypto';

function generateLockIds(tenantId: string, pivot: string): [number, number] {
  const hash = createHash('md5').update(`identity_lock_${tenantId}_${pivot}`).digest('hex');
  const int1 = parseInt(hash.substring(0, 8), 16) | 0;
  const int2 = parseInt(hash.substring(8, 16), 16) | 0;
  return [int1, int2];
}

export async function resolveWhatsAppIdentity(tenantId: string, event: NormalizedInboundEvent) {
  if (event.channel !== 'whatsapp') return null;

  try {
    return await prisma.$transaction(async (tx) => {
      // 0. ADVISORY LOCK (Evita Race Condition no Postgres)
      // Bloqueia paralelismo em nível de banco para o mesmo Tenant + Identificador Primário
      const lockPivot = event.userId || event.waId || event.from?.replace(/\D/g, '') || event.recipientId;
      if (lockPivot) {
         const [lock1, lock2] = generateLockIds(tenantId, lockPivot);
         // Este lock nativo Postgres garante que duas requests idênticas fiquem enfileiradas.
         // Ele durará apenas durante esta `$transaction`.
         await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lock1}::int, ${lock2}::int);`;
      }

      const identifiersToSearch: { kind: string; value: string }[] = [];

      // Extrai possíveis chaves fortes
      if (event.userId) identifiersToSearch.push({ kind: 'BSUID', value: event.userId });
      if (event.waId) {
        identifiersToSearch.push({ kind: 'WA_ID', value: event.waId });
        const phoneNorm = event.waId.replace(/\D/g, '');
        if (phoneNorm) identifiersToSearch.push({ kind: 'PHONE_NORMALIZED', value: phoneNorm });
      }

      // Prevenir falhas se não vier nem userId nem waId na Inbound Message (Raro mas acontece em statuses cegos)
      if (identifiersToSearch.length === 0) {
        if (!event.isStatus && event.from) {
          const phoneNorm = event.from.replace(/\D/g, '');
          if (phoneNorm) identifiersToSearch.push({ kind: 'PHONE_NORMALIZED', value: phoneNorm });
        } else if (event.isStatus && event.recipientId) {
           identifiersToSearch.push({ kind: 'BSUID', value: event.recipientId });
           identifiersToSearch.push({ kind: 'WA_ID', value: event.recipientId });
        } else {
           channelLog.warn({ channel: 'whatsapp', tenantId, event }, '[IdentityResolver] webhook_missing_identifiers - Nenhuma chave mapeável.');
           return null;
        }
      }

      const matchedContacts = new Map<string, any>();

      // 1. Procurar nas identidades V2
      for (const idObj of identifiersToSearch) {
        const found = await tx.contactIdentifier.findUnique({
          where: { tenantId_kind_value: { tenantId, kind: idObj.kind, value: idObj.value } },
          include: { contact: true }
        });
        
        if (found?.contact) {
          let root = found.contact;
          // Subir a arvore se for merged relacionalmente
          while (root.isMerged && root.mergedIntoContactId) {
             const parent = await tx.contact.findUnique({ where: { id: root.mergedIntoContactId } });
             if (!parent) break;
             root = parent;
          }
          matchedContacts.set(root.id, root);
        }
      }

      // 2. Fallback pro Legacy V1 (Contatos que ainda não ganharam ContactIdentifier)
      if (matchedContacts.size === 0) {
         const values = identifiersToSearch.map(i => i.value);
         const legacies = await tx.contact.findMany({
            where: {
               tenantId,
               isMerged: false,
               OR: [
                 { waId: { in: values } },
                 { normalizedPhone: { in: values } }
               ]
            }
         });
         
         for (const leg of legacies) {
            matchedContacts.set(leg.id, leg);
         }
      }

      let survivorContact = null;

      // 3. Resolução Estratégica
      if (matchedContacts.size === 0) {
        // Criar Novo
        survivorContact = await tx.contact.create({
          data: {
             tenantId,
             source: 'whatsapp',
             waId: event.waId ?? undefined,
             username: event.username ?? undefined,
             name: event.profileName ?? undefined,
             parentUserId: event.parentUserId ?? undefined
          }
        });
        channelLog.info({ channel: 'whatsapp', tenantId, contactId: survivorContact.id }, '[IdentityResolver] identity_resolved_new - Novo contato inserido por Inbound');
      } else if (matchedContacts.size === 1) {
        // Encontrou Exato 1
        survivorContact = Array.from(matchedContacts.values())[0];
        
        // Update passive visual strings
        if (event.username || event.profileName || event.parentUserId) {
           await tx.contact.update({
              where: { id: survivorContact.id },
              data: {
                 username: event.username || survivorContact.username,
                 parentUserId: event.parentUserId || survivorContact.parentUserId,
                 name: event.profileName || survivorContact.name
              }
           });
        }
        channelLog.info({ channel: 'whatsapp', tenantId, contactId: survivorContact.id }, '[IdentityResolver] identity_resolved_existing - Mapeamento com sucesso');
      } else {
        // Múltiplos encontrados - Soft Merge Idempotente (Race condition safecast)
        const sortedContacts = Array.from(matchedContacts.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        survivorContact = sortedContacts[0]; // oldest survives !
        
        for (let i = 1; i < sortedContacts.length; i++) {
           const mergedTarget = sortedContacts[i];
           await tx.contact.update({
              where: { id: mergedTarget.id },
              data: {
                 isMerged: true,
                 mergedIntoContactId: survivorContact.id
              }
           });
           channelLog.info({ channel: 'whatsapp', tenantId, survivor: survivorContact.id, merged: mergedTarget.id }, '[IdentityResolver] identity_merged - Contatos fundidos relacionalmente');
        }
      }

      // 4. Upsert dos Identifiers Concretos para o Survivor garantindo BSUID persistente futuro
      for (const idObj of identifiersToSearch) {
         // upsert robusto em SQLite/Postgres usando clausula unique tenantId_kind_value
         await tx.contactIdentifier.upsert({
            where: { tenantId_kind_value: { tenantId, kind: idObj.kind, value: idObj.value } },
            create: {
               tenantId,
               contactId: survivorContact.id,
               kind: idObj.kind,
               value: idObj.value,
               source: 'whatsapp'
            },
            update: {
               lastSeenAt: new Date(),
               // Se no passado isso apontava pra um contato que agora foi mergeado, linkar pro survivor:
               contactId: survivorContact.id
            }
         });
      }

      return survivorContact;
    }, {
       timeout: 10000,
       maxWait: 5000 
    });
  } catch (error) {
     channelLog.error({ channel: 'whatsapp', tenantId, error }, '[IdentityResolver] identity_conflict - Falha Crítica transacional de Merge');
     return null;
  }
}
