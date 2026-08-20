import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres.cfwkcgxkbvsnhmgdauig:EslamSalah114@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
