import app from './app.js';
import jwt from 'jsonwebtoken';
import http from 'http';

async function testExpressRouting() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));

  const token = jwt.sign(
    { id: 'cmt1qtiw60000slivnsk358be', email: 'admin@scalora.com', role: 'ADMIN' },
    'scalora_super_secret_jwt_key_2026_modern_lms'
  );

  console.log('Testing GET http://localhost:5099/api/admin/students/cmt2orrqh00138ll7z0wadwkt...');
  const res = await fetch('http://localhost:5099/api/admin/students/cmt2orrqh00138ll7z0wadwkt', {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('Local Status Code:', res.status);
  console.log('Local Response Body:', await res.json());

  server.close();
}

testExpressRouting();
