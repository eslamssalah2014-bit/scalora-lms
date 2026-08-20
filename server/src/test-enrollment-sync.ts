import { prisma } from './lib/prisma';
import dotenv from 'dotenv';

dotenv.config();

const STUDENT_EMAIL = 'khaled.amar@example.com';
const COURSE_ID = 'cmt20p1010000syhs72pupnw3';

async function testEnrollmentSync() {
  console.log('================================================================');
  console.log('🔍 ENROLLMENT SYNCHRONIZATION RUNTIME INVESTIGATION');
  console.log('================================================================\n');

  // 1. Find the student & course in DB
  const student = await prisma.user.findUnique({ where: { email: STUDENT_EMAIL } });
  const course = await prisma.course.findUnique({ where: { id: COURSE_ID } });

  if (!student || !course) {
    console.error('Student or Course not found in database!');
    return;
  }

  console.log(`Student Found: ${student.name} (${student.id}) - ${student.email}`);
  console.log(`Course Found: ${course.title} (${course.id})\n`);

  // 2. Ensure an enrollment exists (Manual Enroll Simulation)
  let enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: course.id,
      },
    },
    include: {
      user: true,
      course: true,
      payment: true,
    },
  });

  if (!enrollment) {
    console.log('Creating manual enrollment in database...');
    const payment = await prisma.payment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        amount: 0.0,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'ADMIN_MANUAL',
        transactionId: `manual_test_${Date.now()}`,
      },
    });

    enrollment = await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        status: 'ACTIVE',
        amount: 0.0,
        paymentId: payment.id,
      },
      include: {
        user: true,
        course: true,
        payment: true,
      },
    });
  }

  console.log('--- 1. EXACT DATABASE ENROLLMENT ROW ---');
  console.log('Enrollment ID:', enrollment.id);
  console.log('User ID:', enrollment.userId);
  console.log('Course ID:', enrollment.courseId);
  console.log('Status:', enrollment.status);
  console.log('Full DB Row:\n', JSON.stringify(enrollment, null, 2));

  // 3. Query all enrollments for that student
  console.log('\n--- 2. ALL ENROLLMENTS FOR STUDENT ---');
  const allStudentEnrollments = await prisma.enrollment.findMany({
    where: { userId: student.id },
    include: { course: true },
  });
  console.log(`Total courses enrolled by ${student.name}: ${allStudentEnrollments.length}`);

  // 4. Simulate GET /enrollments/my (and /enrollments/my-courses) Controller Logic
  console.log('\n--- 3. GET /enrollments/my CONTROLLER RESPONSE ---');
  const enrollmentsQuery = await prisma.enrollment.findMany({
    where: { userId: student.id },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: { select: { id: true, title: true, duration: true, type: true } },
            },
          },
          quizzes: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const enrolledCourses = enrollmentsQuery.map((enr) => {
    const allLessons = enr.course.modules.flatMap((m) => m.lessons);
    const totalLessons = allLessons.length;
    return {
      enrollmentId: enr.id,
      enrolledAt: enr.createdAt,
      status: enr.status,
      progressPercent: 0,
      completedCount: 0,
      totalLessons,
      nextLessonId: allLessons[0]?.id,
      course: {
        id: enr.course.id,
        title: enr.course.title,
        slug: enr.course.slug,
        description: enr.course.description,
        thumbnail: enr.course.thumbnail,
        instructor: enr.course.instructor,
        category: enr.course.category,
        level: enr.course.level,
        modulesCount: enr.course.modules.length,
        quizzesCount: enr.course.quizzes.length,
      },
    };
  });

  const apiResponse = { success: true, enrollments: enrolledCourses };
  console.log('API Response Object:\n', JSON.stringify(apiResponse, null, 2));

  await prisma.$disconnect();
}

testEnrollmentSync();
