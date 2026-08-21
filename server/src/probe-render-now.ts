import jwt from 'jsonwebtoken';

async function testRenderNow() {
  const token = jwt.sign(
    { id: 'cmt1qtiw60000slivnsk358be', email: 'admin@scalora.com', role: 'ADMIN', name: 'Admin' },
    'scalora_super_secret_jwt_key_2026_modern_lms',
    { expiresIn: '7d' }
  );

  console.log('Testing GET https://scalora-lms-3.onrender.com/api/admin/students/cmt2orrqh00138ll7z0wadwkt...');
  const res = await fetch('https://scalora-lms-3.onrender.com/api/admin/students/cmt2orrqh00138ll7z0wadwkt', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('GET Status:', res.status);
  console.log('GET Content-Type:', res.headers.get('content-type'));
  console.log('GET Body:', await res.text());

  console.log('\nTesting PUT https://scalora-lms-3.onrender.com/api/admin/students/cmt2orrqh00138ll7z0wadwkt...');
  const putRes = await fetch('https://scalora-lms-3.onrender.com/api/admin/students/cmt2orrqh00138ll7z0wadwkt', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'shahd khaled',
      email: 'shahd@gmail.com',
      phone: '+20 100 123 4567',
      status: 'ACTIVE'
    })
  });
  console.log('PUT Status:', putRes.status);
  console.log('PUT Content-Type:', putRes.headers.get('content-type'));
  console.log('PUT Body:', await putRes.text());
}

testRenderNow();
