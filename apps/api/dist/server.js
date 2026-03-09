"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// WhatsApp Automation Server - Initial Structure
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
const auth_1 = __importDefault(require("./routes/auth"));
const tenant_1 = __importDefault(require("./routes/tenant"));
const products_1 = __importDefault(require("./routes/products"));
const ai_1 = __importDefault(require("./routes/ai"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const webhook_1 = __importDefault(require("./routes/webhook"));
app.use('/auth', auth_1.default);
app.use('/tenant', tenant_1.default);
app.use('/products', products_1.default);
app.use('/ai', ai_1.default);
app.use('/whatsapp', whatsapp_1.default);
app.use('/webhook', webhook_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
