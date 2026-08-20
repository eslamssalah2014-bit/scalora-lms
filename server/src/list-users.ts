import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  console.log('--- SUPABASE POSTGRESQL USERS ---');
  console.log(JSON.stringify(users, null, 2));
  console.log('Total count:', users.length);
  await prisma.$disconnect();
}

listUsers();
