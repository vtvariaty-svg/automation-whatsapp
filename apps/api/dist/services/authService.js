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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = exports.verifyPassword = exports.generateToken = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_fallback_key';
const generateToken = (userId, tenantId) => {
    return jsonwebtoken_1.default.sign({ userId, tenantId }, JWT_SECRET, { expiresIn: '1d' });
};
exports.generateToken = generateToken;
const verifyPassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcryptjs_1.default.compare(password, hash);
});
exports.verifyPassword = verifyPassword;
const registerUser = (name, email, passwordPlain) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield prisma.user.findUnique({ where: { email } });
    if (existingUser)
        throw new Error('User already exists');
    const passwordHash = yield bcryptjs_1.default.hash(passwordPlain, 10);
    // For stage 4, we create a new tenant for every new user if this is a true SaaS signup flow.
    // We'll create the tenant named after the user, then the user associated with it.
    const tenant = yield prisma.tenant.create({
        data: {
            name: `${name}'s Workspace`
        }
    });
    const user = yield prisma.user.create({
        data: {
            email,
            passwordHash,
            tenantId: tenant.id
        }
    });
    const token = (0, exports.generateToken)(user.id, user.tenantId);
    return { user: { id: user.id, email: user.email, tenantId: user.tenantId }, token };
});
exports.registerUser = registerUser;
const loginUser = (email, passwordPlain) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new Error('Invalid credentials');
    const isValid = yield (0, exports.verifyPassword)(passwordPlain, user.passwordHash);
    if (!isValid)
        throw new Error('Invalid credentials');
    const token = (0, exports.generateToken)(user.id, user.tenantId);
    return { user: { id: user.id, email: user.email, tenantId: user.tenantId }, token };
});
exports.loginUser = loginUser;
