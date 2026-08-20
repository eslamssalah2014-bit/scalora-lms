"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
