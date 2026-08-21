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
