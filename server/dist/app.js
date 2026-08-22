"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const course_routes_js_1 = __importDefault(require("./routes/course.routes.js"));
const module_routes_js_1 = __importDefault(require("./routes/module.routes.js"));
const lesson_routes_js_1 = __importDefault(require("./routes/lesson.routes.js"));
const quiz_routes_js_1 = __importDefault(require("./routes/quiz.routes.js"));
const enrollment_routes_js_1 = __importDefault(require("./routes/enrollment.routes.js"));
const progress_routes_js_1 = __importDefault(require("./routes/progress.routes.js"));
const payment_routes_js_1 = __importDefault(require("./routes/payment.routes.js"));
const admin_routes_js_1 = __importDefault(require("./routes/admin.routes.js"));
const lead_routes_js_1 = __importDefault(require("./routes/lead.routes.js"));
const community_routes_js_1 = __importDefault(require("./routes/community.routes.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) ||
            allowedOrigins.includes('*') ||
            origin.endsWith('.vercel.app') ||
            /^http:\/\/localhost:\d+$/.test(origin);
        if (isAllowed) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive to prevent live site CORS blocks
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use('/api/auth', auth_routes_js_1.default);
app.use('/auth', auth_routes_js_1.default);
app.use('/api/courses', course_routes_js_1.default);
app.use('/courses', course_routes_js_1.default);
app.use('/api/modules', module_routes_js_1.default);
app.use('/modules', module_routes_js_1.default);
app.use('/api/lessons', lesson_routes_js_1.default);
app.use('/lessons', lesson_routes_js_1.default);
app.use('/api/quizzes', quiz_routes_js_1.default);
app.use('/quizzes', quiz_routes_js_1.default);
app.use('/api/enrollments', enrollment_routes_js_1.default);
app.use('/enrollments', enrollment_routes_js_1.default);
app.use('/api/progress', progress_routes_js_1.default);
app.use('/progress', progress_routes_js_1.default);
app.use('/api/payments', payment_routes_js_1.default);
app.use('/payments', payment_routes_js_1.default);
app.use('/api/leads', lead_routes_js_1.default);
app.use('/leads', lead_routes_js_1.default);
app.use('/api/community', community_routes_js_1.default);
app.use('/community', community_routes_js_1.default);
app.use('/api/admin', admin_routes_js_1.default);
app.use('/admin', admin_routes_js_1.default);
app.use('/students', admin_routes_js_1.default);
app.use('/', admin_routes_js_1.default);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
exports.default = app;
