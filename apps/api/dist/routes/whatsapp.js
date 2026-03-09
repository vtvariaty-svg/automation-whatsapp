"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsappWebhook_1 = require("../integrations/whatsapp/whatsappWebhook");
const router = (0, express_1.Router)();
router.get('/webhook', whatsappWebhook_1.verifyWebhook);
router.post('/webhook', whatsappWebhook_1.handleIncomingMessage);
exports.default = router;
