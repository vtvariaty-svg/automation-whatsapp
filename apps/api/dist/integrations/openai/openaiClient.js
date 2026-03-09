"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenAIClient = void 0;
const openai_1 = __importDefault(require("openai"));
const createOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn('OPENAI_API_KEY is not defined in environment variables');
    }
    return new openai_1.default({
        apiKey: apiKey,
    });
};
exports.createOpenAIClient = createOpenAIClient;
