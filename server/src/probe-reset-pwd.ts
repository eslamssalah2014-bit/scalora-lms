import jwt from 'jsonwebtoken';

async function probeRenderResetPassword() {
  const token = jwt.sign(
    { id: 'cmt1qtiw60000slivnsk358be', email: 'admin@scalora.com', role: 'ADMIN', name: 'Admin' },
    'scalora_super_secret_jwt_key_2026_modern_lms',
    { expiresIn: '7d' }
  );

  const studentId = 'cmt2orrqh00138ll7z0wadwkt'; // shahd@gmail.com
  const url = `https://scalora-lms-3.onrender.com/api/admin/students/${studentId}/reset-password`;

  console.log(`Sending POST ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newPassword: 'Password123!',
        confirmPassword: 'Password123!',
      }),
    });

    console.log('HTTP Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const body = await res.text();
    console.log('Response Body:\n', body);
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

probeRenderResetPassword();
