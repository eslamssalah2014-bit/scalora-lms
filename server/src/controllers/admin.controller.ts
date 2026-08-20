import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getDashboardStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [totalCourses, totalStudents, totalEnrollments, allPayments, recentEnrollments, courses] =
      await Promise.all([
        prisma.course.count(),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.enrollment.count(),
        prisma.payment.findMany({
          where: { status: 'COMPLETED' },
          select: { amount: true },
        }),
        prisma.enrollment.findMany({
          take: 6,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
            course: { select: { id: true, title: true, price: true, category: true } },
            payment: { select: { id: true, transactionId: true, provider: true } },
          },
        }),
        prisma.course.findMany({
          include: {
            _count: { select: { enrollments: true, modules: true } },
          },
        }),
      ]);

    const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Calculate category distribution
    const categoryMap: Record<string, number> = {};
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching admin stats' });
  }
};

export const getStudentsList = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            quizResults: true,
            certificates: true,
          },
        },
        enrollments: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    res.json({ success: true, students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching students list' });
  }
};

export const getPlatformSettings = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
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
