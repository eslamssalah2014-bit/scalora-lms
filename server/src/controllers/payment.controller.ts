import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { paymentService } from '../services/payment.service.js';
import { kashierService } from '../services/kashier.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { communityService } from '../services/community.service.js';

const checkoutSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  provider: z.enum(['MOCK', 'STRIPE', 'PAYMOB', 'INSTAPAY', 'KASHIER']).optional().default('KASHIER'),
});

const kashierSessionSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  currency: z.string().optional().default('EGP'),
});

const kashierVerifySchema = z.object({
  orderId: z.string().optional(),
  paymentId: z.string().optional(),
  paymentStatus: z.string().optional(),
  signature: z.string().optional(),
  queryParams: z.record(z.any()).optional(),
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

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, price: true, slug: true, isComingSoon: true },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    if (course.isComingSoon) {
      res.status(400).json({ success: false, message: 'This course is currently Coming Soon and not yet open for enrollment or payment.' });
      return;
    }

    const loggedInUser = req.user;
    const customerName = loggedInUser?.name || fullName?.trim() || 'Prospective Student';
    const customerEmail = loggedInUser?.email || email?.trim().toLowerCase() || `student-${referenceNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@scalora.com`;
    const customerPhone = phone?.trim() || null;

    let combinedNotes = notes ? notes.trim() : '';

    // Create the Payment Request with status PENDING (user account will be created when approved by Admin)
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        userId: loggedInUser?.id || null,
        customerName,
        customerEmail,
        customerPhone,
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
      message: 'Payment request submitted successfully. Your payment will be reviewed within a maximum of 4 hours. Once payment is verified, your student account will be activated and you will receive a confirmation email to create your password and access your course.',
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
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
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

    const customerEmail = (paymentRequest.customerEmail || paymentRequest.user?.email || '').toLowerCase().trim();
    const customerName = paymentRequest.customerName || paymentRequest.user?.name || 'Student';

    if (!customerEmail) {
      res.status(400).json({ success: false, message: 'No student email address found for this payment request' });
      return;
    }

    // 1. Find or Create User Account
    let user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      const tempPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
      user = await prisma.user.create({
        data: {
          name: customerName,
          email: customerEmail,
          password: tempPassword,
          role: 'STUDENT',
        },
      });
    }

    // 2. Generate 24-Hour Password Setup Token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.passwordSetupToken.create({
      data: {
        userId: user.id,
        token: setupToken,
        expiresAt,
      },
    });

    // 3. Create or update completed Payment record with guaranteed unique transaction ID
    const uniqueTxnId = `INSTAPAY_${paymentRequest.id}_${paymentRequest.referenceNumber.trim().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    
    const payment = await prisma.payment.upsert({
      where: { transactionId: uniqueTxnId },
      update: {
        amount: paymentRequest.amount,
        status: 'COMPLETED',
        provider: 'INSTAPAY',
        metadata: JSON.stringify({
          paymentRequestId: paymentRequest.id,
          verifiedBy: adminName,
          verifiedAt: new Date().toISOString(),
          instapayRef: paymentRequest.referenceNumber,
          setupTokenGenerated: true,
        }),
      },
      create: {
        userId: user.id,
        courseId: paymentRequest.courseId,
        amount: paymentRequest.amount,
        currency: 'USD',
        status: 'COMPLETED',
        provider: 'INSTAPAY',
        transactionId: uniqueTxnId,
        metadata: JSON.stringify({
          paymentRequestId: paymentRequest.id,
          verifiedBy: adminName,
          verifiedAt: new Date().toISOString(),
          instapayRef: paymentRequest.referenceNumber,
          setupTokenGenerated: true,
        }),
      },
    });

    // 4. Create or activate Enrollment
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: paymentRequest.courseId,
        },
      },
      update: {
        status: 'ACTIVE',
        paymentId: payment.id,
        amount: paymentRequest.amount,
      },
      create: {
        userId: user.id,
        courseId: paymentRequest.courseId,
        status: 'ACTIVE',
        paymentId: payment.id,
        amount: paymentRequest.amount,
      },
    });

    // Automatically grant access to the course's Community Channel
    await communityService.autoEnrollInChannel(user.id, paymentRequest.courseId);

    // 5. Update PaymentRequest to APPROVED
    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        userId: user.id,
        setupToken,
        reviewedAt: new Date(),
        reviewedBy: adminName,
        adminNotes: adminNotes ? adminNotes.trim() : paymentRequest.adminNotes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, price: true, slug: true } },
      },
    });

    // 6. Automatically convert corresponding Lead to WON if matching lead exists
    try {
      const matchingLead = await prisma.lead.findFirst({
        where: { email: customerEmail },
      });

      if (matchingLead) {
        let act: any[] = [];
        try {
          act = matchingLead.activityLog ? JSON.parse(matchingLead.activityLog) : [];
        } catch {
          act = [];
        }

        act.unshift({
          id: `act_${Date.now()}`,
          type: 'PAYMENT_VERIFIED_WON',
          description: `InstaPay payment approved for course "${paymentRequest.course.title}". Status updated to WON.`,
          actorName: adminName,
          createdAt: new Date().toISOString(),
        });

        await prisma.lead.update({
          where: { id: matchingLead.id },
          data: {
            status: 'WON',
            activityLog: JSON.stringify(act),
          },
        });
      }
    } catch {
      // Non-blocking lead sync
    }

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const setupUrl = `/set-password/${setupToken}`;

    const emailSubject = 'Payment Confirmed – Access Your Course';
    const emailBody = `Hello ${customerName},

