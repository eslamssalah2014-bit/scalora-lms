import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createKhaledAmar() {
  const email = 'khaled.amar@example.com';
  const name = 'Khaled Amar';
  const password = await bcrypt.hash('Student123!', 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Khaled Amar already exists in Supabase:', existing);
    return;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password,
      role: 'STUDENT',
    },
  });

  console.log('✅ Successfully created Khaled Amar in Supabase PostgreSQL:');
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

createKhaledAmar();
