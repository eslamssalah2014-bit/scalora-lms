"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function testLiveProduction() {
    console.log('================================================================');
    console.log('🌐 LIVE PRODUCTION NETWORK & AUTH PROBE');
    console.log('================================================================\n');
    // Let's test the Render backend URL directly and Vercel
    const RENDER_URL = 'https://scalora-lms.onrender.com/api';
    console.log('1. Checking Render backend health:');
    try {
        const healthRes = await fetch('https://scalora-lms.onrender.com/api/health');
        console.log('Render Health Status:', healthRes.status);
        console.log('Render Health Body:', await healthRes.text());
    }
    catch (err) {
        console.error('Render Health Error:', err.message);
    }
    console.log('\n2. Testing POST /auth/login with khaled.amar@example.com:');
    try {
        const loginRes = await fetch(`${RENDER_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'khaled.amar@example.com',
                password: 'Student123!',
            }),
        });
        const loginData = await loginRes.json();
        console.log('Login Response:', JSON.stringify(loginData, null, 2));
        if (loginData.token) {
            console.log('\n3. Decoding JWT token:');
            const decoded = jsonwebtoken_1.default.decode(loginData.token);
            console.log('Decoded Token Payload:', JSON.stringify(decoded, null, 2));
            console.log('JWT User ID:', decoded.id || decoded.userId);
            console.log('\n4. Calling GET /enrollments/my with Bearer token:');
            const enrollRes = await fetch(`${RENDER_URL}/enrollments/my`, {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log('Enrollments Status:', enrollRes.status);
            const enrollData = await enrollRes.json();
            console.log('Enrollments Response:', JSON.stringify(enrollData, null, 2));
            console.log('\n5. Calling GET /enrollments/my-courses with Bearer token:');
            const myCoursesRes = await fetch(`${RENDER_URL}/enrollments/my-courses`, {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log('/my-courses Status:', myCoursesRes.status);
            const myCoursesData = await myCoursesRes.json();
            console.log('/my-courses Response:', JSON.stringify(myCoursesData, null, 2));
        }
    }
    catch (err) {
        console.error('Live Test Error:', err);
    }
}
testLiveProduction();