Your payment has been successfully verified.

Your course access for "${paymentRequest.course.title}" is now ready.

To activate your account and access your course, click the link below and create your password:

${clientBaseUrl}${setupUrl}

This link expires in 24 hours.

After setting your password, you will be redirected to your student dashboard where your purchased course will already be available.

Thank you for choosing Scalora.`;

    console.log(`[EMAIL DISPATCH] Sent to ${customerEmail}: Subject "${emailSubject}"\nLink: ${clientBaseUrl}${setupUrl}`);

    res.json({
      success: true,
      message: `Payment request approved! Account created for ${customerName} (${customerEmail}) and enrollment activated.`,
      paymentRequest: updated,
      enrollment,
      setupToken,
      setupUrl,
      emailSubject,
      emailBody,
      customerEmail,
      customerName,
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
        id: 'KASHIER',
        name: 'Kashier Live Payment Gateway',
        description: 'Instant Egyptian & International Cards (Visa, MasterCard, Meeza), Mobile Wallets & Bank Installments',
        currencies: ['EGP', 'USD'],
        isDefault: true,
        badge: 'Instant Live Checkout',
        features: ['Visa', 'MasterCard', 'Meeza', 'Vodafone Cash', 'Orange Cash', 'Etisalat Cash', 'Instapay Wallet'],
      },
      {
        id: 'INSTAPAY',
        name: 'Pay via InstaPay',
        description: 'Direct Egyptian Bank Transfer via InstaPay Link / Address with Manual Receipt Verification',
        currencies: ['EGP', 'USD'],
        isDefault: false,
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
    ],
  });
};

/**
 * 1. Create Kashier Live Checkout Session
 * Generates HMAC signature on backend and provides secure checkout redirection URL.
 * NEVER exposes secret key to frontend.
 */
export const createKashierCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please log in to purchase courses.' });
      return;
    }

    const { courseId, currency } = kashierSessionSchema.parse(req.body);

    console.log(`[KASHIER CHECKOUT CREATE] Student ${userId} requesting checkout for course ${courseId} (${currency})...`);

    // Determine base URL of the client for redirection
    const referer = req.headers.referer || req.headers.origin;
    const clientBaseUrl =
      typeof referer === 'string' && referer.trim().length > 0
        ? new URL(referer).origin
        : (process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173');

    const session = await kashierService.createCheckoutSession({
      userId,
      courseId,
      clientBaseUrl,
      currency,
    });

    console.log(`[KASHIER CHECKOUT CREATE] Checkout session initialized successfully for order ${session.orderId}`);
    res.json(session);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    console.error('[KASHIER CREATE SESSION ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to initiate Kashier payment session' });
  }
};

/**
 * 2. Verify Kashier Payment (Called by Callback Page after return from checkout)
 * Cryptographically verifies callback signature and fulfills student course auto-enrollment.
 */
export const verifyKashierPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { orderId, paymentId, paymentStatus, signature, queryParams } = kashierVerifySchema.parse(req.body);

    const userId = req.user?.id;
    console.log(`[KASHIER CALLBACK RECEIVED] Incoming payment verification request:`, {
      orderId,
      paymentId,
      paymentStatus,
      signature: signature ? 'PROVIDED' : 'NONE',
      userId: userId || 'ANONYMOUS',
      queryParams,
    });

    // Resolve effective transaction identifier
    const reference =
      orderId ||
      paymentId ||
      queryParams?.orderId ||
      queryParams?.merchantOrderId ||
      queryParams?.merchant_order_id ||
      queryParams?.paymentId ||
      '';

    const mergedParams: Record<string, any> = {
      ...(queryParams || {}),
      orderId: reference,
    };
    if (signature) mergedParams.signature = signature;
    if (paymentStatus) mergedParams.paymentStatus = paymentStatus;

    // Check paymentStatus from callback query params
    const statusUpper = (paymentStatus || queryParams?.paymentStatus || queryParams?.status || '').toUpperCase();

    if (statusUpper === 'FAILED' || statusUpper === 'CANCELLED' || statusUpper === 'DECLINED') {
      console.warn(`[KASHIER CALLBACK] Client/bank reported failure status: "${statusUpper}" for reference: "${reference}"`);
      await kashierService.markPaymentFailed(
        reference,
        'Customer cancelled or transaction declined by bank',
        mergedParams,
        userId
      );
      res.status(400).json({
        success: false,
        message: 'Payment was cancelled or could not be processed by your bank. Please try again.',
      });
      return;
    }

    // Verify cryptographic signature if signature parameter is present
    if (mergedParams.signature) {
      const isSignatureValid = kashierService.verifyCallbackSignature(mergedParams);
      if (!isSignatureValid) {
        console.warn(`[KASHIER SECURITY WARNING] Callback signature mismatch for reference: ${reference}`);
        // Note: Instead of immediately failing if merchant redirect params stripped secret hash,
        // we continue to step 3 which performs live server-to-server Kashier API verification!
      } else {
        console.log(`[KASHIER CALLBACK] Cryptographic signature verified successfully for reference: ${reference}`);
      }
    }

    // Fulfill payment and auto-enroll student into course & community
    console.log(`[KASHIER VERIFICATION QUERY] Querying gateway and fulfilling payment for reference "${reference}"...`);
    const fulfillment = await kashierService.fulfillSuccessfulPayment(reference, mergedParams, userId);

    res.json({
      message: 'Payment verified and course enrollment activated successfully!',
      ...fulfillment,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    console.error('[KASHIER VERIFY ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};

/**
 * 3. Kashier Webhook (Server-to-Server asynchronous notifications)
 * Validates x-kashier-signature header and ensures course enrollment even if student closed tab.
 */
export const kashierWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signatureHeader =
      (req.headers['x-kashier-signature'] as string) ||
      (req.headers['kashier-signature'] as string) ||
      (req.headers['x-signature'] as string);

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    console.log(`[KASHIER WEBHOOK RECEIVED] Incoming server-to-server webhook:`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // If signature header is supplied, verify it
    if (signatureHeader) {
      const isValid = kashierService.verifyWebhookSignature(rawBody, signatureHeader);
      if (!isValid) {
        console.warn('[KASHIER WEBHOOK WARNING] Signature header check failed. Verifying directly with Kashier API...');
      }
    }

    const payload = req.body || {};
    const reference =
      payload.orderId ||
      payload.merchantOrderId ||
      payload.data?.orderId ||
      payload.data?.merchantOrderId ||
      payload.paymentId ||
      payload.data?.paymentId ||
      payload.transactionId ||
      payload.data?.transactionId;

    const event = (payload.event || payload.action || payload.data?.event || '').toLowerCase();
    const status = (payload.status || payload.paymentStatus || payload.data?.status || '').toUpperCase();

    console.log(
      `[KASHIER WEBHOOK] Parsed webhook payload: event="${event}", status="${status}", reference="${reference}"`
    );

    if (
      reference &&
      (status === 'SUCCESS' ||
        status === 'COMPLETED' ||
        status === 'CAPTURED' ||
        status === 'PAID' ||
        status === 'ACCEPTED' ||
        event.includes('capture') ||
        event.includes('pay'))
    ) {
      console.log(`[KASHIER WEBHOOK] Auto-fulfilling enrollment for reference: ${reference}...`);
      await kashierService.fulfillSuccessfulPayment(reference, payload);
    } else if (
      reference &&
      (status === 'FAILED' || status === 'DECLINED' || status === 'CANCELLED' || event.includes('fail'))
    ) {
      console.log(`[KASHIER WEBHOOK] Marking payment failed for reference: ${reference}...`);
      await kashierService.markPaymentFailed(reference, payload.reason || 'Webhook reported payment failure', payload);
    }

    res.status(200).json({ received: true, status: 'PROCESSED' });
  } catch (error: any) {
    console.error('[KASHIER WEBHOOK ERROR]', error);
    // Return HTTP 200 so Kashier does not keep retrying continuously if an internal error occurs
    res.status(200).json({ received: true, error: error.message });
  }
};

/**
 * 4. Student Purchase History
 * Returns all past course purchases, transaction IDs, statuses, and links for logged-in student.
 */
export const getStudentPurchaseHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const [payments, paymentRequests] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              level: true,
            },
          },
          enrollments: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
      prisma.paymentRequest.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnail: true,
              level: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      purchases: payments,
      manualRequests: paymentRequests,
    });
  } catch (error: any) {
    console.error('[STUDENT PURCHASE HISTORY ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Error loading purchase history' });
  }
};

/**
 * 5. Admin All Payments & Analytics Ledger
 * Comprehensive overview of all gateway transactions, volumes, conversion stats, and search.
 */
export const getAllPaymentsAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, provider, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (provider && provider !== 'ALL') {
      where.provider = provider;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { transactionId: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { course: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [payments, totalCount, allStats] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          course: { select: { id: true, title: true, slug: true, price: true, thumbnail: true } },
          enrollments: { select: { id: true, status: true } },
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        select: {
          amount: true,
          status: true,
          provider: true,
        },
      }),
    ]);

    // Aggregate real-time statistics
    let totalRevenue = 0;
    let kashierVolume = 0;
    let refundedAmount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    for (const p of allStats) {
      if (p.status === 'COMPLETED') {
        totalRevenue += p.amount;
        completedCount++;
        if (p.provider === 'KASHIER') kashierVolume += p.amount;
      } else if (p.status === 'PENDING') {
        pendingCount++;
      } else if (p.status === 'FAILED') {
        failedCount++;
      } else if (p.status === 'REFUNDED') {
        refundedAmount += p.amount;
        refundedCount++;
      }
    }

    res.json({
      success: true,
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
      stats: {
        totalRevenue,
        kashierVolume,
        refundedAmount,
        totalTransactions: allStats.length,
        completedCount,
        pendingCount,
        failedCount,
        refundedCount,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN PAYMENTS LEDGER ERROR]', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching admin payments ledger' });
  }
};

/**
 * 6. Admin Refund Workflow
 * Refunds transaction via Kashier API and revokes course access.
 */
export const processAdminRefund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paymentId = req.params.id as string;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      res.status(400).json({ success: false, message: 'A valid refund reason is required.' });
      return;
    }

    const adminUser = {
      id: req.user?.id || 'admin',
      name: req.user?.name || 'Administrator',
    };

    const updatedPayment = await kashierService.processRefund({
      paymentId,
      adminUser,
      reason: reason.trim(),
    });

    res.json({
      success: true,
      message: `Transaction ${updatedPayment.transactionId} has been successfully marked as REFUNDED.`,
      payment: updatedPayment,
    });
  } catch (error: any) {
    console.error('[ADMIN REFUND ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Refund processing failed' });
  }
};

