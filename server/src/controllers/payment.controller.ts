import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { paymentService } from '../services/payment.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const checkoutSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  provider: z.enum(['MOCK', 'STRIPE', 'PAYMOB', 'INSTAPAY']).optional().default('MOCK'),
});

const instapaySubmitSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  referenceNumber: z.string().min(3, 'InstaPay reference number is required'),
  screenshotUrl: z.string().min(10, 'Payment proof screenshot is required'),
  notes: z.string().optional().or(z.literal('')),
  fullName: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export const checkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { courseId, provider } = checkoutSchema.parse(req.body);

    const result = await paymentService.checkoutAndEnroll({
      userId,
      courseId,
      providerName: provider,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(400).json({ success: false, message: error.message || 'Payment processing failed' });
  }
};

export const submitInstaPayPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId, referenceNumber, screenshotUrl, notes, fullName, email, phone } = instapaySubmitSchema.parse(req.body);

    let userId = req.user?.id;

    if (!userId) {
      const targetEmail = (email && email.trim())
        ? email.trim().toLowerCase()
        : `student-${referenceNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@scalora.com`;
      const targetName = (fullName && fullName.trim()) ? fullName.trim() : 'Prospective Student';

      let user = await prisma.user.findUnique({
        where: { email: targetEmail },
      });

      if (!user) {
        const dummyPassword = await bcrypt.hash(`ScaloraStudent${Math.random().toString(36).substring(2, 8)}!`, 10);
        user = await prisma.user.create({
          data: {
            name: targetName,
            email: targetEmail,
            password: dummyPassword,
            role: 'STUDENT',
          },
        });
      }

      userId = user.id;
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, slug: true },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment && existingEnrollment.status === 'ACTIVE') {
      res.status(400).json({
        success: false,
        alreadyEnrolled: true,
        message: 'You are already enrolled in this course!',
      });
      return;
    }

    let combinedNotes = notes ? notes.trim() : '';
    if (phone && phone.trim()) {
      combinedNotes = combinedNotes ? `Phone: ${phone.trim()} | ${combinedNotes}` : `Phone: ${phone.trim()}`;
    }

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        paymentMethod: 'INSTAPAY',
        referenceNumber: referenceNumber.trim(),
        screenshotUrl,
        notes: combinedNotes || null,
        status: 'PENDING',
      },
      include: {
        course: {
          select: { id: true, title: true, price: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment request submitted successfully. Your payment will be reviewed within a maximum of 4 hours. Once payment is verified, you will be enrolled in the course automatically and will receive a confirmation email.',
      paymentRequest,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error submitting InstaPay payment request' });
  }
};

export const getAdminPaymentRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { referenceNumber: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { course: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [requests, totalCount, allSummary] = await Promise.all([
      prisma.paymentRequest.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          course: {
            select: { id: true, title: true, price: true, slug: true, thumbnail: true },
          },
        },
      }),
      prisma.paymentRequest.count({ where }),
      prisma.paymentRequest.findMany({
        select: { status: true, amount: true },
      }),
    ]);

    let pendingReview = 0;
    let approved = 0;
    let rejected = 0;
    let totalRevenue = 0;

    for (const r of allSummary) {
      if (r.status === 'PENDING') pendingReview++;
      else if (r.status === 'APPROVED') {
        approved++;
        totalRevenue += r.amount;
      } else if (r.status === 'REJECTED') {
        rejected++;
      }
    }

    res.json({
      success: true,
      requests,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      stats: {
        totalRequests: allSummary.length,
        pendingReview,
        approved,
        rejected,
        totalRevenue,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching payment requests' });
  }
};

export const getPaymentRequestById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const request = await prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
        course: { select: { id: true, title: true, price: true, slug: true, thumbnail: true, instructor: true } },
      },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Payment verification request not found' });
      return;
    }

    res.json({ success: true, request });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching payment request' });
  }
};

