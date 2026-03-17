-- CreateTable: AutomationLog
CREATE TABLE IF NOT EXISTS "AutomationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "orderId" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomationLog_tenantId_sentAt_idx" ON "AutomationLog"("tenantId", "sentAt");
CREATE INDEX IF NOT EXISTS "AutomationLog_orderId_triggerValue_idx" ON "AutomationLog"("orderId", "triggerValue");

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
