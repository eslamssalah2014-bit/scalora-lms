"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
async function verifyLiveProductionEdit() {
    const vercelUrl = 'https://scalora-lms.vercel.app';
    console.log('=== VERIFYING LIVE PRODUCTION VERCEL DEPLOYMENT ===\n');
    // Wait for deployment
    for (let attempt = 1; attempt <= 6; attempt++) {
        console.log(`[Attempt ${attempt}/6] Probing ${vercelUrl}/api/health...`);
        try {
            const hRes = await fetch(`${vercelUrl}/api/health`);
            console.log(`  Health Status: ${hRes.status}`);
            const hText = await hRes.text();
            console.log(`  Health Body: ${hText.slice(0, 100)}`);
            if (hRes.status === 200 && hText.includes('Scalora LMS Backend')) {
                console.log('✅ LIVE VERCEL SERVERLESS BACKEND ACTIVE!');
                break;
            }
        }
        catch (e) {
            console.log('  Error:', e.message);
        }
        await new Promise((r) => setTimeout(r, 10000));
    }
    // 1. Get Admin & Target Student (shahd@gmail.com)
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const student = await prisma.user.findUnique({ where: { email: 'shahd@gmail.com' } });
    if (!admin || !student) {
        console.error('Missing admin or student!');
        return;
    }
    const adminToken = jsonwebtoken_1.default.sign({ id: admin.id, email: admin.email, role: admin.role, name: admin.name }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`\nTarget Student ID: ${student.id} (${student.name}, ${student.email})`);
    // 2. Perform live PUT request to edit student name to "shahd khaled"
    console.log('\n--- 1. Performing Live PUT /api/admin/students/:id on Vercel ---');
    const putUrl = `${vercelUrl}/api/admin/students/${student.id}`;
    const editPayload = {
        name: 'shahd khaled',
        email: 'shahd@gmail.com',
        phone: '+20 100 123 4567',
        status: 'ACTIVE',
        bio: 'Updated via verified production admin test',
    };
    const putRes = await fetch(putUrl, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(editPayload),
    });
    console.log('PUT HTTP Status:', putRes.status);
    console.log('PUT Content-Type:', putRes.headers.get('content-type'));
    const putBody = await putRes.text();
    console.log('PUT Response:\n', putBody);
    let putJson;
    try {
        putJson = JSON.parse(putBody);
    }
    catch {
        console.error('❌ Response is not JSON!');
    }
    // 3. Verify Database Update
    console.log('\n--- 2. Verifying PostgreSQL Row in Supabase ---');
    const dbUpdatedStudent = await prisma.user.findUnique({ where: { id: student.id } });
    console.log('Database User Row:');
    console.log({
        id: dbUpdatedStudent?.id,
        name: dbUpdatedStudent?.name,
        email: dbUpdatedStudent?.email,
        phone: dbUpdatedStudent?.phone,
        status: dbUpdatedStudent?.status,
        bio: dbUpdatedStudent?.bio,
        updatedAt: dbUpdatedStudent?.updatedAt,
    });
    // 4. Verify Audit Log Row
    console.log('\n--- 3. Verifying Audit Log Row in Supabase ---');
    const latestAuditLog = await prisma.auditLog.findFirst({
        where: { entityId: student.id, action: 'STUDENT_UPDATED' },
        orderBy: { createdAt: 'desc' },
    });
    console.log('Audit Log Record:');
    console.log({
        id: latestAuditLog?.id,
        action: latestAuditLog?.action,
        entityId: latestAuditLog?.entityId,
        userId: latestAuditLog?.userId,
        oldData: latestAuditLog?.oldData,
        newData: latestAuditLog?.newData,
        metadata: latestAuditLog?.metadata,
        createdAt: latestAuditLog?.createdAt,
    });
}
verifyLiveProductionEdit().finally(() => prisma.$disconnect());
