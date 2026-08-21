"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function probe() {
    const base = 'https://scalora-lms.onrender.com/api';
    console.log('Testing connection to Render backend at:', base);
    try {
        const health = await fetch(`${base}/health`);
        console.log('Health status:', health.status, await health.json());
    }
    catch (err) {
        console.error('Health check error:', err.message);
    }
    // Test admin login
    try {
        const adminLogin = await fetch(`${base}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@scalora.com', password: 'AdminPassword123!' })
        });
        console.log('Admin login status:', adminLogin.status);
        const adminData = await adminLogin.json();
        console.log('Admin login response:', adminData);
        if (adminData.token) {
            const statsRes = await fetch(`${base}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${adminData.token}` }
            });
            console.log('/admin/stats status:', statsRes.status);
            const stats = await statsRes.json();
            console.log('/admin/stats data:\n', JSON.stringify(stats, null, 2));
            const enrRes = await fetch(`${base}/enrollments/admin/all`, {
                headers: { 'Authorization': `Bearer ${adminData.token}` }
            });
            console.log('/enrollments/admin/all status:', enrRes.status);
            const enrData = await enrRes.json();
            console.log('/enrollments/admin/all data count:', enrData.enrollments?.length);
            console.log('/enrollments/admin/all enrollments:\n', JSON.stringify(enrData.enrollments?.slice(0, 3), null, 2));
            const stdRes = await fetch(`${base}/admin/students`, {
                headers: { 'Authorization': `Bearer ${adminData.token}` }
            });
            console.log('/admin/students status:', stdRes.status);
            const stdData = await stdRes.json();
            console.log('/admin/students data count:', stdData.students?.length);
        }
    }
    catch (err) {
        console.error('Admin test error:', err);
    }
}
probe();
