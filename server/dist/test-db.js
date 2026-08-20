"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- AUDITING SUPABASE POSTGRESQL TABLES ---');
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
    console.log(`Users (${userCount}):`, users);
    const courseCount = await prisma.course.count();
    const courses = await prisma.course.findMany({
        select: { id: true, title: true, slug: true, price: true, isPublished: true, _count: { select: { modules: true, quizzes: true, enrollments: true } } }
    });
    console.log(`Courses (${courseCount}):`, courses);
    const moduleCount = await prisma.module.count();
    const lessonCount = await prisma.lesson.count();
    const quizCount = await prisma.quiz.count();
    const enrollmentCount = await prisma.enrollment.count();
    const progressCount = await prisma.lessonProgress.count();
    const quizResultCount = await prisma.quizResult.count();
    const certCount = await prisma.certificate.count();
    console.log({
        users: userCount,
        courses: courseCount,
        modules: moduleCount,
        lessons: lessonCount,
        quizzes: quizCount,
        enrollments: enrollmentCount,
        lessonProgress: progressCount,
        quizResults: quizResultCount,
        certificates: certCount
    });
    await prisma.$disconnect();
}
main().catch((e) => {
    console.error('Database connection failed:', e);
    process.exit(1);
});
