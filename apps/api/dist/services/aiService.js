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
exports.classifyIntent = exports.generateResponse = void 0;
const openaiClient_1 = require("../integrations/openai/openaiClient");
const tenantService_1 = require("./tenantService");
const openai = (0, openaiClient_1.createOpenAIClient)();
const generateResponse = (tenantId, userMessage) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const config = yield (0, tenantService_1.getTenantConfig)(tenantId);
    const products = yield (0, tenantService_1.listProducts)(tenantId);
    const productList = products.map(p => `- ${p.name}: ${p.description} (R$ ${p.price})`).join('\n');
    const systemPrompt = `
Você é um assistente virtual da empresa ${config.name}.

Contexto da empresa:
Descrição: ${config.businessDescription || 'Não informada'}
Horário de Funcionamento: ${((_a = config.businessConfig) === null || _a === void 0 ? void 0 : _a.openingHours) || 'Não informado'}
Endereço: ${((_b = config.businessConfig) === null || _b === void 0 ? void 0 : _b.address) || 'Não informado'}

Produtos/Serviços:
${productList || 'Nenhum produto cadastrado no momento.'}

Seu objetivo:
Responder clientes de forma clara e educada. 
Use as informações acima para responder. Se não souber algo ou se a informação não estiver no contexto, peça mais informações ou sugira que o cliente aguarde um contato humano.

Mantenha as respostas concisas e profissionais.
  `;
    const response = yield openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
    });
    return response.choices[0].message.content;
});
exports.generateResponse = generateResponse;
const classifyIntent = (userMessage) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const systemPrompt = `
Classifique a intenção da mensagem do cliente em uma das seguintes categorias:
- question (dúvidas gerais/informações)
- order (fazer um pedido/comprar algo)
- appointment (agendamentos)
- support (suporte técnico/problemas)

Responda APENAS com a palavra da categoria.
  `;
    const response = yield openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ],
        max_tokens: 10,
    });
    const intent = (_a = response.choices[0].message.content) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim();
    return intent;
});
exports.classifyIntent = classifyIntent;
