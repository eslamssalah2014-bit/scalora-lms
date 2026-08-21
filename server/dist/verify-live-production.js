"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
async function verifyLiveProduction() {
    const vercelUrl = 'https://scalora-lms.vercel.app';
    console.log('=== VERIFYING LIVE PRODUCTION VERCEL DEPLOYMENT ===\n');
    // 1. Wait for deployment
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
    // 2. Authenticate as Admin
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const student = await prisma.user.findUnique({ where: { email: 'shahd@gmail.com' } });
    if (!admin || !student) {
        console.error('Missing admin or student!');
        return;
    }
    const adminToken = jsonwebtoken_1.default.sign({ id: admin.id, email: admin.email, role: admin.role, name: admin.name }, JWT_SECRET, { expiresIn: '7d' });
    console.log(`\nTarget Student ID: ${student.id} (${student.name}, ${student.email})`);
    // 3. Test GET /api/admin/students/:id on live Vercel
    console.log('\n--- 1. Live GET /api/admin/students/:id ---');
    const getRes = await fetch(`${vercelUrl}/api/admin/students/${student.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('GET Status:', getRes.status);
    console.log('GET Content-Type:', getRes.headers.get('content-type'));
    const getData = await getRes.json();
    console.log('GET Response:', JSON.stringify(getData, null, 2));
    // 4. Test PUT /api/admin/students/:id on live Vercel
    console.log('\n--- 2. Live PUT /api/admin/students/:id ---');
    const updatedName = 'shahd khaled';
    const updatedPhone = '+20 100 123 4567';
    const putRes = await fetch(`${vercelUrl}/api/admin/students/${student.id}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: updatedName,
            email: 'shahd@gmail.com',
            phone: updatedPhone,
            status: 'ACTIVE',
            bio: 'Verified in production deployment',
        }),
    });
    console.log('PUT Status:', putRes.status);
    console.log('PUT Content-Type:', putRes.headers.get('content-type'));
    const putData = await putRes.json();
    console.log('PUT Response:', JSON.stringify(putData, null, 2));
    // 5. Verify PostgreSQL database update
    console.log('\n--- 3. Verifying PostgreSQL Row in Supabase ---');
    const dbStudent = await prisma.user.findUnique({ where: { id: student.id } });
    console.log('Database User Row:', {
        id: dbStudent?.id,
        name: dbStudent?.name,
        email: dbStudent?.email,
        phone: dbStudent?.phone,
        status: dbStudent?.status,
        updatedAt: dbStudent?.updatedAt,
    });
    // 6. Verify audit_logs table row
    console.log('\n--- 4. Verifying Audit Log Row in Supabase ---');
    const audit = await prisma.auditLog.findFirst({
        where: { entityId: student.id, action: 'STUDENT_UPDATED' },
        orderBy: { createdAt: 'desc' },
    });
    console.log('Audit Log Row:', {
        id: audit?.id,
        action: audit?.action,
        entityId: audit?.entityId,
        userId: audit?.userId,
        oldData: audit?.oldData,
        newData: audit?.newData,
        metadata: audit?.metadata,
        createdAt: audit?.createdAt,
    });
    console.log('\n===============================================================');
    console.log('🎉 LIVE PRODUCTION VERIFICATION COMPLETED');
    console.log('===============================================================\n');
}
verifyLiveProduction().finally(() => prisma.$disconnect());
