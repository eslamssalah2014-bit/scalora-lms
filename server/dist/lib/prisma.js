"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const globalForPrisma = global;
const databaseUrl = process.env.DATABASE_URL ||
    'postgresql://postgres.cfwkcgxkbvsnhmgdauig:EslamSalah114@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
