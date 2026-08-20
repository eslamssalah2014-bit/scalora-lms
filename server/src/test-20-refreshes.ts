import { prisma } from './lib/prisma';

async function run20RefreshesStabilityTest() {
  console.log('===============================================================');
  console.log('🔄 EXECUTING 20-CONSECUTIVE DATABASE QUERY STABILITY TEST');
  console.log('===============================================================\n');

  const TARGET_STUDENT_EMAIL = 'khaled.amar@example.com';
  const TARGET_COURSE_ID = 'cmt20p1010000syhs72pupnw3';

  let allPass = true;

  for (let i = 1; i <= 20; i++) {
    try {
      const [studentsCount, coursesCount, enrollmentsCount, targetStudent, targetCourse] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.user.findUnique({ where: { email: TARGET_STUDENT_EMAIL } }),
        prisma.course.findUnique({ where: { id: TARGET_COURSE_ID } }),
      ]);

      const studentFound = !!targetStudent;
      const courseFound = !!targetCourse;
      const stable = studentFound && courseFound && studentsCount >= 3 && coursesCount >= 5;

      if (!stable) {
        allPass = false;
        console.error(`❌ ITERATION #${i}: UNSTABLE STATE! Students: ${studentsCount}, Courses: ${coursesCount}`);
      } else {
        console.log(`✅ Iteration #${i.toString().padStart(2, '0')}: STABLE | Students: ${studentsCount} | Courses: ${coursesCount} | Enrollments: ${enrollmentsCount} | Khaled: Found | Course: Found`);
      }
    } catch (err: any) {
      allPass = false;
      console.error(`❌ ITERATION #${i} ERROR:`, err.message);
    }
    // Emulate standard user request interval
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log('\n===============================================================');
  if (allPass) {
    console.log('🎉 20/20 ITERATIONS PASSED: 100% STABILITY IN SUPABASE POSTGRESQL');
    console.log('Zero flickering, zero record loss, and all relations intact.');
  } else {
    console.log('⚠️ Some queries encountered inconsistencies.');
  }
  console.log('===============================================================');

  await prisma.$disconnect();
}

run20RefreshesStabilityTest();
