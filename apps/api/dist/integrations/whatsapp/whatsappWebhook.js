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
exports.handleIncomingMessage = exports.verifyWebhook = void 0;
const messageRouter_1 = require("../../services/messageRouter");
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        }
        else {
            res.sendStatus(403);
        }
    }
};
exports.verifyWebhook = verifyWebhook;
const handleIncomingMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const body = req.body;
    if (body.object) {
        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from;
            const text = (_a = message.text) === null || _a === void 0 ? void 0 : _a.body;
            if (text) {
                console.log(`Received message from ${from}: ${text}`);
                // We don't await routeMessage to respond quickly to WhatsApp
                (0, messageRouter_1.routeMessage)(from, text).catch(err => console.error('Error routing message:', err));
            }
        }
        res.sendStatus(200);
    }
    else {
        res.sendStatus(404);
    }
});
exports.handleIncomingMessage = handleIncomingMessage;
