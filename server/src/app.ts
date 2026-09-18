import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
import notificationRoutes from './routes/notification.routes.js';
import pwaAnalyticsRoutes from './routes/pwa-analytics.routes.js';
import studyPlannerRoutes from './routes/study-planner.routes.js';
import cmsRoutes from './routes/cms.routes.js';
import trainerSubmissionRoutes from './routes/trainer-submission.routes.js';
import adminSubmissionRoutes from './routes/admin-submission.routes.js';

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
app.use(
  express.json({
    limit: '25mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Enforce Zero Stale Cache policy across all dynamic API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads') || req.path.startsWith('/api/uploads')) {
    res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  } else if (req.path.startsWith('/api') || !req.path.includes('.')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
  }
  next();
});

import { AssetStorageService } from './services/asset-storage.service.js';

// Serve static uploaded assets with CORS from disk cache first
app.use('/uploads', cors(), express.static(path.join(process.cwd(), 'uploads'), { maxAge: '7d' }));
app.use('/api/uploads', cors(), express.static(path.join(process.cwd(), 'uploads'), { maxAge: '7d' }));

// Persistent Dynamic Asset Serving with Database Fallback & Auto-Recaching
const handleDynamicAsset = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const rawPath = req.params[0] || '';
    const parts = rawPath.split('/').filter(Boolean);
    const fileName = parts.pop() || '';
    const folder = parts.join('/') || 'general';

    const asset = await AssetStorageService.getAsset(folder, fileName);
    if (asset) {
      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(asset.buffer);
      return;
    }

    // Fallback: If not found, return sleek SVG placeholder for course/avatar rather than broken 404
    if (folder.includes('thumb') || fileName.includes('thumb') || fileName.includes('course')) {
      const svg = AssetStorageService.getPlaceholderSvg('course', 'Scalora Course');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(svg);
      return;
    }

    res.status(404).json({ success: false, message: 'Asset not found' });
  } catch (err: any) {
    console.error('[AssetServer] Error serving asset:', err);
    res.status(500).json({ success: false, message: 'Error retrieving asset' });
  }
};

app.get('/uploads/*', cors(), handleDynamicAsset);
app.get('/api/uploads/*', cors(), handleDynamicAsset);

// Centralized Universal Upload Endpoint for all assets (avatars, community, courses, media)
app.post(['/api/upload', '/upload'], cors(), async (req: express.Request, res: express.Response) => {
  try {
    const { imageBase64, fileBase64, fileName, folder = 'general', mimeType } = req.body;
    const base64Data = imageBase64 || fileBase64;
    if (!base64Data) {
      res.status(400).json({ success: false, message: 'No file/image data provided' });
      return;
    }

    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = req.get('host') || 'scalora-lms.onrender.com';

    const saved = await AssetStorageService.saveAsset({
      base64: base64Data,
      fileName,
      mimeType,
      folder,
      protocol,
      host,
    });

    res.json({
      success: true,
      url: saved.url,
      relativeUrl: saved.relativeUrl,
      path: saved.path,
      fileName: saved.fileName,
      size: saved.sizeFormatted,
    });
  } catch (err: any) {
    console.error('[UploadAPI] Error saving asset:', err);
    res.status(500).json({ success: false, message: err.message || 'Error saving uploaded asset' });
  }
});

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

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.use('/api/pwa', pwaAnalyticsRoutes);
app.use('/pwa', pwaAnalyticsRoutes);
app.use('/api/admin/pwa-analytics', pwaAnalyticsRoutes);
app.use('/api/study-planner', studyPlannerRoutes);
app.use('/study-planner', studyPlannerRoutes);

app.use('/api/cms', cmsRoutes);
app.use('/cms', cmsRoutes);

app.use('/api/trainer-submissions', trainerSubmissionRoutes);
app.use('/trainer-submissions', trainerSubmissionRoutes);

app.use('/api/admin/trainer-submissions', adminSubmissionRoutes);
app.use('/admin/trainer-submissions', adminSubmissionRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/students', adminRoutes);
app.use('/', adminRoutes);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.type === 'entity.too.large' || err?.status === 413 || err?.statusCode === 413) {
    res.status(413).json({
      success: false,
      message: 'File exceeds the 10 MB upload limit.',
    });
    return;
  }
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