export const approvePaymentRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { adminNotes } = req.body;
    const adminName = req.user?.name || 'Administrator';

    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
      },
    });

    if (!paymentRequest) {
      res.status(404).json({ success: false, message: 'Payment verification request not found' });
      return;
    }

    if (paymentRequest.status === 'APPROVED') {
      res.status(400).json({ success: false, message: 'This payment request has already been approved' });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId: paymentRequest.userId,
        courseId: paymentRequest.courseId,
        amount: paymentRequest.amount,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'INSTAPAY',
        transactionId: paymentRequest.referenceNumber,
        metadata: JSON.stringify({
          paymentRequestId: paymentRequest.id,
          verifiedBy: adminName,
          verifiedAt: new Date().toISOString(),
          instapayRef: paymentRequest.referenceNumber,
        }),
      },
    });

    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: paymentRequest.userId,
          courseId: paymentRequest.courseId,
        },
      },
      update: {
        status: 'ACTIVE',
        paymentId: payment.id,
        amount: paymentRequest.amount,
      },
      create: {
        userId: paymentRequest.userId,
        courseId: paymentRequest.courseId,
        status: 'ACTIVE',
        paymentId: payment.id,
        amount: paymentRequest.amount,
      },
    });

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: adminName,
        adminNotes: adminNotes ? adminNotes.trim() : paymentRequest.adminNotes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, price: true, slug: true } },
      },
    });

    res.json({
      success: true,
      message: `Payment request approved! ${paymentRequest.user.name} has been enrolled in "${paymentRequest.course.title}".`,
      paymentRequest: updated,
      enrollment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error approving payment request' });
  }
};

export const rejectPaymentRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { rejectionReason, adminNotes } = req.body;
    const adminName = req.user?.name || 'Administrator';

    const paymentRequest = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!paymentRequest) {
      res.status(404).json({ success: false, message: 'Payment verification request not found' });
      return;
    }

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason ? rejectionReason.trim() : 'Receipt could not be verified with InstaPay records',
        adminNotes: adminNotes ? adminNotes.trim() : paymentRequest.adminNotes,
        reviewedAt: new Date(),
        reviewedBy: adminName,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, price: true, slug: true } },
      },
    });

    res.json({
      success: true,
      message: 'Payment request marked as rejected',
      paymentRequest: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error rejecting payment request' });
  }
};

export const deletePaymentRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Payment request not found' });
      return;
    }

    await prisma.paymentRequest.delete({ where: { id } });

    res.json({ success: true, message: 'Payment request record deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting payment request' });
  }
};

export const getPaymentGateways = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    gateways: [
      {
        id: 'INSTAPAY',
        name: 'Pay via InstaPay',
        description: 'Direct Egyptian Bank Transfer via InstaPay Link / Address',
        currencies: ['EGP', 'USD'],
        isDefault: true,
        badge: 'Direct Transfer',
        link: 'https://ipn.eg/S/eslamsalah210/instapay/7yLhab',
        recipient: 'eslamsalah210@instapay',
      },
      {
        id: 'MOCK',
        name: 'Scalora Fast Checkout (Sandbox / Instant)',
        description: 'Instant 1-click test checkout without real charges',
        currencies: ['USD', 'EGP', 'EUR'],
        isDefault: false,
        badge: 'Instant Demo',
      },
      {
        id: 'STRIPE',
        name: 'Stripe Payments',
        description: 'Credit / Debit Cards, Apple Pay, Google Pay',
        currencies: ['USD', 'EUR', 'GBP'],
        isDefault: false,
        badge: 'Global Cards',
      },
      {
        id: 'PAYMOB',
        name: 'Paymob Gateway (Egypt)',
        description: 'Vodafone Cash, Orange, Meeza, Local Debit Cards',
        currencies: ['EGP'],
        isDefault: false,
        badge: 'Local Wallets',
      },
    ],
  });
};
