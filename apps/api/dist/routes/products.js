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
const express_1 = require("express");
const tenantService_1 = require("../services/tenantService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name, description, price, category, currency, stock } = req.body;
        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }
        const product = yield (0, tenantService_1.createProduct)(tenantId, {
            name,
            description,
            price: Number(price),
            category,
            currency: currency || 'BRL',
            stock: stock ? Number(stock) : null
        });
        res.status(201).json(product);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: 'Unauthorized' });
        const products = yield (0, tenantService_1.listProducts)(tenantId);
        res.json(products);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: 'Unauthorized' });
        const product = yield (0, tenantService_1.getProduct)(tenantId, req.params.id);
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name, description, price, category, currency, stock } = req.body;
        const product = yield (0, tenantService_1.updateProduct)(tenantId, req.params.id, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (description !== undefined && { description })), (price !== undefined && { price: Number(price) })), (category !== undefined && { category })), (currency !== undefined && { currency })), (stock !== undefined && { stock: stock === null ? null : Number(stock) })));
        res.json(product);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.tenantId;
        if (!tenantId)
            return res.status(401).json({ error: 'Unauthorized' });
        yield (0, tenantService_1.deleteProduct)(tenantId, req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}));
exports.default = router;
