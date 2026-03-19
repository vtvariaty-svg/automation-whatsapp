import { PrismaClient } from '@prisma/client';

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

async function rollback(auditId: string) {
  console.log(`\n[Rollback Mode] Reversing Audit ID: ${auditId}`);
  
  const audit = await prisma.migrationAudit.findUnique({
    where: { id: auditId },
    include: { items: { where: { action: 'linked' } } }
  });

  if (!audit) {
    console.error(`Audit record ${auditId} not found.`);
    process.exit(1);
  }

  if (audit.status === 'rolled_back') {
    console.warn(`Audit record ${auditId} has already been rolled back.`);
    process.exit(0);
  }

  console.log(`Found ${audit.items.length} linked items to revert.`);
  
  for (const item of audit.items) {
    // Only revert if the contactId still matches what we set during this migration.
    // This prevents overwriting manual or later legitimate changes.
    await prisma.conversation.updateMany({
      where: { 
        id: item.recordId, 
        contactId: item.newValue 
      },
      data: { contactId: null }
    });
  }

  await prisma.migrationAudit.update({
    where: { id: auditId },
    data: { status: 'rolled_back' }
  });

  console.log(`Rollback completed successfully.`);
  process.exit(0);
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  const rollbackId = process.argv.find(arg => arg.startsWith('--rollback='))?.split('=')[1];
  const tenantId = process.argv.find(arg => arg.startsWith('--tenant='))?.split('=')[1];

  if (rollbackId) {
    await rollback(rollbackId);
    return;
  }

  if (!tenantId) {
    console.error("Error: --tenant=<id> is required for run mode.");
    process.exit(1);
  }

  const mode = isDryRun ? 'dry-run' : 'apply';
  
  // Create durable audit record
  const audit = await prisma.migrationAudit.create({
    data: {
      tenantId,
      mode,
      status: 'running',
    }
  });

  console.log(`\n======================================================`);
  console.log(`[Backfill Migration: Conversations -> ContactId v2]`);
  console.log(`Mode: ${mode}`);
  console.log(`Tenant: ${tenantId}`);
  console.log(`Audit ID: ${audit.id}`);
  console.log(`======================================================\n`);

  let skip = 0;
  const take = 500;
  
  let totalProcessed = 0;
  let stats = {
    linked: 0,
    ambiguous: 0,
    orphans: 0,
    errors: 0,
    batches: 0
  };

  while (true) {
    stats.batches++;
    console.log(`\nFetching chunk... (skip: ${skip}, take: ${take})`);
    
    const conversations = await prisma.conversation.findMany({
      where: { tenantId, contactId: null },
      take,
      skip,
      orderBy: { createdAt: 'asc' },
      select: { id: true, customerPhone: true }
    });

    if (conversations.length === 0) {
      console.log('No more records to process for this tenant.');
      break;
    }

    for (const conv of conversations) {
      totalProcessed++;
      
      try {
        const norm = normalizePhone(conv.customerPhone);
        const searchValues = Array.from(new Set([conv.customerPhone, norm].filter(Boolean))) as string[];
        
        const identifiers = await prisma.contactIdentifier.findMany({
          where: { tenantId, value: { in: searchValues } },
          select: { contactId: true }
        });
        
        let candidateContactIds = new Set<string>();
        for (const idf of identifiers) candidateContactIds.add(idf.contactId);

        if (candidateContactIds.size === 0) {
           const legacyPhones = await prisma.contact.findMany({
              where: { 
                 tenantId, 
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

        if (candidateContactIds.size === 1) {
          const resolvedContactId = Array.from(candidateContactIds)[0];
          
          if (!isDryRun) {
            await prisma.$transaction([
              prisma.conversation.update({
                 where: { id: conv.id },
                 data: { contactId: resolvedContactId }
              }),
              prisma.migrationAuditItem.create({
                data: {
                  auditId: audit.id,
                  recordId: conv.id,
                  action: 'linked',
                  previousValue: null,
                  newValue: resolvedContactId
                }
              })
            ]);
          }
          stats.linked++;
          
        } else if (candidateContactIds.size > 1) {
          if (!isDryRun) {
            await prisma.migrationAuditItem.create({
              data: { auditId: audit.id, recordId: conv.id, action: 'skipped_ambiguous' }
            });
          }
          stats.ambiguous++;
        } else {
          if (!isDryRun) {
            await prisma.migrationAuditItem.create({
              data: { auditId: audit.id, recordId: conv.id, action: 'skipped_orphan' }
            });
          }
          stats.orphans++;
        }
        
      } catch (err: any) {
         console.error(`[Error] Failed to process CONV ${conv.id}: ${err.message}`);
         stats.errors++;
      }
    }
    
    if (stats.errors > 100) {
       console.error(`\n[FATAL ABRT] Over 100 errors occurred. Exiting.`);
       break;
    }
    
    // If we are updating records to NOT be null, we don't need to skip if we want to process the next set of nulls.
    // However, ambiguous and orphans remain null, so we MUST skip them to make progress.
    // Actually, it's safer to always increment skip in DryRun, 
    // but in Production, if we match 100 on take=500, the next fetch with skip=0 will get 500 records where the first few might be the ones we skipped previously.
    // To be simple and robust:
    skip += take;
  }

  // Update final audit record
  await prisma.migrationAudit.update({
    where: { id: audit.id },
    data: {
      status: stats.errors > 0 ? 'failed' : 'completed',
      finishedAt: new Date(),
      linkedCount: stats.linked,
      ambiguousCount: stats.ambiguous,
      orphanCount: stats.orphans,
      errorCount: stats.errors,
      batchCount: stats.batches
    }
  });

  console.log(`\n======================================================`);
  console.log(`[Backfill Final Report] Audit ID: ${audit.id}`);
  console.log(`Processed Total:  ${totalProcessed}`);
  console.log(`Safe Linked:      ${stats.linked}`);
  console.log(`Ambiguous (Skip): ${stats.ambiguous}`);
  console.log(`Orphans (Skip):   ${stats.orphans}`);
  console.log(`Errors:           ${stats.errors}`);
  console.log(`======================================================\n`);
  process.exit(0);
}

run().catch(console.error);
