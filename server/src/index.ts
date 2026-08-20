import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Scalora LMS Backend API running on http://localhost:${PORT}`);
  console.log(`✨ Health Check: http://localhost:${PORT}/api/health`);
});
