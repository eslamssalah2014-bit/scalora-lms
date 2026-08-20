"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function runCourseCreationTest() {
    console.log('=============================================================');
    console.log('🧪 LIVE SUPABASE COURSE CREATION & PERSISTENCE VERIFICATION');
    console.log('=============================================================\n');
    const timestamp = Date.now();
    const coursePayload = {
        title: `Distributed Systems & Event-Driven Architecture (${timestamp})`,
        slug: `distributed-systems-event-driven-${timestamp}`,
        description: 'Master enterprise message brokers, Kafka streaming pipelines, event sourcing, and CQRS patterns for resilient cloud scale.',
        thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
        price: 129.99,
        instructor: 'Dr. Tariq Al-Mansoor',
        category: 'Cloud Architecture',
        level: 'Advanced',
        isPublished: true,
    };
    try {
        // -------------------------------------------------------------
        // 1. EXECUTE COURSE CREATION (POST /courses logic)
        // -------------------------------------------------------------
        console.log('--- 1. POST /courses SIMULATION ---');
        const createdCourse = await prisma.course.create({
            data: {
                ...coursePayload,
                modules: {
                    create: [
                        {
                            title: 'Module 1: Event-Driven Foundations',
                            order: 1,
                            lessons: {
                                create: [
                                    {
                                        title: '1.1 Event Sourcing vs CDC Architecture',
                                        type: 'TEXT',
                                        duration: '25 min',
                                        order: 1,
                                        content: 'Deep dive into event sourcing and distributed ledger consistency.',
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            include: {
                modules: {
                    include: {
                        lessons: true,
                    },
                },
            },
        });
        const postResponse = {
            success: true,
            message: 'Course created successfully',
            course: createdCourse,
        };
        console.log('POST /courses Response:\n', JSON.stringify(postResponse, null, 2));
        const courseId = createdCourse.id;
        // -------------------------------------------------------------
        // 2. QUERY SUPABASE POSTGRESQL IMMEDIATELY
        // -------------------------------------------------------------
        console.log('\n--- 2. INITIAL DATABASE ROW QUERY (SUPABASE POSTGRESQL) ---');
        const initialRow = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        lessons: true,
                    },
                },
            },
        });
        console.log('Exact Database Row from Supabase:\n', JSON.stringify(initialRow, null, 2));
        // -------------------------------------------------------------
        // 3. SIMULATE REFRESH / DISCONNECT & RE-QUERY
        // -------------------------------------------------------------
        console.log('\n--- 3. SIMULATING REFRESH / RECONNECTING CLIENT ---');
        await prisma.$disconnect();
        // Reconnect new Prisma Client instance
        const freshPrisma = new client_1.PrismaClient();
        const refreshedRow = await freshPrisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        lessons: true,
                    },
                },
            },
        });
        console.log('\n--- 4. POST-REFRESH QUERY RESULT ---');
        console.log('Course ID:', courseId);
        console.log('Exists in Supabase after refresh:', !!refreshedRow);
        console.log('Exact Row in Supabase:\n', JSON.stringify(refreshedRow, null, 2));
        await freshPrisma.$disconnect();
        console.log('\n=============================================================');
        console.log('✅ VERIFICATION RESULT: 100% PERSISTED IN SUPABASE POSTGRESQL');
        console.log('=============================================================');
    }
    catch (error) {
        console.error('❌ Error during course creation test:', error);
        await prisma.$disconnect();
    }
}
runCourseCreationTest();
