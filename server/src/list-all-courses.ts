import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany();
  console.log('ALL COURSES IN DATABASE:');
  console.log(JSON.stringify(courses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
