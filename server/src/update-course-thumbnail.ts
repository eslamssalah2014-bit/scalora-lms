import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.course.updateMany({
    where: {
      slug: {
        contains: 'business-engine',
        mode: 'insensitive',
      },
    },
    data: {
      thumbnail: '/courses/build-your-business-engine.jpg',
    },
  });

  console.log('Updated courses count:', updated.count);

  const courses = await prisma.course.findMany();
  console.log('Courses in DB after update:', JSON.stringify(courses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
