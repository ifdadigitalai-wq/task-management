"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const serverless_1 = require("@neondatabase/serverless");
const adapter_neon_1 = require("@prisma/adapter-neon");
const client_1 = require("@prisma/client");
const ws_1 = __importDefault(require("ws"));
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
const globalForPrisma = globalThis;
function makePrismaClient() {
    const adapter = new adapter_neon_1.PrismaNeon({ connectionString: process.env.DATABASE_URL });
    return new client_1.PrismaClient({ adapter });
}
exports.prisma = globalForPrisma.prisma ?? makePrismaClient();
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
