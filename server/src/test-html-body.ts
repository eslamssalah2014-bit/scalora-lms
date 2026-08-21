import jwt from 'jsonwebtoken';

async function checkBody() {
  const token = jwt.sign(
    { id: 'cmt1qtiw60000slivnsk358be', email: 'admin@scalora.com', role: 'ADMIN' },
    'scalora_super_secret_jwt_key_2026_modern_lms'
  );

  const res = await fetch('https://scalora-lms.vercel.app/api/admin/students/cmt2orrqh00138ll7z0wadwkt', {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('FULL BODY:\n', text);
}

checkBody();
