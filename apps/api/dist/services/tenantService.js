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
exports.listProducts = exports.createProduct = exports.updateTenantConfig = exports.getTenantConfig = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getTenantConfig = (tenantId) => __awaiter(void 0, void 0, void 0, function* () {
    const tenant = yield prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { businessConfig: true }
    });
    if (!tenant)
        throw new Error('Tenant not found');
    return {
        name: tenant.name,
        businessDescription: tenant.businessDescription,
        businessType: tenant.businessType,
        phone: tenant.phone,
        businessConfig: tenant.businessConfig
    };
});
exports.getTenantConfig = getTenantConfig;
const updateTenantConfig = (tenantId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, businessDescription, businessType, phone, openingHours, address, faqJson } = data;
    const configData = Object.assign(Object.assign(Object.assign({}, (openingHours !== undefined && { openingHours })), (address !== undefined && { address })), (faqJson !== undefined && { faqJson }));
    const tenant = yield prisma.tenant.update({
        where: { id: tenantId },
        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (businessDescription !== undefined && { businessDescription })), (businessType !== undefined && { businessType })), (phone !== undefined && { phone })), { businessConfig: {
                upsert: {
                    create: configData,
                    update: configData
                }
            } }),
        include: { businessConfig: true }
    });
    return tenant;
});
exports.updateTenantConfig = updateTenantConfig;
const createProduct = (tenantId, data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.product.create({
        data: Object.assign(Object.assign({}, data), { tenantId })
    });
});
exports.createProduct = createProduct;
const listProducts = (tenantId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma.product.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
    });
});
exports.listProducts = listProducts;
