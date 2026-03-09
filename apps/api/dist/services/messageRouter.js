"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeMessage = void 0;
const client_1 = require("@prisma/client");
const aiService_1 = require("./aiService");
const whatsappClient_1 = require("../integrations/whatsapp/whatsappClient");
const prisma = new client_1.PrismaClient();
const routeMessage = (from, text) => __awaiter(void 0, void 0, void 0, function* () {
    // For Stage 7, we'll assume a default tenant for the WhatsApp integration
    // In a real multi-tenant app, you'd map the WHATSAPP_PHONE_ID or a custom number to a tenantId
    // Here we'll pick the first tenant found in the database or create a dummy one
    let tenant = yield prisma.tenant.findFirst();
    if (!tenant) {
        tenant = yield prisma.tenant.create({
            data: { name: 'Default Tenant' }
        });
    }
    // 1. Log Conversation
    let conversation = yield prisma.conversation.findFirst({
        where: { customerPhone: from, tenantId: tenant.id }
    });
    if (!conversation) {
        conversation = yield prisma.conversation.create({
            data: {
                customerPhone: from,
                tenantId: tenant.id
            }
        });
    }
    // 2. Save incoming message
    yield prisma.message.create({
        data: {
            conversationId: conversation.id,
            role: 'user',
            content: text
        }
    });
    // 3. Generate AI Response
    const aiText = yield (0, aiService_1.generateResponse)(tenant.id, text);
    if (!aiText)
        return;
    // 4. Save AI message
    yield prisma.message.create({
        data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: aiText
        }
    });
    // 5. Send WhatsApp response
    yield (0, whatsappClient_1.sendMessage)(from, aiText);
});
exports.routeMessage = routeMessage;
