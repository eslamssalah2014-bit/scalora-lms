import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const TARGET_COURSE_ID = 'cmt20p1010000syhs72pupnw3';

async function testRetrievalAndRendering() {
  console.log('================================================================');
  console.log('🔍 RUNTIME INVESTIGATION: ADMIN COURSES RETRIEVAL & RENDERING');
  console.log('================================================================\n');

  // 1. SQL DIRECT QUERY
  console.log('--- 1. DATABASE SQL QUERY (Supabase PostgreSQL) ---');
  const dbCourse = await prisma.course.findUnique({
    where: { id: TARGET_COURSE_ID },
    include: {
      modules: { include: { lessons: true } },
      quizzes: true,
      _count: { select: { enrollments: true } },
    },
  });
  console.log('Course in Supabase DB:', JSON.stringify(dbCourse, null, 2));

  // 2. GET /courses/admin/all API CONTROLLER LOGIC
  console.log('\n--- 2. GET /courses/admin/all CONTROLLER SIMULATION ---');
  const allDbCourses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      modules: { include: { lessons: true } },
      quizzes: true,
      _count: { select: { enrollments: true } },
    },
  });

  const apiFormatted = allDbCourses.map((course) => {
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    return {
      ...course,
      lessonsCount: totalLessons,
      quizzesCount: course.quizzes.length,
      studentsCount: course._count.enrollments,
    };
  });

  const apiResponse = { success: true, courses: apiFormatted };
  console.log(`Total courses returned by API: ${apiResponse.courses.length}`);
  const targetInApi = apiResponse.courses.find((c) => c.id === TARGET_COURSE_ID);
  console.log(`Target course in API response:`, !!targetInApi ? 'FOUND ✅' : 'NOT FOUND ❌');
  if (targetInApi) {
    console.log('API Result Object:\n', JSON.stringify(targetInApi, null, 2));
  }

  // 3. FRONTEND UI FILTERING LOGIC SIMULATION
  console.log('\n--- 3. FRONTEND UI RENDERING & FILTERING SIMULATION ---');
  const searchQueries = ['', 'Distributed', 'Event-Driven', 'Cloud Architecture', 'Dr. Tariq'];

  for (const search of searchQueries) {
    const filtered = apiResponse.courses.filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor.toLowerCase().includes(search.toLowerCase())
    );
    const targetInFiltered = filtered.find((c) => c.id === TARGET_COURSE_ID);
    console.log(`Filter "${search || '<empty>'}": ${filtered.length} courses rendered. Target visible: ${!!targetInFiltered}`);
  }

  await prisma.$disconnect();
}

testRetrievalAndRendering();
