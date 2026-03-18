import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****';
  return `***-${phone.slice(-4)}`;
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits.length >= 8 ? digits : null;
  digits = digits.replace(/^0+/, '');
  if (!digits) return null;
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return null;
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  const batchId = isDryRun ? 'dry_run' : `MIG_${Date.now()}`;
  
  console.log(`\n======================================================`);
  console.log(`[Backfill Migration: Conversations -> ContactId v2]`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (No writes)' : 'PRODUCTION'}`);
  console.log(`Batch ID: ${batchId}`);
  console.log(`======================================================\n`);

  let skip = 0;
  const take = 500;
  
  let totalProcessed = 0;
  let stats = {
    linked: 0,
    ambiguous: 0,
    orphans: 0,
    errors: 0
  };

  const touchedConversations: string[] = [];

  while (true) {
    console.log(`\nFetching chunk... (skip: ${skip}, take: ${take})`);
    
    const conversations = await prisma.conversation.findMany({
      where: { contactId: null },
      take,
      skip,
      orderBy: { createdAt: 'asc' },
      select: { id: true, tenantId: true, customerPhone: true }
    });

    if (conversations.length === 0) {
      console.log('No more records to process.');
      break;
    }

    for (const conv of conversations) {
      totalProcessed++;
      
      try {
        const norm = normalizePhone(conv.customerPhone);
        const searchValues = Array.from(new Set([conv.customerPhone, norm].filter(Boolean))) as string[];
        
        // 1. Seek ContactIdentifiers first
        const identifiers = await prisma.contactIdentifier.findMany({
          where: { tenantId: conv.tenantId, value: { in: searchValues } },
          select: { contactId: true }
        });
        
        let candidateContactIds = new Set<string>();
        for (const idf of identifiers) candidateContactIds.add(idf.contactId);

        // 2. Fallback to arbitrary Legacy search if completely absent in Identifiers
        if (candidateContactIds.size === 0) {
           const legacyPhones = await prisma.contact.findMany({
              where: { 
                 tenantId: conv.tenantId, 
                 isMerged: false, 
                 OR: [
                    { normalizedPhone: { in: searchValues } },
                    { waId: { in: searchValues } },
                    { phone: { in: searchValues } }
                 ] 
              },
              select: { id: true }
           });
           for (const leg of legacyPhones) candidateContactIds.add(leg.id);
        }

        // Apply Hard Rules
        if (candidateContactIds.size === 1) {
          // Exactly One Strong Entity Match: Safe Link
          const resolvedContactId = Array.from(candidateContactIds)[0];
          
          if (!isDryRun) {
            await prisma.conversation.update({
               where: { id: conv.id },
               data: { contactId: resolvedContactId }
            });
            touchedConversations.push(conv.id);
          }
          stats.linked++;
          
        } else if (candidateContactIds.size > 1) {
          // Rule: Ambiguous Contacts -> Skip without merging
          console.log(`[Ambiguous] CONV ${conv.id} matched ${candidateContactIds.size} contacts. Skipped.`);
          stats.ambiguous++;
        } else {
          // Rule: Orphans -> Skip without enforcing Contact Creation
          stats.orphans++;
        }
        
      } catch (err: any) {
         console.error(`[Error] Failed to process CONV ${conv.id}: ${err.message}`);
         stats.errors++;
      }
    }
    
    // Safety Threshold
    if (stats.errors > 100) {
       console.error(`\n[FATAL ABRT] Over 100 errors occurred. Exiting to prevent corruption.`);
       break;
    }
    
    // In dryRun, we simulate skip incrementing.
    // In production, the "contactId: null" query automatically shifts unmatched rows 
    // down if they persist, or removes matched rows from the offset! Wait, this is crucial.
    // If we're updating rows to have contactId !== null, the subsequent `where: { contactId: null }`
    // will NOT need a skip multiplier if we process everything sequentially that was matched.
    // However, since orphans and ambiguous remain 'contactId: null', they stay in the result set.
    // So 'skip' MUST increment to bypass the items we decided to skip!
    skip += take;
  }

  // Final Output
  console.log(`\n======================================================`);
  console.log(`[Backfill Final Report] Batch: ${batchId}`);
  console.log(`Processed Total:  ${totalProcessed}`);
  console.log(`Safe Linked:      ${stats.linked}`);
  console.log(`Ambiguous (Skip): ${stats.ambiguous}`);
  console.log(`Orphans (Skip):   ${stats.orphans}`);
  console.log(`Errors:           ${stats.errors}`);
  
  if (!isDryRun) {
     console.log(`\n> [ROLLBACK SCRIPT]`);
     console.log(`If an anomaly is detected, revert this batch by zeroing the IDs in Postgres:`);
     
     // Dump touched array (usually saved to a file or robust tracker)
     // Outputting to stdout for the devops engineer to copy/paste log safely
     const touchedExport = JSON.stringify({ batchId, touchedConversations });
     // Safely cut out output if it is too massive, saving to a local artifact
     const fs = require('fs');
     fs.writeFileSync(`./backfill_${batchId}_rollback.json`, touchedExport);
     
     console.log(`> A rollback vector mapping N=${touchedConversations.length} items was written to ./backfill_${batchId}_rollback.json`);
     console.log(`> To Undo, write a script reading this JSON arrays and updating the DB where { id: { in: touchedConversations }, data: { contactId: null } }`);
  }
  
  console.log(`======================================================\n`);
  process.exit(0);
}

run().catch(console.error);
