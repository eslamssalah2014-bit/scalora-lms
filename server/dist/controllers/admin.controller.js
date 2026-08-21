"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformSettings = exports.getStudentActivity = exports.resetStudentPassword = exports.updateStudent = exports.getStudentDetails = exports.getStudentsList = exports.getDashboardStats = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const getDashboardStats = async (_req, res) => {
    try {
        const [totalCourses, totalStudents, totalEnrollments, allPayments, recentEnrollments, courses] = await Promise.all([
            prisma_js_1.prisma.course.count(),
            prisma_js_1.prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma_js_1.prisma.enrollment.count(),
            prisma_js_1.prisma.payment.findMany({
                where: { status: 'COMPLETED' },
                select: { amount: true },
            }),
            prisma_js_1.prisma.enrollment.findMany({
                take: 6,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true, avatar: true } },
                    course: { select: { id: true, title: true, price: true, category: true } },
                    payment: { select: { id: true, transactionId: true, provider: true } },
                },
            }),
            prisma_js_1.prisma.course.findMany({
                include: {
                    _count: { select: { enrollments: true, modules: true } },
                },
            }),
        ]);
        const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        // Calculate category distribution
        const categoryMap = {};
        courses.forEach((c) => {
            categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
        });
        const categoryDistribution = Object.entries(categoryMap).map(([category, count]) => ({
            category,
            count,
        }));
        // Top courses by enrollment
        const topCourses = courses
            .sort((a, b) => b._count.enrollments - a._count.enrollments)
            .slice(0, 5)
            .map((c) => ({
            id: c.id,
            title: c.title,
            price: c.price,
            category: c.category,
            enrollmentsCount: c._count.enrollments,
            isPublished: c.isPublished,
        }));
        res.json({
            success: true,
            stats: {
                totalCourses,
                totalStudents,
                totalEnrollments,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                publishedCoursesCount: courses.filter((c) => c.isPublished).length,
            },
            categoryDistribution,
            topCourses,
            recentEnrollments,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching admin stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getStudentsList = async (_req, res) => {
    try {
        const students = await prisma_js_1.prisma.user.findMany({
            where: { role: 'STUDENT' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                avatar: true,
                bio: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        enrollments: true,
                        quizResults: true,
                        certificates: true,
                    },
                },
                enrollments: {
                    include: {
                        course: { select: { id: true, title: true, price: true, category: true } },
                    },
                },
            },
        });
        res.json({ success: true, students });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching students list' });
    }
};
exports.getStudentsList = getStudentsList;
const getStudentDetails = async (req, res) => {
    try {
        const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!studentId) {
            res.status(400).json({ success: false, message: 'Student ID is required' });
            return;
        }
        const student = await prisma_js_1.prisma.user.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const [enrollments, quizResults, certificates, completedProgress] = await Promise.all([
            prisma_js_1.prisma.enrollment.findMany({
                where: { userId: studentId },
                include: {
                    course: {
                        include: {
                            modules: {
                                include: {
                                    lessons: { select: { id: true, title: true, duration: true, type: true } },
                                },
                            },
                            quizzes: { select: { id: true, title: true, passingScore: true } },
                        },
                    },
                    payment: {
                        select: { id: true, amount: true, currency: true, status: true, provider: true, transactionId: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.prisma.quizResult.findMany({
                where: { userId: studentId },
                include: {
                    quiz: {
                        select: { id: true, title: true, passingScore: true, course: { select: { id: true, title: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.prisma.certificate.findMany({
                where: { userId: studentId },
                include: {
                    course: { select: { id: true, title: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.prisma.lessonProgress.findMany({
                where: { userId: studentId, isCompleted: true },
                select: { lessonId: true, completedAt: true },
            }),
        ]);
        const completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));
        // Format enrollments with calculated progress %
        const formattedEnrollments = enrollments.map((enr) => {
            const allLessons = (enr.course.modules || []).flatMap((m) => m.lessons || []);
            const totalLessons = allLessons.length;
            const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length;
            const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
            const isCompleted = progressPercent === 100 || enr.status === 'COMPLETED';
            return {
                id: enr.id,
                status: enr.status,
                amount: enr.amount,
                enrolledAt: enr.createdAt,
                progressPercent,
                completedCount,
                totalLessons,
                isCompleted,
                course: {
                    id: enr.course.id,
                    title: enr.course.title,
                    slug: enr.course.slug,
                    thumbnail: enr.course.thumbnail,
                    instructor: enr.course.instructor,
                    category: enr.course.category,
                    level: enr.course.level,
                    modulesCount: (enr.course.modules || []).length,
                    quizzesCount: (enr.course.quizzes || []).length,
                },
                payment: enr.payment,
            };
        });
        const completedCoursesCount = formattedEnrollments.filter((e) => e.progressPercent === 100).length;
        res.json({
            success: true,
            student: {
                id: student.id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                status: student.status,
                role: student.role,
                avatar: student.avatar,
                bio: student.bio,
                createdAt: student.createdAt,
                updatedAt: student.updatedAt,
                lastLoginAt: student.lastLoginAt,
                stats: {
                    totalEnrollments: enrollments.length,
                    completedCourses: completedCoursesCount,
                    certificatesEarned: certificates.length,
                    quizAttempts: quizResults.length,
                    activeCourses: enrollments.filter((e) => e.status === 'ACTIVE').length,
                    lessonsCompleted: completedProgress.length,
                },
                enrollments: formattedEnrollments,
                quizResults: quizResults.map((q) => ({
                    id: q.id,
                    quizId: q.quizId,
                    quizTitle: q.quiz?.title || 'Course Quiz',
                    courseTitle: q.quiz?.course?.title || 'Course Track',
                    score: q.score,
                    passed: q.passed,
                    createdAt: q.createdAt,
                })),
                certificates: certificates.map((c) => ({
                    id: c.id,
                    certificateNumber: c.certificateNumber,
                    courseTitle: c.courseTitle,
                    courseId: c.courseId,
                    instructorName: c.instructorName,
                    verificationUrl: c.verificationUrl,
                    createdAt: c.createdAt,
                })),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching student details' });
    }
};
exports.getStudentDetails = getStudentDetails;
const updateStudentSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address format'),
    phone: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
    bio: zod_1.z.string().optional().nullable(),
});
const updateStudent = async (req, res) => {
    try {
        const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const validatedData = updateStudentSchema.parse(req.body);
        const existingStudent = await prisma_js_1.prisma.user.findUnique({
            where: { id: studentId },
        });
        if (!existingStudent) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        // Check email uniqueness if email is modified
        if (validatedData.email.toLowerCase() !== existingStudent.email.toLowerCase()) {
            const emailConflict = await prisma_js_1.prisma.user.findFirst({
                where: {
                    email: { equals: validatedData.email, mode: 'insensitive' },
                    NOT: { id: studentId },
                },
            });
            if (emailConflict) {
                res.status(400).json({
                    success: false,
                    message: 'Email address is already in use by another account',
                });
                return;
            }
        }
        const oldData = {
            name: existingStudent.name,
            email: existingStudent.email,
            phone: existingStudent.phone,
            status: existingStudent.status,
            bio: existingStudent.bio,
        };
        const updatedStudent = await prisma_js_1.prisma.user.update({
            where: { id: studentId },
            data: {
                name: validatedData.name.trim(),
                email: validatedData.email.trim().toLowerCase(),
                phone: validatedData.phone ? validatedData.phone.trim() : null,
                status: validatedData.status || existingStudent.status || 'ACTIVE',
                bio: validatedData.bio !== undefined ? validatedData.bio : existingStudent.bio,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                bio: true,
                avatar: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        const newData = {
            name: updatedStudent.name,
            email: updatedStudent.email,
            phone: updatedStudent.phone,
            status: updatedStudent.status,
            bio: updatedStudent.bio,
        };
        // Create Audit Log
        await prisma_js_1.prisma.auditLog.create({
            data: {
                action: 'STUDENT_UPDATED',
                entityType: 'USER',
                entityId: studentId,
                userId: req.user?.id || null,
                oldData: JSON.stringify(oldData),
                newData: JSON.stringify(newData),
                metadata: JSON.stringify({
                    adminName: req.user?.name || 'Administrator',
                    adminEmail: req.user?.email || 'admin@scalora.com',
                    ip: req.ip || req.socket.remoteAddress || 'unknown',
                }),
            },
        });
        res.json({
            success: true,
            message: 'Student profile updated successfully',
            student: updatedStudent,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation error' });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error updating student' });
    }
};
exports.updateStudent = updateStudent;
const resetPasswordSchema = zod_1.z
    .object({
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
const resetStudentPassword = async (req, res) => {
    try {
        const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { password } = resetPasswordSchema.parse(req.body);
        const student = await prisma_js_1.prisma.user.findUnique({
            where: { id: studentId },
        });
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        // Hash password with bcrypt
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma_js_1.prisma.user.update({
            where: { id: studentId },
            data: {
                password: hashedPassword,
            },
        });
        // Create Audit Log (never log password or hash)
        await prisma_js_1.prisma.auditLog.create({
            data: {
                action: 'PASSWORD_RESET',
                entityType: 'USER',
                entityId: studentId,
                userId: req.user?.id || null,
                oldData: null,
                newData: null,
                metadata: JSON.stringify({
                    adminName: req.user?.name || 'Administrator',
                    adminEmail: req.user?.email || 'admin@scalora.com',
                    studentEmail: student.email,
                    studentName: student.name,
                    resetAt: new Date().toISOString(),
                }),
            },
        });
        res.json({
            success: true,
            message: `Password has been reset successfully for ${student.name}`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0]?.message || 'Validation error' });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error resetting password' });
    }
};
exports.resetStudentPassword = resetStudentPassword;
const getStudentActivity = async (req, res) => {
    try {
        const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const [student, auditLogs, enrollments, quizResults, certificates] = await Promise.all([
            prisma_js_1.prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true, email: true } }),
            prisma_js_1.prisma.auditLog.findMany({
                where: { entityId: studentId },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.prisma.enrollment.findMany({
                where: { userId: studentId },
                include: { course: { select: { id: true, title: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.prisma.quizResult.findMany({
                where: { userId: studentId },
                include: { quiz: { select: { id: true, title: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.prisma.certificate.findMany({
                where: { userId: studentId },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        if (!student) {
            res.status(404).json({ success: false, message: 'Student not found' });
            return;
        }
        const activities = [];
        // Map Audit Logs
        auditLogs.forEach((log) => {
            let meta = {};
            try {
                if (log.metadata)
                    meta = JSON.parse(log.metadata);
            }
            catch { }
            if (log.action === 'STUDENT_UPDATED') {
                let oldD = {};
                let newD = {};
                try {
                    if (log.oldData)
                        oldD = JSON.parse(log.oldData);
                    if (log.newData)
                        newD = JSON.parse(log.newData);
                }
                catch { }
                const changes = [];
                if (oldD.name !== newD.name)
                    changes.push(`Name: "${oldD.name}" → "${newD.name}"`);
                if (oldD.email !== newD.email)
                    changes.push(`Email: "${oldD.email}" → "${newD.email}"`);
                if (oldD.status !== newD.status)
                    changes.push(`Status: ${oldD.status} → ${newD.status}`);
                if (oldD.phone !== newD.phone)
                    changes.push(`Phone: ${oldD.phone || 'None'} → ${newD.phone || 'None'}`);
                activities.push({
                    id: `audit-${log.id}`,
                    type: 'STUDENT_UPDATED',
                    title: 'Student Profile Updated',
                    description: changes.length > 0 ? changes.join(', ') : 'Profile details updated by administrator',
                    timestamp: log.createdAt,
                    actor: meta.adminName || 'Admin',
                    details: { oldData: oldD, newData: newD },
                });
            }
            else if (log.action === 'PASSWORD_RESET') {
                activities.push({
                    id: `audit-${log.id}`,
                    type: 'PASSWORD_RESET',
                    title: 'Password Reset',
                    description: 'Account password was reset by administrator',
                    timestamp: log.createdAt,
                    actor: meta.adminName || 'Admin',
                });
            }
            else {
                activities.push({
                    id: `audit-${log.id}`,
                    type: log.action,
                    title: log.action.replace(/_/g, ' '),
                    description: 'System audit event recorded',
                    timestamp: log.createdAt,
                    actor: meta.adminName || 'Admin',
                });
            }
        });
        // Map Enrollments
        enrollments.forEach((enr) => {
            activities.push({
                id: `enr-${enr.id}`,
                type: 'ENROLLMENT',
                title: 'Enrolled in Course',
                description: `Enrolled in "${enr.course.title}" (Status: ${enr.status})`,
                timestamp: enr.createdAt,
                actor: student.name,
            });
        });
        // Map Quiz Submissions
        quizResults.forEach((q) => {
            activities.push({
                id: `quiz-${q.id}`,
                type: 'QUIZ_SUBMISSION',
                title: 'Quiz Assessment Completed',
                description: `Completed "${q.quiz.title}" with score ${q.score}% (${q.passed ? 'PASSED' : 'FAILED'})`,
                timestamp: q.createdAt,
                actor: student.name,
            });
        });
        // Map Certificates
        certificates.forEach((cert) => {
            activities.push({
                id: `cert-${cert.id}`,
                type: 'CERTIFICATE_ISSUED',
                title: 'Certificate Awarded',
                description: `Earned Certificate #${cert.certificateNumber} for "${cert.courseTitle}"`,
                timestamp: cert.createdAt,
                actor: 'Scalora Certification Engine',
            });
        });
        // Sort newest first
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        res.json({
            success: true,
            activities,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching student activity' });
    }
};
exports.getStudentActivity = getStudentActivity;
const getPlatformSettings = async (_req, res) => {
    res.json({
        success: true,
        settings: {
            platformName: 'Scalora LMS',
            brandColorNavy: '#082B5B',
            brandColorBlue: '#2D8CFF',
            allowRegistration: true,
            defaultCurrency: 'USD',
            supportedCurrencies: ['USD', 'EGP', 'EUR'],
            databaseEngine: 'PostgreSQL (Prisma ORM)',
            paymentGateways: {
                mock: { enabled: true, mode: 'sandbox' },
                stripe: { enabled: true, testKeyConfigured: true },
                paymob: { enabled: true, integrationConfigured: true },
            },
            systemVersion: '2.5.0 (PostgreSQL Enterprise)',
        },
    });
};
exports.getPlatformSettings = getPlatformSettings;
