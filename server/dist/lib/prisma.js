"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.SOFT_DELETE_MODELS = exports.PROTECTED_TABLES = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const globalForPrisma = global;
const databaseUrl = process.env.DATABASE_URL ||
    'postgresql://postgres.cfwkcgxkbvsnhmgdauig:EslamSalah114@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const rawPrisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
// ============================================================================
// CRITICAL PRODUCTION DATABASE PROTECTION MIDDLEWARE
// ============================================================================
exports.PROTECTED_TABLES = [
    'User',
    'Course',
    'Module',
    'Lesson',
    'Enrollment',
    'Payment',
    'Certificate',
    'Lead',
    'PaymentRequest',
    'Quiz',
    'CommunityChannel',
    'CommunityPost',
    'CommunityComment',
    'CourseTrainer',
    'DirectMessage',
    'CommunityChatMessage',
];
exports.SOFT_DELETE_MODELS = [
    'User',
    'Category',
    'Course',
    'Module',
    'Lesson',
    'Quiz',
    'Enrollment',
    'Payment',
    'Certificate',
    'LessonProgress',
    'Lead',
    'PaymentRequest',
    'CommunityChannel',
    'CommunityPost',
    'CommunityComment',
    'DirectMessage',
    'CommunityChatMessage',
];
// Prisma Middleware: Intercepts & Blocks Destructive Queries
rawPrisma.$use(async (params, next) => {
    const modelName = params.model;
    const isProtected = exports.PROTECTED_TABLES.some((t) => t.toLowerCase() === (modelName || '').toLowerCase());
    const isSoftDeleteModel = exports.SOFT_DELETE_MODELS.some((t) => t.toLowerCase() === (modelName || '').toLowerCase());
    // 1. HARD BLOCK ON UNSCOPED deleteMany({})
    if (params.action === 'deleteMany') {
        const where = params.args?.where;
        const isUnscoped = !where || Object.keys(where).length === 0;
        if (isProtected && isUnscoped) {
            const errorMsg = `🚫 CRITICAL SAFETY VIOLATION: Unscoped deleteMany({}) on protected model "${modelName}" is permanently blocked by Production Database Protection Policy.`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    }
    // 2. SOFT DELETE ARCHITECTURE: Convert physical delete into soft delete (deletedAt timestamp)
    if (params.action === 'delete' && isSoftDeleteModel) {
        params.action = 'update';
        if (!params.args)
            params.args = { where: {} };
        params.args['data'] = { ...params.args['data'], deletedAt: new Date() };
    }
    // 3. READ QUERIES: Filter out soft-deleted records ONLY for models that support soft-delete
    if (isSoftDeleteModel) {
        if (params.action === 'findFirst') {
            if (!params.args)
                params.args = {};
            if (!params.args.where)
                params.args.where = {};
            if (params.args.where.deletedAt === undefined) {
                params.args.where.deletedAt = null;
            }
        }
        if (params.action === 'findMany') {
            if (!params.args)
                params.args = {};
            if (!params.args.where)
                params.args.where = {};
            if (params.args.where.deletedAt === undefined) {
                params.args.where.deletedAt = null;
            }
        }
    }
    return next(params);
});
exports.prisma = rawPrisma;
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
