import { PrismaClient, Prisma } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.cfwkcgxkbvsnhmgdauig:EslamSalah114@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const rawPrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
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

export const PROTECTED_TABLES = [
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
];

const FORBIDDEN_RAW_SQL_PATTERNS = [
  /\bDROP\s+TABLE\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+TABLE\b.*\bDROP\b/i,
  /\bDELETE\s+FROM\b\s+[^;]+(?!\bWHERE\b)/i,
];

// Prisma Middleware: Intercepts & Blocks Destructive Queries
rawPrisma.$use(async (params, next) => {
  const modelName = params.model;

  // 1. HARD BLOCK ON UNSCOPED deleteMany({})
  if (params.action === 'deleteMany') {
    const isProtected = PROTECTED_TABLES.some(
      (t) => t.toLowerCase() === (modelName || '').toLowerCase()
    );

    const where = params.args?.where;
    const isUnscoped = !where || Object.keys(where).length === 0;

    if (isProtected && isUnscoped) {
      const errorMsg = `🚫 CRITICAL SAFETY VIOLATION: Unscoped deleteMany({}) on protected model "${modelName}" is permanently blocked by Production Database Protection Policy.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // 2. SOFT DELETE ARCHITECTURE: Convert physical delete into soft delete (deletedAt timestamp)
  if (params.action === 'delete') {
    const isProtected = PROTECTED_TABLES.some(
      (t) => t.toLowerCase() === (modelName || '').toLowerCase()
    );

    if (isProtected) {
      params.action = 'update';
      params.args['data'] = { deletedAt: new Date() };
    }
  }

  // 3. READ QUERIES: Filter out soft-deleted records by default
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.action = 'findFirst';
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  if (params.action === 'findMany') {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  return next(params);
});

export const prisma = rawPrisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
