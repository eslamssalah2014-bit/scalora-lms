"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentGateways = exports.deletePaymentRequest = exports.rejectPaymentRequest = exports.approvePaymentRequest = exports.getPaymentRequestById = exports.getAdminPaymentRequests = exports.submitInstaPayPayment = exports.checkout = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const payment_service_js_1 = require("../services/payment.service.js");
const checkoutSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1, 'Course ID is required'),
    provider: zod_1.z.enum(['MOCK', 'STRIPE', 'PAYMOB', 'INSTAPAY']).optional().default('MOCK'),
});
const instapaySubmitSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1, 'Course ID is required'),
    referenceNumber: zod_1.z.string().min(3, 'InstaPay reference number is required'),
    screenshotUrl: zod_1.z.string().min(10, 'Payment proof screenshot is required'),
    notes: zod_1.z.string().optional().or(zod_1.z.literal('')),
    fullName: zod_1.z.string().optional().or(zod_1.z.literal('')),
    email: zod_1.z.string().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
const checkout = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { courseId, provider } = checkoutSchema.parse(req.body);
        const result = await payment_service_js_1.paymentService.checkoutAndEnroll({
            userId,
            courseId,
            providerName: provider,
        });
        res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(400).json({ success: false, message: error.message || 'Payment processing failed' });
    }
};
exports.checkout = checkout;
const submitInstaPayPayment = async (req, res) => {
    try {
        const { courseId, referenceNumber, screenshotUrl, notes, fullName, email, phone } = instapaySubmitSchema.parse(req.body);
        const course = await prisma_js_1.prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, title: true, price: true, slug: true },
        });
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const loggedInUser = req.user;
        const customerName = loggedInUser?.name || fullName?.trim() || 'Prospective Student';
        const customerEmail = loggedInUser?.email || email?.trim().toLowerCase() || `student-${referenceNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@scalora.com`;
        const customerPhone = phone?.trim() || null;
        let combinedNotes = notes ? notes.trim() : '';
        // Create the Payment Request with status PENDING (user account will be created when approved by Admin)
        const paymentRequest = await prisma_js_1.prisma.paymentRequest.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error submitting InstaPay payment request' });
    }
};
exports.submitInstaPayPayment = submitInstaPayPayment;
const getAdminPaymentRequests = async (req, res) => {
    try {
        const { status, search, page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;
        const where = {};
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
            prisma_js_1.prisma.paymentRequest.findMany({
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
            prisma_js_1.prisma.paymentRequest.count({ where }),
            prisma_js_1.prisma.paymentRequest.findMany({
                select: { status: true, amount: true },
            }),
        ]);
        let pendingReview = 0;
        let approved = 0;
        let rejected = 0;
        let totalRevenue = 0;
        for (const r of allSummary) {
            if (r.status === 'PENDING')
                pendingReview++;
            else if (r.status === 'APPROVED') {
                approved++;
                totalRevenue += r.amount;
            }
            else if (r.status === 'REJECTED') {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching payment requests' });
    }
};
exports.getAdminPaymentRequests = getAdminPaymentRequests;
const getPaymentRequestById = async (req, res) => {
    try {
        const id = req.params.id;
        const request = await prisma_js_1.prisma.paymentRequest.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching payment request' });
    }
};
exports.getPaymentRequestById = getPaymentRequestById;
const approvePaymentRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const { adminNotes } = req.body;
        const adminName = req.user?.name || 'Administrator';
        const paymentRequest = await prisma_js_1.prisma.paymentRequest.findUnique({
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
        let user = await prisma_js_1.prisma.user.findUnique({
            where: { email: customerEmail },
        });
        if (!user) {
            const tempPassword = await bcryptjs_1.default.hash(crypto_1.default.randomBytes(24).toString('hex'), 10);
            user = await prisma_js_1.prisma.user.create({
                data: {
                    name: customerName,
                    email: customerEmail,
                    password: tempPassword,
                    role: 'STUDENT',
                },
            });
        }
        // 2. Generate 24-Hour Password Setup Token
        const setupToken = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await prisma_js_1.prisma.passwordSetupToken.create({
            data: {
                userId: user.id,
                token: setupToken,
                expiresAt,
            },
        });
        // 3. Create completed Payment record
        const payment = await prisma_js_1.prisma.payment.create({
            data: {
                userId: user.id,
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
                    setupTokenGenerated: true,
                }),
            },
        });
        // 4. Create or activate Enrollment
        const enrollment = await prisma_js_1.prisma.enrollment.upsert({
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
        // 5. Update PaymentRequest to APPROVED
        const updated = await prisma_js_1.prisma.paymentRequest.update({
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
            const matchingLead = await prisma_js_1.prisma.lead.findFirst({
                where: { email: customerEmail },
            });
            if (matchingLead) {
                let act = [];
                try {
                    act = matchingLead.activityLog ? JSON.parse(matchingLead.activityLog) : [];
                }
                catch {
                    act = [];
                }
                act.unshift({
                    id: `act_${Date.now()}`,
                    type: 'PAYMENT_VERIFIED_WON',
                    description: `InstaPay payment approved for course "${paymentRequest.course.title}". Status updated to WON.`,
                    actorName: adminName,
                    createdAt: new Date().toISOString(),
                });
                await prisma_js_1.prisma.lead.update({
                    where: { id: matchingLead.id },
                    data: {
                        status: 'WON',
                        activityLog: JSON.stringify(act),
                    },
                });
            }
        }
        catch {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error approving payment request' });
    }
};
exports.approvePaymentRequest = approvePaymentRequest;
const rejectPaymentRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const { rejectionReason, adminNotes } = req.body;
        const adminName = req.user?.name || 'Administrator';
        const paymentRequest = await prisma_js_1.prisma.paymentRequest.findUnique({ where: { id } });
        if (!paymentRequest) {
            res.status(404).json({ success: false, message: 'Payment verification request not found' });
            return;
        }
        const updated = await prisma_js_1.prisma.paymentRequest.update({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error rejecting payment request' });
    }
};
exports.rejectPaymentRequest = rejectPaymentRequest;
const deletePaymentRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_js_1.prisma.paymentRequest.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Payment request not found' });
            return;
        }
        await prisma_js_1.prisma.paymentRequest.delete({ where: { id } });
        res.json({ success: true, message: 'Payment request record deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting payment request' });
    }
};
exports.deletePaymentRequest = deletePaymentRequest;
const getPaymentGateways = async (_req, res) => {
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
exports.getPaymentGateways = getPaymentGateways;
