-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessDescription" TEXT,
    "businessType" TEXT,
    "phone" TEXT,
    "whatsappPhoneNumberId" TEXT,
    "whatsappPhoneId" TEXT,
    "whatsappBusinessAccountId" TEXT,
    "whatsappToken" TEXT,
    "openaiKey" TEXT,
    "aiPrompt" TEXT,
    "aiGuidedSetup" JSONB,
    "welcomeMessage" TEXT,
    "businessHours" TEXT,
    "setupStep" INTEGER NOT NULL DEFAULT 1,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "activeBotKey" TEXT,
    "sessionTimeoutHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enabledChannels" TEXT,
    "channelKillSwitch" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "operationalStatus" TEXT NOT NULL DEFAULT 'setup',
    "agencyId" TEXT,
    "agencyBranding" BOOLEAN NOT NULL DEFAULT false,
    "instagramPageId" TEXT,
    "instagramToken" TEXT,
    "instagramAccountId" TEXT,
    "facebookPageId" TEXT,
    "facebookToken" TEXT,
    "shadowReadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "shadowReadSampleRate" INTEGER NOT NULL DEFAULT 5,
    "pinnedModules" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT,
    "normalizedPhone" TEXT,
    "email" TEXT,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "waId" TEXT,
    "username" TEXT,
    "parentUserId" TEXT,
    "instagramScopedId" TEXT,
    "facebookScopedId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "notes" TEXT,
    "lastInteractionAt" TIMESTAMP(3),
    "lastChannelUsed" TEXT,
    "isMerged" BOOLEAN NOT NULL DEFAULT false,
    "mergedIntoContactId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_identifiers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_merges" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "survivorId" TEXT NOT NULL,
    "mergedId" TEXT NOT NULL,
    "mergedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_merges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "openingHours" TEXT,
    "address" TEXT,
    "faqJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "bufferBetweenMinutes" INTEGER NOT NULL DEFAULT 0,
    "slotStrideMinutes" INTEGER NOT NULL DEFAULT 0,
    "closedWeekdays" TEXT NOT NULL DEFAULT '',
    "templateBookingConfirmed" TEXT,
    "templateReminder24h" TEXT,
    "templateReminder2h" TEXT,
    "nfeCompanyId" TEXT,

    CONSTRAINT "BusinessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handoff_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "alertPhone" TEXT,
    "clientMessage" TEXT,
    "operatorMessage" TEXT,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "maxAlertsPerConversation" INTEGER NOT NULL DEFAULT 3,
    "autoSetHuman" BOOLEAN NOT NULL DEFAULT true,
    "triggerOnLowConfidence" BOOLEAN NOT NULL DEFAULT true,
    "triggerOnExplicitRequest" BOOLEAN NOT NULL DEFAULT true,
    "triggerOnRepetition" BOOLEAN NOT NULL DEFAULT false,
    "triggerOnCheckoutError" BOOLEAN NOT NULL DEFAULT false,
    "triggerOnNoProduct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handoff_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "stock" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'product',
    "durationMinutes" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salesMode" TEXT NOT NULL DEFAULT 'none',
    "salesCtaText" TEXT,
    "salesShortText" TEXT,
    "externalSalesUrl" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salesPriority" INTEGER NOT NULL DEFAULT 0,
    "requiresHumanApproval" BOOLEAN NOT NULL DEFAULT false,
    "serviceId" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "facebookId" TEXT,
    "instagramId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false,
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedUser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "contactId" TEXT,
    "commercialState" JSONB,
    "handoffAlertCount" INTEGER NOT NULL DEFAULT 0,
    "lastHandoffAlertAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'inbound',
    "content" TEXT NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "planId" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "usageMessages" INTEGER NOT NULL DEFAULT 0,
    "trialEnd" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entitlementsOverride" JSONB,
    "churnReason" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyAiLimit" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "product" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contactId" TEXT,
    "conversationId" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'manual',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "externalPaymentRef" TEXT,
    "cancelReason" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "paymentId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "service" TEXT,
    "date" TEXT,
    "time" TEXT,
    "status" TEXT NOT NULL DEFAULT 'agendado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "conversationId" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "confirmationReceivedAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "professionalId" TEXT,
    "professionalName" TEXT,
    "contactId" TEXT,
    "paymentId" TEXT,
    "paymentStatus" TEXT,
    "serviceId" TEXT,
    "checkInAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attendanceStatus" TEXT,
    "originFlow" TEXT,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DOUBLE PRECISION,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_notifications" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionType" TEXT,
    "actionConfig" JSONB,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceBotKey" TEXT,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
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

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceBotKey" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professionals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "openingHours" TEXT,
    "closedWeekdays" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_services" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "professional_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_blocks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "wabaId" TEXT,
    "phoneNumberId" TEXT,
    "displayPhone" TEXT,
    "accessToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_messages" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superadmin_logs" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetTenantId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "superadmin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_insights" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "report" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_memories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "name" TEXT,
    "preferences" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "realContactId" TEXT,

    CONSTRAINT "customer_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "checkoutUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOpportunity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "productId" TEXT,
    "value" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'novo_lead',
    "followUp1Sent" BOOLEAN NOT NULL DEFAULT false,
    "followUp2Sent" BOOLEAN NOT NULL DEFAULT false,
    "followUp3Sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT,
    "accessToken" TEXT,
    "igAccountId" TEXT,
    "username" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_comment_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'global',
    "postId" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "matchType" TEXT NOT NULL DEFAULT 'contains',
    "actions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_comment_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instagram_moderation_queue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "fromUsername" TEXT,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ruleTriggeredId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_sequences" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "triggerValue" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_sequence_steps" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "messageText" TEXT NOT NULL,
    "condition" TEXT,
    "action" TEXT NOT NULL DEFAULT 'send_dm',
    "actionData" JSONB,

    CONSTRAINT "conversion_sequence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextStepAt" TIMESTAMP(3),
    "lastStepAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversion_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_lead_events" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_lead_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facebook_connections" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT,
    "pageName" TEXT,
    "accessToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facebook_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dead_letter_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "channel" TEXT,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'failed',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dead_letter_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops_checks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "detail" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedBy" TEXT,

    CONSTRAINT "ops_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_logs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "description" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'discount',
    "rewardValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_conversions" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "referredTenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "paidAt" TIMESTAMP(3),
    "rewardApplied" BOOLEAN NOT NULL DEFAULT false,
    "rewardAppliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expansion_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "currentPlan" TEXT,
    "suggestedPlan" TEXT,
    "detail" TEXT,
    "shown" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expansion_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_signals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "detail" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "churn_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_playbooks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "churn_playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_attributions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "firstSource" TEXT,
    "firstMedium" TEXT,
    "firstCampaign" TEXT,
    "lastSource" TEXT,
    "lastMedium" TEXT,
    "lastCampaign" TEXT,
    "conversationId" TEXT,
    "opportunityId" TEXT,
    "appointmentId" TEXT,
    "orderId" TEXT,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "revenueAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerTenantId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#4f46e5',
    "billingMode" TEXT NOT NULL DEFAULT 'separate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_members" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_notes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "route" TEXT,
    "channel" TEXT,
    "plan" TEXT,
    "score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_health_scores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'unknown',
    "expansionSignal" BOOLEAN NOT NULL DEFAULT false,
    "breakdown" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_copilot_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "question" VARCHAR(500) NOT NULL,
    "answer" TEXT NOT NULL,
    "route" VARCHAR(100),
    "plan" TEXT,
    "role" TEXT,
    "confidence" TEXT,
    "fallbackNeeded" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "helpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_copilot_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sandbox_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "steps" JSONB NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "sandbox_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_broadcasts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateLang" TEXT NOT NULL DEFAULT 'pt_BR',
    "variables" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "source" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_broadcast_recipients" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerName" TEXT,
    "variables" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metaMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_broadcast_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UTILITY',
    "language" TEXT NOT NULL DEFAULT 'pt_BR',
    "body" TEXT NOT NULL,
    "header" TEXT,
    "footer" TEXT,
    "exampleVars" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metaTemplateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rejectedReason" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_emission_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalReferenceId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "requestId" TEXT,
    "protocol" TEXT,
    "status" TEXT NOT NULL,
    "rawStatus" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'real',
    "tipo" TEXT NOT NULL DEFAULT 'nfe',
    "customerNome" TEXT NOT NULL,
    "customerDocumento" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "itensJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_emission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_audits" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "batchCount" INTEGER NOT NULL DEFAULT 0,
    "linkedCount" INTEGER NOT NULL DEFAULT 0,
    "ambiguousCount" INTEGER NOT NULL DEFAULT 0,
    "orphanCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "migration_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migration_audit_items" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL DEFAULT 'conversation',
    "previousValue" TEXT,
    "newValue" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_payment_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "environment" TEXT NOT NULL DEFAULT 'sandbox',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT NOT NULL,
    "webhookAuthToken" TEXT NOT NULL,
    "webhookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'standalone',
    "orderId" TEXT,
    "appointmentId" TEXT,
    "contactId" TEXT,
    "conversationId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'asaas',
    "providerPaymentId" TEXT,
    "providerCustomerId" TEXT,
    "invoiceUrl" TEXT,
    "pixCopiaECola" TEXT,
    "pixQrCodeBase64" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "description" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerCpfCnpj" TEXT,
    "dueDate" TEXT NOT NULL,
    "billingType" TEXT NOT NULL DEFAULT 'UNDEFINED',
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'processed',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'module',
    "parentModuleId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_search_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "radiusKm" INTEGER,
    "maxResults" INTEGER NOT NULL DEFAULT 50,
    "minTicket" DOUBLE PRECISION,
    "minRating" DOUBLE PRECISION,
    "minReviews" INTEGER,
    "requiresWebsite" BOOLEAN NOT NULL DEFAULT false,
    "requiresCommercialPhone" BOOLEAN NOT NULL DEFAULT false,
    "localB2BOnly" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalCandidates" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_search_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_candidates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "searchRunId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "placeId" TEXT,
    "cnpj" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobilePhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "category" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "emailConsentStatus" TEXT NOT NULL DEFAULT 'unknown',
    "whatsappConsentStatus" TEXT NOT NULL DEFAULT 'unknown',
    "outreachStatus" TEXT NOT NULL DEFAULT 'not_ready',
    "outreachBlockReason" TEXT,
    "lastReadinessCheckedAt" TIMESTAMP(3),
    "pipelineStage" TEXT NOT NULL DEFAULT 'new',
    "ownerUserId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "nextActionAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "legalName" TEXT,
    "cnpjStatus" TEXT,
    "cnpjSource" TEXT,
    "registryConfidence" INTEGER,
    "companyRegistryLastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadCandidateId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "icpFitScore" INTEGER NOT NULL DEFAULT 0,
    "commercialPotentialScore" INTEGER NOT NULL DEFAULT 0,
    "digitalMaturityScore" INTEGER NOT NULL DEFAULT 0,
    "approachabilityScore" INTEGER NOT NULL DEFAULT 0,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "verdict" TEXT NOT NULL,
    "reasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_enrichment_attempts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "searchRunId" TEXT,
    "leadCandidateId" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responseSummary" JSONB,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "lead_enrichment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_campaign_drafts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "searchRunId" TEXT NOT NULL,
    "leadCandidateId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subject" TEXT,
    "messageBody" TEXT NOT NULL,
    "personalization" JSONB,
    "readinessSnapshot" JSONB,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "providerChannel" TEXT,
    "errorMessage" TEXT,
    "deliveryMeta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_campaign_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_campaign_executions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "searchRunId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "requestedCount" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "batchSize" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_campaign_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_campaign_execution_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "leadCandidateId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "providerMessageId" TEXT,
    "deliveredTo" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseStatus" TEXT NOT NULL DEFAULT 'unknown',
    "outcomeNotes" TEXT,
    "conversionValue" DOUBLE PRECISION,
    "respondedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "outcomeUpdatedAt" TIMESTAMP(3),
    "outcomeSource" TEXT NOT NULL DEFAULT 'manual',
    "lastProviderEventType" TEXT,
    "lastProviderEventAt" TIMESTAMP(3),

    CONSTRAINT "lead_campaign_execution_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_suppressions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadCandidateId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_provider_event_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "executionItemId" TEXT,
    "provider" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "eventType" TEXT NOT NULL,
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "lead_provider_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_prospecting_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "radiusKm" INTEGER,
    "maxResults" INTEGER NOT NULL DEFAULT 50,
    "minTicket" DOUBLE PRECISION,
    "minRating" DOUBLE PRECISION,
    "minReviews" INTEGER,
    "requiresWebsite" BOOLEAN NOT NULL DEFAULT false,
    "requiresCommercialPhone" BOOLEAN NOT NULL DEFAULT false,
    "localB2BOnly" BOOLEAN NOT NULL DEFAULT false,
    "preferredChannel" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_prospecting_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_follow_up_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadCandidateId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_follow_up_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_operational_alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadCandidateId" TEXT NOT NULL,
    "searchRunId" TEXT,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "ruleKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "lead_operational_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_company_registry_snapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadCandidateId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "confidence" INTEGER,
    "cnpj" TEXT,
    "legalName" TEXT,
    "tradeName" TEXT,
    "companyType" TEXT,
    "mainActivity" TEXT,
    "city" TEXT,
    "state" TEXT,
    "cnpjStatus" TEXT,
    "rawSummary" TEXT,
    "notes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_company_registry_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_workspace_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'setup',
    "businessSubtype" TEXT,
    "defaultDepositPercent" DOUBLE PRECISION,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "reengagementDays" INTEGER NOT NULL DEFAULT 30,
    "confirmationLeadHours" INTEGER NOT NULL DEFAULT 24,
    "reminderLeadHours" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beauty_workspace_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_service_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "category" TEXT,
    "priceFrom" DOUBLE PRECISION,
    "priceTo" DOUBLE PRECISION,
    "requiresDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DOUBLE PRECISION,
    "popularityScore" INTEGER NOT NULL DEFAULT 0,
    "photoUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beauty_service_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_customer_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "preferredProfessional" TEXT,
    "preferredServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "lastServiceAt" TIMESTAMP(3),
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "birthdayDate" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "vipStatus" BOOLEAN NOT NULL DEFAULT false,
    "reengagementSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beauty_customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_professional_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commissionPct" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "bio" TEXT,
    "instagramHandle" TEXT,
    "rating" DOUBLE PRECISION,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beauty_professional_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_packages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalSessions" INTEGER NOT NULL,
    "priceTotal" DOUBLE PRECISION NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 90,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beauty_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_package_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "beauty_package_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_beauty_packages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "beautyProfileId" TEXT NOT NULL,
    "sessionsTotal" INTEGER NOT NULL,
    "sessionsUsed" INTEGER NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "customer_beauty_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_package_usages" (
    "id" TEXT NOT NULL,
    "customerPkgId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "beauty_package_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_locks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "professionalId" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_waitlist_entries" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "serviceId" TEXT,
    "professionalId" TEXT,
    "preferredDate" TEXT,
    "preferredTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "notifiedAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beauty_waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_campaign_rules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "inactivityDays" INTEGER,
    "messageTemplate" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "cooldownDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beauty_campaign_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_campaign_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "contactId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repliedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "beauty_campaign_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "whatsappPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_services" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER,
    "priceDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_professionals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_availability" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "professionalId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "serviceId" TEXT,
    "professionalId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "preferredDate" TEXT,
    "preferredTime" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'public_page',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_booking_page_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clinicProfileId" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "primaryCtaLabel" TEXT,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "showProfessionals" BOOLEAN NOT NULL DEFAULT true,
    "showAddress" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_booking_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "whatsappPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "acceptsDelivery" BOOLEAN NOT NULL DEFAULT true,
    "acceptsPickup" BOOLEAN NOT NULL DEFAULT true,
    "deliveryFeeDescription" TEXT,
    "minimumOrderValue" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_menu_page_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "primaryCtaLabel" TEXT,
    "showDeliveryInfo" BOOLEAN NOT NULL DEFAULT true,
    "showPickupInfo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_menu_page_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_addon_groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_addon_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_addon_options" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "addonGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_addon_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "restaurantProfileId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerNotes" TEXT,
    "fulfillmentType" TEXT NOT NULL,
    "paymentMethodText" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'public_page',
    "whatsappMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_order_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_order_item_addons" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "addonOptionId" TEXT,
    "addonNameSnapshot" TEXT NOT NULL,
    "priceDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_order_item_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_tenantId_status_idx" ON "contacts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "contacts_tenantId_createdAt_idx" ON "contacts"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "contacts_tenantId_lastInteractionAt_idx" ON "contacts"("tenantId", "lastInteractionAt");

-- CreateIndex
CREATE INDEX "contacts_tenantId_waId_idx" ON "contacts"("tenantId", "waId");

-- CreateIndex
CREATE INDEX "contacts_tenantId_instagramScopedId_idx" ON "contacts"("tenantId", "instagramScopedId");

-- CreateIndex
CREATE INDEX "contacts_tenantId_facebookScopedId_idx" ON "contacts"("tenantId", "facebookScopedId");

-- CreateIndex
CREATE INDEX "contacts_tenantId_source_idx" ON "contacts"("tenantId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_tenantId_normalizedPhone_key" ON "contacts"("tenantId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "contact_identifiers_contactId_idx" ON "contact_identifiers"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_identifiers_tenantId_kind_value_key" ON "contact_identifiers"("tenantId", "kind", "value");

-- CreateIndex
CREATE INDEX "contact_events_contactId_occurredAt_idx" ON "contact_events"("contactId", "occurredAt");

-- CreateIndex
CREATE INDEX "contact_events_tenantId_type_idx" ON "contact_events"("tenantId", "type");

-- CreateIndex
CREATE INDEX "contact_merges_tenantId_survivorId_idx" ON "contact_merges"("tenantId", "survivorId");

-- CreateIndex
CREATE INDEX "contact_merges_tenantId_mergedId_idx" ON "contact_merges"("tenantId", "mergedId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessConfig_tenantId_key" ON "BusinessConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "handoff_configs_tenantId_key" ON "handoff_configs"("tenantId");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- CreateIndex
CREATE INDEX "Product_tenantId_active_idx" ON "Product"("tenantId", "active");

-- CreateIndex
CREATE INDEX "Product_tenantId_serviceId_idx" ON "Product"("tenantId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_facebookId_key" ON "User"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "User_instagramId_key" ON "User"("instagramId");

-- CreateIndex
CREATE INDEX "login_events_userId_createdAt_idx" ON "login_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "login_events_createdAt_idx" ON "login_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_type_idx" ON "verification_tokens"("identifier", "type");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_status_idx" ON "Conversation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_lastMessageAt_idx" ON "Conversation"("tenantId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_customerPhone_channel_idx" ON "Conversation"("tenantId", "customerPhone", "channel");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_contactId_idx" ON "Conversation"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE INDEX "ai_usage_tenantId_createdAt_idx" ON "ai_usage"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalPaymentRef_key" ON "Order"("externalPaymentRef");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentId_key" ON "Order"("paymentId");

-- CreateIndex
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Order_tenantId_createdAt_idx" ON "Order"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_tenantId_contactId_idx" ON "Order"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "Order_externalPaymentRef_idx" ON "Order"("externalPaymentRef");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_status_history_orderId_createdAt_idx" ON "order_status_history"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_paymentId_key" ON "Appointment"("paymentId");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_status_idx" ON "Appointment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_date_idx" ON "Appointment"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_contactId_idx" ON "Appointment"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "appointment_notifications_appointmentId_type_idx" ON "appointment_notifications"("appointmentId", "type");

-- CreateIndex
CREATE INDEX "appointment_notifications_tenantId_type_sentAt_idx" ON "appointment_notifications"("tenantId", "type", "sentAt");

-- CreateIndex
CREATE INDEX "AutomationRule_tenantId_active_idx" ON "AutomationRule"("tenantId", "active");

-- CreateIndex
CREATE INDEX "AutomationRule_tenantId_sourceType_idx" ON "AutomationRule"("tenantId", "sourceType");

-- CreateIndex
CREATE INDEX "AutomationLog_tenantId_sentAt_idx" ON "AutomationLog"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "AutomationLog_orderId_triggerValue_idx" ON "AutomationLog"("orderId", "triggerValue");

-- CreateIndex
CREATE INDEX "Service_tenantId_idx" ON "Service"("tenantId");

-- CreateIndex
CREATE INDEX "professionals_tenantId_idx" ON "professionals"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "professional_services_professionalId_serviceId_key" ON "professional_services"("professionalId", "serviceId");

-- CreateIndex
CREATE INDEX "availability_blocks_tenantId_date_idx" ON "availability_blocks"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_tenantId_key" ON "whatsapp_connections"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "processed_messages_messageId_key" ON "processed_messages"("messageId");

-- CreateIndex
CREATE INDEX "processed_messages_createdAt_idx" ON "processed_messages"("createdAt");

-- CreateIndex
CREATE INDEX "superadmin_logs_adminUserId_idx" ON "superadmin_logs"("adminUserId");

-- CreateIndex
CREATE INDEX "superadmin_logs_targetUserId_idx" ON "superadmin_logs"("targetUserId");

-- CreateIndex
CREATE INDEX "superadmin_logs_targetTenantId_idx" ON "superadmin_logs"("targetTenantId");

-- CreateIndex
CREATE INDEX "superadmin_logs_createdAt_idx" ON "superadmin_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "revoked_tokens_tokenHash_key" ON "revoked_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "revoked_tokens_expiresAt_idx" ON "revoked_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_insights_tenantId_period_key" ON "conversation_insights"("tenantId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "customer_memories_realContactId_key" ON "customer_memories"("realContactId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_memories_tenantId_contactId_key" ON "customer_memories"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "SalesEvent_tenantId_status_idx" ON "SalesEvent"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SalesOpportunity_tenantId_status_idx" ON "SalesOpportunity"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_connections_tenantId_key" ON "instagram_connections"("tenantId");

-- CreateIndex
CREATE INDEX "instagram_comment_rules_tenantId_active_idx" ON "instagram_comment_rules"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "instagram_moderation_queue_commentId_key" ON "instagram_moderation_queue"("commentId");

-- CreateIndex
CREATE INDEX "instagram_moderation_queue_tenantId_status_idx" ON "instagram_moderation_queue"("tenantId", "status");

-- CreateIndex
CREATE INDEX "conversion_sequences_tenantId_active_idx" ON "conversion_sequences"("tenantId", "active");

-- CreateIndex
CREATE INDEX "conversion_sequence_steps_sequenceId_order_idx" ON "conversion_sequence_steps"("sequenceId", "order");

-- CreateIndex
CREATE INDEX "conversion_leads_tenantId_status_nextStepAt_idx" ON "conversion_leads"("tenantId", "status", "nextStepAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_leads_sequenceId_contactId_key" ON "conversion_leads"("sequenceId", "contactId");

-- CreateIndex
CREATE INDEX "conversion_lead_events_leadId_idx" ON "conversion_lead_events"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "facebook_connections_tenantId_key" ON "facebook_connections"("tenantId");

-- CreateIndex
CREATE INDEX "dead_letter_events_tenantId_status_idx" ON "dead_letter_events"("tenantId", "status");

-- CreateIndex
CREATE INDEX "dead_letter_events_createdAt_idx" ON "dead_letter_events"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "ops_checks_category_status_idx" ON "ops_checks"("category", "status");

-- CreateIndex
CREATE INDEX "incident_logs_status_severity_idx" ON "incident_logs"("status", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_tenantId_idx" ON "referral_codes"("tenantId");

-- CreateIndex
CREATE INDEX "referral_conversions_referralCodeId_idx" ON "referral_conversions"("referralCodeId");

-- CreateIndex
CREATE INDEX "referral_conversions_referredTenantId_idx" ON "referral_conversions"("referredTenantId");

-- CreateIndex
CREATE INDEX "expansion_events_tenantId_converted_idx" ON "expansion_events"("tenantId", "converted");

-- CreateIndex
CREATE INDEX "expansion_events_trigger_converted_idx" ON "expansion_events"("trigger", "converted");

-- CreateIndex
CREATE INDEX "churn_signals_tenantId_resolved_idx" ON "churn_signals"("tenantId", "resolved");

-- CreateIndex
CREATE INDEX "churn_signals_severity_resolved_idx" ON "churn_signals"("severity", "resolved");

-- CreateIndex
CREATE INDEX "churn_playbooks_tenantId_status_idx" ON "churn_playbooks"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lead_attributions_tenantId_firstSource_idx" ON "lead_attributions"("tenantId", "firstSource");

-- CreateIndex
CREATE INDEX "lead_attributions_tenantId_converted_idx" ON "lead_attributions"("tenantId", "converted");

-- CreateIndex
CREATE UNIQUE INDEX "lead_attributions_tenantId_contactId_key" ON "lead_attributions"("tenantId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_ownerTenantId_key" ON "agencies"("ownerTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "agency_members_agencyId_userId_key" ON "agency_members"("agencyId", "userId");

-- CreateIndex
CREATE INDEX "support_notes_tenantId_createdAt_idx" ON "support_notes"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_items_status_createdAt_idx" ON "feedback_items"("status", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_items_tenantId_idx" ON "feedback_items"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_health_scores_tenantId_key" ON "tenant_health_scores"("tenantId");

-- CreateIndex
CREATE INDEX "support_copilot_logs_tenantId_createdAt_idx" ON "support_copilot_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "support_copilot_logs_fallbackNeeded_createdAt_idx" ON "support_copilot_logs"("fallbackNeeded", "createdAt");

-- CreateIndex
CREATE INDEX "sandbox_runs_tenantId_createdAt_idx" ON "sandbox_runs"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "template_broadcasts_idempotencyKey_key" ON "template_broadcasts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "template_broadcasts_tenantId_status_idx" ON "template_broadcasts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "template_broadcasts_status_scheduledAt_idx" ON "template_broadcasts"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "template_broadcast_recipients_broadcastId_status_idx" ON "template_broadcast_recipients"("broadcastId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "template_broadcast_recipients_broadcastId_phone_key" ON "template_broadcast_recipients"("broadcastId", "phone");

-- CreateIndex
CREATE INDEX "custom_templates_tenantId_status_idx" ON "custom_templates"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "custom_templates_tenantId_name_key" ON "custom_templates"("tenantId", "name");

-- CreateIndex
CREATE INDEX "fiscal_emission_records_tenantId_createdAt_idx" ON "fiscal_emission_records"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "fiscal_emission_records_tenantId_externalReferenceId_idx" ON "fiscal_emission_records"("tenantId", "externalReferenceId");

-- CreateIndex
CREATE INDEX "migration_audits_tenantId_idx" ON "migration_audits"("tenantId");

-- CreateIndex
CREATE INDEX "migration_audit_items_auditId_idx" ON "migration_audit_items"("auditId");

-- CreateIndex
CREATE INDEX "migration_audit_items_recordId_idx" ON "migration_audit_items"("recordId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payment_configs_tenantId_key" ON "tenant_payment_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payments_tenantId_status_idx" ON "payments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "payments_tenantId_createdAt_idx" ON "payments"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_tenantId_contactId_idx" ON "payments"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "payments_tenantId_conversationId_idx" ON "payments"("tenantId", "conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_providerEventId_key" ON "payment_events"("providerEventId");

-- CreateIndex
CREATE INDEX "payment_events_paymentId_idx" ON "payment_events"("paymentId");

-- CreateIndex
CREATE INDEX "payment_events_tenantId_eventType_idx" ON "payment_events"("tenantId", "eventType");

-- CreateIndex
CREATE INDEX "feature_flags_parentModuleId_idx" ON "feature_flags"("parentModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_moduleId_scope_key" ON "feature_flags"("moduleId", "scope");

-- CreateIndex
CREATE INDEX "lead_search_runs_tenantId_createdAt_idx" ON "lead_search_runs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_search_runs_tenantId_status_idx" ON "lead_search_runs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lead_candidates_tenantId_searchRunId_idx" ON "lead_candidates"("tenantId", "searchRunId");

-- CreateIndex
CREATE INDEX "lead_candidates_tenantId_status_idx" ON "lead_candidates"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lead_candidates_tenantId_pipelineStage_idx" ON "lead_candidates"("tenantId", "pipelineStage");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scores_leadCandidateId_key" ON "lead_scores"("leadCandidateId");

-- CreateIndex
CREATE INDEX "lead_scores_tenantId_verdict_idx" ON "lead_scores"("tenantId", "verdict");

-- CreateIndex
CREATE INDEX "lead_enrichment_attempts_tenantId_attemptedAt_idx" ON "lead_enrichment_attempts"("tenantId", "attemptedAt");

-- CreateIndex
CREATE INDEX "lead_enrichment_attempts_tenantId_status_idx" ON "lead_enrichment_attempts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lead_campaign_drafts_tenantId_searchRunId_idx" ON "lead_campaign_drafts"("tenantId", "searchRunId");

-- CreateIndex
CREATE INDEX "lead_campaign_drafts_tenantId_channel_idx" ON "lead_campaign_drafts"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "lead_campaign_drafts_tenantId_status_idx" ON "lead_campaign_drafts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lead_campaign_executions_tenantId_createdAt_idx" ON "lead_campaign_executions"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_campaign_executions_tenantId_channel_idx" ON "lead_campaign_executions"("tenantId", "channel");

-- CreateIndex
CREATE INDEX "lead_campaign_executions_tenantId_status_idx" ON "lead_campaign_executions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lead_campaign_execution_items_tenantId_executionId_idx" ON "lead_campaign_execution_items"("tenantId", "executionId");

-- CreateIndex
CREATE INDEX "lead_campaign_execution_items_tenantId_status_idx" ON "lead_campaign_execution_items"("tenantId", "status");

-- CreateIndex
CREATE INDEX "lead_campaign_execution_items_executionId_processedAt_idx" ON "lead_campaign_execution_items"("executionId", "processedAt");

-- CreateIndex
CREATE INDEX "lead_suppressions_tenantId_leadCandidateId_idx" ON "lead_suppressions"("tenantId", "leadCandidateId");

-- CreateIndex
CREATE INDEX "lead_suppressions_tenantId_channel_active_idx" ON "lead_suppressions"("tenantId", "channel", "active");

-- CreateIndex
CREATE INDEX "lead_suppressions_leadCandidateId_active_idx" ON "lead_suppressions"("leadCandidateId", "active");

-- CreateIndex
CREATE INDEX "lead_provider_event_logs_tenantId_receivedAt_idx" ON "lead_provider_event_logs"("tenantId", "receivedAt");

-- CreateIndex
CREATE INDEX "lead_provider_event_logs_provider_channel_idx" ON "lead_provider_event_logs"("provider", "channel");

-- CreateIndex
CREATE INDEX "lead_provider_event_logs_executionItemId_receivedAt_idx" ON "lead_provider_event_logs"("executionItemId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "lead_provider_event_logs_provider_externalEventId_key" ON "lead_provider_event_logs"("provider", "externalEventId");

-- CreateIndex
CREATE INDEX "lead_prospecting_templates_tenantId_createdAt_idx" ON "lead_prospecting_templates"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_prospecting_templates_tenantId_active_idx" ON "lead_prospecting_templates"("tenantId", "active");

-- CreateIndex
CREATE INDEX "lead_prospecting_templates_tenantId_niche_idx" ON "lead_prospecting_templates"("tenantId", "niche");

-- CreateIndex
CREATE INDEX "lead_follow_up_logs_tenantId_leadCandidateId_idx" ON "lead_follow_up_logs"("tenantId", "leadCandidateId");

-- CreateIndex
CREATE INDEX "lead_follow_up_logs_tenantId_loggedAt_idx" ON "lead_follow_up_logs"("tenantId", "loggedAt");

-- CreateIndex
CREATE INDEX "lead_operational_alerts_tenantId_status_createdAt_idx" ON "lead_operational_alerts"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "lead_operational_alerts_tenantId_alertType_status_idx" ON "lead_operational_alerts"("tenantId", "alertType", "status");

-- CreateIndex
CREATE INDEX "lead_operational_alerts_leadCandidateId_status_idx" ON "lead_operational_alerts"("leadCandidateId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lead_operational_alerts_tenantId_ruleKey_key" ON "lead_operational_alerts"("tenantId", "ruleKey");

-- CreateIndex
CREATE INDEX "lead_company_registry_snapshots_tenantId_leadCandidateId_cr_idx" ON "lead_company_registry_snapshots"("tenantId", "leadCandidateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "beauty_workspace_configs_tenantId_key" ON "beauty_workspace_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "beauty_service_profiles_serviceId_key" ON "beauty_service_profiles"("serviceId");

-- CreateIndex
CREATE INDEX "beauty_service_profiles_tenantId_category_idx" ON "beauty_service_profiles"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "beauty_customer_profiles_contactId_key" ON "beauty_customer_profiles"("contactId");

-- CreateIndex
CREATE INDEX "beauty_customer_profiles_tenantId_lastServiceAt_idx" ON "beauty_customer_profiles"("tenantId", "lastServiceAt");

-- CreateIndex
CREATE INDEX "beauty_customer_profiles_tenantId_vipStatus_idx" ON "beauty_customer_profiles"("tenantId", "vipStatus");

-- CreateIndex
CREATE UNIQUE INDEX "beauty_professional_profiles_professionalId_key" ON "beauty_professional_profiles"("professionalId");

-- CreateIndex
CREATE INDEX "beauty_professional_profiles_tenantId_idx" ON "beauty_professional_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "beauty_packages_tenantId_active_idx" ON "beauty_packages"("tenantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "beauty_package_items_packageId_serviceId_key" ON "beauty_package_items"("packageId", "serviceId");

-- CreateIndex
CREATE INDEX "customer_beauty_packages_beautyProfileId_status_idx" ON "customer_beauty_packages"("beautyProfileId", "status");

-- CreateIndex
CREATE INDEX "beauty_package_usages_customerPkgId_idx" ON "beauty_package_usages"("customerPkgId");

-- CreateIndex
CREATE INDEX "appointment_locks_tenantId_date_time_idx" ON "appointment_locks"("tenantId", "date", "time");

-- CreateIndex
CREATE INDEX "appointment_locks_expiresAt_idx" ON "appointment_locks"("expiresAt");

-- CreateIndex
CREATE INDEX "beauty_waitlist_entries_tenantId_status_idx" ON "beauty_waitlist_entries"("tenantId", "status");

-- CreateIndex
CREATE INDEX "beauty_waitlist_entries_tenantId_preferredDate_idx" ON "beauty_waitlist_entries"("tenantId", "preferredDate");

-- CreateIndex
CREATE INDEX "beauty_campaign_rules_tenantId_active_idx" ON "beauty_campaign_rules"("tenantId", "active");

-- CreateIndex
CREATE INDEX "beauty_campaign_runs_ruleId_sentAt_idx" ON "beauty_campaign_runs"("ruleId", "sentAt");

-- CreateIndex
CREATE INDEX "beauty_campaign_runs_tenantId_sentAt_idx" ON "beauty_campaign_runs"("tenantId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_profiles_slug_key" ON "clinic_profiles"("slug");

-- CreateIndex
CREATE INDEX "clinic_profiles_isPublished_idx" ON "clinic_profiles"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_profiles_tenantId_key" ON "clinic_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "clinic_services_tenantId_idx" ON "clinic_services"("tenantId");

-- CreateIndex
CREATE INDEX "clinic_services_clinicProfileId_idx" ON "clinic_services"("clinicProfileId");

-- CreateIndex
CREATE INDEX "clinic_professionals_tenantId_idx" ON "clinic_professionals"("tenantId");

-- CreateIndex
CREATE INDEX "clinic_professionals_clinicProfileId_idx" ON "clinic_professionals"("clinicProfileId");

-- CreateIndex
CREATE INDEX "clinic_availability_tenantId_idx" ON "clinic_availability"("tenantId");

-- CreateIndex
CREATE INDEX "clinic_availability_clinicProfileId_idx" ON "clinic_availability"("clinicProfileId");

-- CreateIndex
CREATE INDEX "appointment_requests_tenantId_idx" ON "appointment_requests"("tenantId");

-- CreateIndex
CREATE INDEX "appointment_requests_clinicProfileId_idx" ON "appointment_requests"("clinicProfileId");

-- CreateIndex
CREATE INDEX "appointment_requests_tenantId_status_idx" ON "appointment_requests"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "public_booking_page_configs_clinicProfileId_key" ON "public_booking_page_configs"("clinicProfileId");

-- CreateIndex
CREATE INDEX "public_booking_page_configs_tenantId_idx" ON "public_booking_page_configs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_profiles_slug_key" ON "restaurant_profiles"("slug");

-- CreateIndex
CREATE INDEX "restaurant_profiles_isPublished_idx" ON "restaurant_profiles"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_profiles_tenantId_key" ON "restaurant_profiles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "public_menu_page_configs_restaurantProfileId_key" ON "public_menu_page_configs"("restaurantProfileId");

-- CreateIndex
CREATE INDEX "public_menu_page_configs_tenantId_idx" ON "public_menu_page_configs"("tenantId");

-- CreateIndex
CREATE INDEX "food_categories_tenantId_idx" ON "food_categories"("tenantId");

-- CreateIndex
CREATE INDEX "food_categories_restaurantProfileId_idx" ON "food_categories"("restaurantProfileId");

-- CreateIndex
CREATE INDEX "food_products_tenantId_idx" ON "food_products"("tenantId");

-- CreateIndex
CREATE INDEX "food_products_restaurantProfileId_idx" ON "food_products"("restaurantProfileId");

-- CreateIndex
CREATE INDEX "food_products_categoryId_idx" ON "food_products"("categoryId");

-- CreateIndex
CREATE INDEX "food_addon_groups_tenantId_idx" ON "food_addon_groups"("tenantId");

-- CreateIndex
CREATE INDEX "food_addon_groups_restaurantProfileId_idx" ON "food_addon_groups"("restaurantProfileId");

-- CreateIndex
CREATE INDEX "food_addon_groups_productId_idx" ON "food_addon_groups"("productId");

-- CreateIndex
CREATE INDEX "food_addon_options_tenantId_idx" ON "food_addon_options"("tenantId");

-- CreateIndex
CREATE INDEX "food_addon_options_addonGroupId_idx" ON "food_addon_options"("addonGroupId");

-- CreateIndex
CREATE INDEX "food_orders_tenantId_idx" ON "food_orders"("tenantId");

-- CreateIndex
CREATE INDEX "food_orders_restaurantProfileId_idx" ON "food_orders"("restaurantProfileId");

-- CreateIndex
CREATE INDEX "food_orders_tenantId_status_idx" ON "food_orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "food_order_items_tenantId_idx" ON "food_order_items"("tenantId");

-- CreateIndex
CREATE INDEX "food_order_items_orderId_idx" ON "food_order_items"("orderId");

-- CreateIndex
CREATE INDEX "food_order_items_productId_idx" ON "food_order_items"("productId");

-- CreateIndex
CREATE INDEX "food_order_item_addons_tenantId_idx" ON "food_order_item_addons"("tenantId");

-- CreateIndex
CREATE INDEX "food_order_item_addons_orderItemId_idx" ON "food_order_item_addons"("orderItemId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_mergedIntoContactId_fkey" FOREIGN KEY ("mergedIntoContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_identifiers" ADD CONSTRAINT "contact_identifiers_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_identifiers" ADD CONSTRAINT "contact_identifiers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_merges" ADD CONSTRAINT "contact_merges_survivorId_fkey" FOREIGN KEY ("survivorId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_merges" ADD CONSTRAINT "contact_merges_mergedId_fkey" FOREIGN KEY ("mergedId") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessConfig" ADD CONSTRAINT "BusinessConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handoff_configs" ADD CONSTRAINT "handoff_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_notifications" ADD CONSTRAINT "appointment_notifications_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_services" ADD CONSTRAINT "professional_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_blocks" ADD CONSTRAINT "availability_blocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_connections" ADD CONSTRAINT "whatsapp_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_insights" ADD CONSTRAINT "conversation_insights_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_memories" ADD CONSTRAINT "customer_memories_realContactId_fkey" FOREIGN KEY ("realContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_memories" ADD CONSTRAINT "customer_memories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesEvent" ADD CONSTRAINT "SalesEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesEvent" ADD CONSTRAINT "SalesEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_connections" ADD CONSTRAINT "instagram_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_comment_rules" ADD CONSTRAINT "instagram_comment_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instagram_moderation_queue" ADD CONSTRAINT "instagram_moderation_queue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_sequences" ADD CONSTRAINT "conversion_sequences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_sequence_steps" ADD CONSTRAINT "conversion_sequence_steps_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "conversion_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_leads" ADD CONSTRAINT "conversion_leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_leads" ADD CONSTRAINT "conversion_leads_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "conversion_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_lead_events" ADD CONSTRAINT "conversion_lead_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "conversion_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facebook_connections" ADD CONSTRAINT "facebook_connections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expansion_events" ADD CONSTRAINT "expansion_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churn_signals" ADD CONSTRAINT "churn_signals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churn_playbooks" ADD CONSTRAINT "churn_playbooks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_attributions" ADD CONSTRAINT "lead_attributions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_members" ADD CONSTRAINT "agency_members_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_health_scores" ADD CONSTRAINT "tenant_health_scores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_copilot_logs" ADD CONSTRAINT "support_copilot_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_broadcasts" ADD CONSTRAINT "template_broadcasts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_broadcast_recipients" ADD CONSTRAINT "template_broadcast_recipients_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "template_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_templates" ADD CONSTRAINT "custom_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_emission_records" ADD CONSTRAINT "fiscal_emission_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_audits" ADD CONSTRAINT "migration_audits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "migration_audit_items" ADD CONSTRAINT "migration_audit_items_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "migration_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_payment_configs" ADD CONSTRAINT "tenant_payment_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_search_runs" ADD CONSTRAINT "lead_search_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_candidates" ADD CONSTRAINT "lead_candidates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_candidates" ADD CONSTRAINT "lead_candidates_searchRunId_fkey" FOREIGN KEY ("searchRunId") REFERENCES "lead_search_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_candidates" ADD CONSTRAINT "lead_candidates_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_enrichment_attempts" ADD CONSTRAINT "lead_enrichment_attempts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_enrichment_attempts" ADD CONSTRAINT "lead_enrichment_attempts_searchRunId_fkey" FOREIGN KEY ("searchRunId") REFERENCES "lead_search_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_enrichment_attempts" ADD CONSTRAINT "lead_enrichment_attempts_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_drafts" ADD CONSTRAINT "lead_campaign_drafts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_drafts" ADD CONSTRAINT "lead_campaign_drafts_searchRunId_fkey" FOREIGN KEY ("searchRunId") REFERENCES "lead_search_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_drafts" ADD CONSTRAINT "lead_campaign_drafts_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_executions" ADD CONSTRAINT "lead_campaign_executions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_executions" ADD CONSTRAINT "lead_campaign_executions_searchRunId_fkey" FOREIGN KEY ("searchRunId") REFERENCES "lead_search_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_execution_items" ADD CONSTRAINT "lead_campaign_execution_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_execution_items" ADD CONSTRAINT "lead_campaign_execution_items_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "lead_campaign_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_execution_items" ADD CONSTRAINT "lead_campaign_execution_items_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "lead_campaign_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_campaign_execution_items" ADD CONSTRAINT "lead_campaign_execution_items_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_suppressions" ADD CONSTRAINT "lead_suppressions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_suppressions" ADD CONSTRAINT "lead_suppressions_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_provider_event_logs" ADD CONSTRAINT "lead_provider_event_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_provider_event_logs" ADD CONSTRAINT "lead_provider_event_logs_executionItemId_fkey" FOREIGN KEY ("executionItemId") REFERENCES "lead_campaign_execution_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_prospecting_templates" ADD CONSTRAINT "lead_prospecting_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_up_logs" ADD CONSTRAINT "lead_follow_up_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_follow_up_logs" ADD CONSTRAINT "lead_follow_up_logs_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_operational_alerts" ADD CONSTRAINT "lead_operational_alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_operational_alerts" ADD CONSTRAINT "lead_operational_alerts_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_operational_alerts" ADD CONSTRAINT "lead_operational_alerts_searchRunId_fkey" FOREIGN KEY ("searchRunId") REFERENCES "lead_search_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_company_registry_snapshots" ADD CONSTRAINT "lead_company_registry_snapshots_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_company_registry_snapshots" ADD CONSTRAINT "lead_company_registry_snapshots_leadCandidateId_fkey" FOREIGN KEY ("leadCandidateId") REFERENCES "lead_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_workspace_configs" ADD CONSTRAINT "beauty_workspace_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_service_profiles" ADD CONSTRAINT "beauty_service_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_service_profiles" ADD CONSTRAINT "beauty_service_profiles_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_customer_profiles" ADD CONSTRAINT "beauty_customer_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_customer_profiles" ADD CONSTRAINT "beauty_customer_profiles_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_professional_profiles" ADD CONSTRAINT "beauty_professional_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_professional_profiles" ADD CONSTRAINT "beauty_professional_profiles_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_packages" ADD CONSTRAINT "beauty_packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_package_items" ADD CONSTRAINT "beauty_package_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "beauty_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_beauty_packages" ADD CONSTRAINT "customer_beauty_packages_beautyProfileId_fkey" FOREIGN KEY ("beautyProfileId") REFERENCES "beauty_customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_beauty_packages" ADD CONSTRAINT "customer_beauty_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "beauty_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_package_usages" ADD CONSTRAINT "beauty_package_usages_customerPkgId_fkey" FOREIGN KEY ("customerPkgId") REFERENCES "customer_beauty_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_locks" ADD CONSTRAINT "appointment_locks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_waitlist_entries" ADD CONSTRAINT "beauty_waitlist_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_campaign_rules" ADD CONSTRAINT "beauty_campaign_rules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_campaign_runs" ADD CONSTRAINT "beauty_campaign_runs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "beauty_campaign_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_profiles" ADD CONSTRAINT "clinic_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_services" ADD CONSTRAINT "clinic_services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_services" ADD CONSTRAINT "clinic_services_clinicProfileId_fkey" FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_professionals" ADD CONSTRAINT "clinic_professionals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_professionals" ADD CONSTRAINT "clinic_professionals_clinicProfileId_fkey" FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_availability" ADD CONSTRAINT "clinic_availability_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_availability" ADD CONSTRAINT "clinic_availability_clinicProfileId_fkey" FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_availability" ADD CONSTRAINT "clinic_availability_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "clinic_professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_clinicProfileId_fkey" FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "clinic_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_requests" ADD CONSTRAINT "appointment_requests_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "clinic_professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_booking_page_configs" ADD CONSTRAINT "public_booking_page_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_booking_page_configs" ADD CONSTRAINT "public_booking_page_configs_clinicProfileId_fkey" FOREIGN KEY ("clinicProfileId") REFERENCES "clinic_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_profiles" ADD CONSTRAINT "restaurant_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_menu_page_configs" ADD CONSTRAINT "public_menu_page_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_menu_page_configs" ADD CONSTRAINT "public_menu_page_configs_restaurantProfileId_fkey" FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_restaurantProfileId_fkey" FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_products" ADD CONSTRAINT "food_products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_products" ADD CONSTRAINT "food_products_restaurantProfileId_fkey" FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_products" ADD CONSTRAINT "food_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "food_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_addon_groups" ADD CONSTRAINT "food_addon_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_addon_groups" ADD CONSTRAINT "food_addon_groups_restaurantProfileId_fkey" FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_addon_groups" ADD CONSTRAINT "food_addon_groups_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_addon_options" ADD CONSTRAINT "food_addon_options_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_addon_options" ADD CONSTRAINT "food_addon_options_addonGroupId_fkey" FOREIGN KEY ("addonGroupId") REFERENCES "food_addon_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_orders" ADD CONSTRAINT "food_orders_restaurantProfileId_fkey" FOREIGN KEY ("restaurantProfileId") REFERENCES "restaurant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_items" ADD CONSTRAINT "food_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "food_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_item_addons" ADD CONSTRAINT "food_order_item_addons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_item_addons" ADD CONSTRAINT "food_order_item_addons_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "food_order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_order_item_addons" ADD CONSTRAINT "food_order_item_addons_addonOptionId_fkey" FOREIGN KEY ("addonOptionId") REFERENCES "food_addon_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

