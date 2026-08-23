import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/course.routes.js';
import moduleRoutes from './routes/module.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import progressRoutes from './routes/progress.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import leadRoutes from './routes/lead.routes.js';
import communityRoutes from './routes/community.routes.js';
import trainerRoutes from './routes/trainer.routes.js';
import messageRoutes from './routes/message.routes.js';
import chatRoutes from './routes/chat.routes.js';
import realtimeRoutes from './routes/realtime.routes.js';

dotenv.config();

const app = express();

// Path Normalizer for Vercel Serverless Function [...path]
app.use((req, _res, next) => {
  if (req.url && req.url.includes('[...path]')) {
    const rawPath = req.query?.path;
    const cleanPath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath || '';
    req.url = `/api/${cleanPath}`;
  }
  next();
});

// Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const isAllowed =
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app') ||
        /^http:\/\/localhost:\d+$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive to prevent live site CORS blocks
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'Scalora LMS Backend',
    timestamp: new Date().toISOString(),
  });
});
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'Scalora LMS Backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/debug-headers', (req, res) => {
  res.json({
    url: req.url,
    originalUrl: req.originalUrl,
    headers: req.headers,
    query: req.query,
  });
});

// API Routes (Mounted with /api prefix and root for serverless execution)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/courses', courseRoutes);
app.use('/courses', courseRoutes);

app.use('/api/modules', moduleRoutes);
app.use('/modules', moduleRoutes);

app.use('/api/lessons', lessonRoutes);
app.use('/lessons', lessonRoutes);

app.use('/api/quizzes', quizRoutes);
app.use('/quizzes', quizRoutes);

app.use('/api/enrollments', enrollmentRoutes);
app.use('/enrollments', enrollmentRoutes);

app.use('/api/progress', progressRoutes);
app.use('/progress', progressRoutes);

app.use('/api/payments', paymentRoutes);
app.use('/payments', paymentRoutes);

app.use('/api/leads', leadRoutes);
app.use('/leads', leadRoutes);

app.use('/api/community/chat', chatRoutes);
app.use('/community/chat', chatRoutes);

app.use('/api/community', communityRoutes);
app.use('/community', communityRoutes);

app.use('/api/trainers', trainerRoutes);
app.use('/trainers', trainerRoutes);

app.use('/api/messages', messageRoutes);
app.use('/messages', messageRoutes);

app.use('/api/realtime', realtimeRoutes);
app.use('/realtime', realtimeRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/students', adminRoutes);
app.use('/', adminRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
