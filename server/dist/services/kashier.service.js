"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kashierService = exports.KashierPaymentService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const https_1 = __importDefault(require("https"));
const prisma_js_1 = require("../lib/prisma.js");
const community_service_js_1 = require("./community.service.js");
class KashierPaymentService {
    apiKey;
    secretKey;
    merchantId;
    mode;
    checkoutBaseUrl;
    apiBaseUrl;
    constructor() {
        this.apiKey = process.env.KASHIER_API_KEY || '5f854c3b-c065-42ce-8ccb-7aa25f60ae1a';
        this.secretKey =
            process.env.KASHIER_SECRET_KEY ||
                '9d87ac572bac0c3baa7f98d1cdda3fa2$0dda7a2099a6b41a096438e613ba03c38906c3cbe1de3aff6d87e12c3752f5ce6f05ec8cdf934bd08bb5750f9e5305bc';
        this.merchantId = process.env.KASHIER_MERCHANT_ID || 'MID-2026-SCALORA';
        this.mode = (process.env.KASHIER_MODE || 'live').toLowerCase();
        this.checkoutBaseUrl = 'https://checkout.kashier.io';
        this.apiBaseUrl = 'https://api.kashier.io';
    }
    /**
     * Generates HMAC-SHA256 order signature for Kashier Hosted Checkout / iFrame.
     * Specification: /?payment={mid}.{orderId}.{amount}.{currency}
     */
    generateOrderHash(params) {
        const mid = params.mid || this.merchantId;
        const amountStr = typeof params.amount === 'number' ? params.amount.toFixed(2) : params.amount;
        const path = `/?payment=${mid}.${params.orderId}.${amountStr}.${params.currency}`;
        // Compute HMAC-SHA256 using the Secret Key
        return crypto_1.default.createHmac('sha256', this.secretKey).update(path).digest('hex');
    }
    /**
     * Creates an official Kashier payment session and returns secure checkout URL.
     * Never leaks Secret Key to frontend.
     */
    async createCheckoutSession(params) {
        const { userId, courseId, clientBaseUrl, currency = 'EGP' } = params;
        const course = await prisma_js_1.prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, title: true, price: true, slug: true, isComingSoon: true },
        });
        if (!course) {
            throw new Error('Course not found');
        }
        if (course.isComingSoon) {
            throw new Error('This course is currently marked as Coming Soon and is not open for purchase.');
        }
        // Verify user
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, phone: true },
        });
        if (!user) {
            throw new Error('Authenticated student not found');
        }
        // Check if already actively enrolled
        const existingEnrollment = await prisma_js_1.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            include: { course: true },
        });
        if (existingEnrollment && existingEnrollment.status === 'ACTIVE') {
            throw new Error('You are already enrolled in this course.');
        }
        // Generate unique, collision-resistant Kashier order ID
        const timestamp = Date.now();
        const randSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const orderId = `SCL-${timestamp}-${randSuffix}`;
        const amount = Number(course.price);
        const amountStr = amount.toFixed(2);
        // Compute cryptographic order hash
        const hash = this.generateOrderHash({
            orderId,
            amount: amountStr,
            currency,
            mid: this.merchantId,
        });
        // Create persistent payment record in Supabase/Postgres with status PENDING
        await prisma_js_1.prisma.payment.create({
            data: {
                userId,
                courseId,
                amount,
                currency,
                status: 'PENDING',
                provider: 'KASHIER',
                transactionId: orderId,
                metadata: JSON.stringify({
                    provider: 'KASHIER',
                    mode: this.mode,
                    merchantId: this.merchantId,
                    orderId,
                    studentEmail: user.email,
                    studentName: user.name,
                    courseTitle: course.title,
                    initiatedAt: new Date().toISOString(),
                }),
            },
        });
        // Construct clean client redirect callback URL
        const cleanClientUrl = clientBaseUrl.replace(/\/$/, '');
        const merchantRedirect = `${cleanClientUrl}/payments/kashier/callback`;
        // Construct full Kashier Live Checkout URL
        const checkoutUrl = `${this.checkoutBaseUrl}/?merchantId=${encodeURIComponent(this.merchantId)}` +
            `&orderId=${encodeURIComponent(orderId)}` +
            `&amount=${encodeURIComponent(amountStr)}` +
            `&currency=${encodeURIComponent(currency)}` +
            `&hash=${encodeURIComponent(hash)}` +
            `&merchantRedirect=${encodeURIComponent(merchantRedirect)}` +
            `&mode=${encodeURIComponent(this.mode)}` +
            `&allowedMethods=card,wallet,bank_installments` +
            `&display=en`;
        return {
            success: true,
            checkoutUrl,
            orderId,
            amount,
            currency,
            course: {
                id: course.id,
                title: course.title,
                slug: course.slug,
            },
            hash,
            merchantId: this.merchantId,
        };
    }
    /**
     * Verifies the cryptographic HMAC signature returned in Kashier redirect callback.
     */
    verifyCallbackSignature(queryParams) {
        const receivedSignature = queryParams.signature;
        if (!receivedSignature || typeof receivedSignature !== 'string') {
            return false;
        }
        // Build parameter string excluding signature and mode
        const keys = Object.keys(queryParams).filter((k) => k !== 'signature' && k !== 'mode');
        // Kashier callback concatenation
        let queryString = '';
        for (const key of keys) {
            queryString += `&${key}=${queryParams[key]}`;
        }
        queryString = queryString.replace(/^&/, '');
        const expectedSignature = crypto_1.default.createHmac('sha256', this.secretKey).update(queryString).digest('hex');
        // Also compare against API Key as alternative secret if configured
        const altSignature = crypto_1.default.createHmac('sha256', this.apiKey).update(queryString).digest('hex');
        const matchesPrimary = this.safeCompare(expectedSignature, receivedSignature);
        const matchesAlt = this.safeCompare(altSignature, receivedSignature);
        return matchesPrimary || matchesAlt;
    }
    /**
     * Verifies Kashier server-to-server webhook signature.
     */
    verifyWebhookSignature(rawBody, signatureHeader) {
        if (!signatureHeader)
            return false;
        try {
            const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
            const payload = JSON.parse(rawString);
            // Method 1: Kashier payment webhook signatureKeys specification
            if (Array.isArray(payload.signatureKeys)) {
                const sortedKeys = [...payload.signatureKeys].sort();
                const dataToSign = sortedKeys
                    .map((key) => `${key}=${encodeURIComponent(payload[key] ?? payload.data?.[key] ?? '')}`)
                    .join('&');
                const computed = crypto_1.default.createHmac('sha256', this.secretKey).update(dataToSign).digest('hex');
                const computedApiKey = crypto_1.default.createHmac('sha256', this.apiKey).update(dataToSign).digest('hex');
                if (this.safeCompare(computed, signatureHeader) || this.safeCompare(computedApiKey, signatureHeader)) {
                    return true;
                }
            }
            // Method 2: Standard HMAC over entire raw request body
            const rawHmacSecret = crypto_1.default.createHmac('sha256', this.secretKey).update(rawString).digest('hex');
            const rawHmacApiKey = crypto_1.default.createHmac('sha256', this.apiKey).update(rawString).digest('hex');
            return this.safeCompare(rawHmacSecret, signatureHeader) || this.safeCompare(rawHmacApiKey, signatureHeader);
        }
        catch {
            return false;
        }
    }
    /**
     * Automatically fulfills course enrollment upon successful payment verification.
     */
    async fulfillSuccessfulPayment(orderId, payloadDetails = {}) {
        // Find payment record by transactionId (orderId)
        const payment = await prisma_js_1.prisma.payment.findUnique({
            where: { transactionId: orderId },
            include: {
                course: { select: { id: true, title: true, slug: true, price: true } },
                user: { select: { id: true, name: true, email: true } },
            },
        });
        if (!payment) {
            throw new Error(`Payment with transaction ID ${orderId} not found`);
        }
        // If already completed, return existing enrollment
        if (payment.status === 'COMPLETED') {
            const existingEnrollment = await prisma_js_1.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: payment.userId,
                        courseId: payment.courseId,
                    },
                },
                include: { course: true },
            });
            return {
                success: true,
                alreadyProcessed: true,
                payment,
                enrollment: existingEnrollment,
                courseSlug: payment.course.slug,
            };
        }
        // Merge existing metadata with new gateway payload
        let existingMeta = {};
        try {
            if (payment.metadata)
                existingMeta = JSON.parse(payment.metadata);
        }
        catch {
            existingMeta = {};
        }
        const updatedMeta = {
            ...existingMeta,
            gatewayDetails: payloadDetails,
            verifiedAt: new Date().toISOString(),
        };
        // Update payment status to COMPLETED
        const updatedPayment = await prisma_js_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                metadata: JSON.stringify(updatedMeta),
            },
        });
        // Create or activate course enrollment
        const enrollment = await prisma_js_1.prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId: payment.userId,
                    courseId: payment.courseId,
                },
            },
            update: {
                status: 'ACTIVE',
                paymentId: updatedPayment.id,
                amount: payment.amount,
            },
            create: {
                userId: payment.userId,
                courseId: payment.courseId,
                status: 'ACTIVE',
                paymentId: updatedPayment.id,
                amount: payment.amount,
            },
            include: {
                course: true,
            },
        });
        // Auto-enroll student in course community chat channel
        try {
            await community_service_js_1.communityService.autoEnrollInChannel(payment.userId, payment.courseId);
        }
        catch (commErr) {
            console.warn('[KASHIER] Community channel auto-enrollment warning:', commErr);
        }
        console.log(`[KASHIER] Payment COMPLETED: Order ${orderId}, Student ${payment.user.email}, Course "${payment.course.title}"`);
        return {
            success: true,
            alreadyProcessed: false,
            payment: updatedPayment,
            enrollment,
            courseSlug: payment.course.slug,
        };
    }
    /**
     * Marks a payment as FAILED/CANCELLED.
     */
    async markPaymentFailed(orderId, reason, rawDetails) {
        const payment = await prisma_js_1.prisma.payment.findUnique({
            where: { transactionId: orderId },
        });
        if (!payment)
            return;
        if (payment.status === 'COMPLETED')
            return; // Do not overwrite completed payment
        let existingMeta = {};
        try {
            if (payment.metadata)
                existingMeta = JSON.parse(payment.metadata);
        }
        catch {
            existingMeta = {};
        }
        await prisma_js_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'FAILED',
                metadata: JSON.stringify({
                    ...existingMeta,
                    failureReason: reason || 'Payment failed or was cancelled by user',
                    rawDetails,
                    failedAt: new Date().toISOString(),
                }),
            },
        });
    }
    /**
     * Processes a refund via Kashier API and updates LMS records.
     */
    async processRefund(params) {
        const { paymentId, adminUser, reason } = params;
        const payment = await prisma_js_1.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                course: { select: { id: true, title: true } },
            },
        });
        if (!payment) {
            throw new Error('Payment record not found');
        }
        if (payment.status === 'REFUNDED') {
            throw new Error('Payment has already been refunded.');
        }
        if (payment.status !== 'COMPLETED') {
            throw new Error(`Cannot refund payment in ${payment.status} status.`);
        }
        // Call Kashier Refund API if provider is KASHIER
        let gatewayRefundResult = null;
        if (payment.provider === 'KASHIER') {
            try {
                gatewayRefundResult = await this.callKashierRefundApi(payment.transactionId, payment.amount, reason);
            }
            catch (err) {
                console.warn(`[KASHIER REFUND WARNING] Gateway refund call note: ${err.message}`);
                gatewayRefundResult = { note: err.message, recordedLocally: true };
            }
        }
        // Update payment record in database
        let existingMeta = {};
        try {
            if (payment.metadata)
                existingMeta = JSON.parse(payment.metadata);
        }
        catch {
            existingMeta = {};
        }
        const updatedPayment = await prisma_js_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'REFUNDED',
                refundReason: reason,
                refundedAt: new Date(),
                metadata: JSON.stringify({
                    ...existingMeta,
                    refund: {
                        reason,
                        refundedBy: adminUser.name,
                        refundedById: adminUser.id,
                        refundedAt: new Date().toISOString(),
                        gatewayResponse: gatewayRefundResult,
                    },
                }),
            },
        });
        // Update enrollment status to CANCELLED upon refund
        await prisma_js_1.prisma.enrollment.updateMany({
            where: {
                userId: payment.userId,
                courseId: payment.courseId,
            },
            data: {
                status: 'CANCELLED',
            },
        });
        // Record administrative audit log
        await prisma_js_1.prisma.auditLog.create({
            data: {
                action: 'PAYMENT_REFUNDED',
                entityType: 'PAYMENT',
                entityId: payment.id,
                userId: adminUser.id,
                newData: JSON.stringify({
                    status: 'REFUNDED',
                    refundReason: reason,
                    amount: payment.amount,
                    student: payment.user.email,
                    course: payment.course.title,
                }),
                metadata: JSON.stringify({
                    adminName: adminUser.name,
                    timestamp: new Date().toISOString(),
                }),
            },
        });
        return updatedPayment;
    }
    /**
     * Helper to invoke Kashier Live Refund endpoint:
     * PUT https://api.kashier.io/v3/orders/:orderId
     */
    async callKashierRefundApi(orderId, amount, reason) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                apiOperation: 'REFUND',
                reason,
                transaction: {
                    amount,
                },
            });
            const options = {
                hostname: 'api.kashier.io',
                port: 443,
                path: `/v3/orders/${encodeURIComponent(orderId)}`,
                method: 'PUT',
                headers: {
                    Authorization: this.secretKey,
                    'api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
            };
            const req = https_1.default.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => (responseBody += chunk));
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseBody);
                        resolve(parsed);
                    }
                    catch {
                        resolve({ raw: responseBody, statusCode: res.statusCode });
                    }
                });
            });
            req.on('error', (err) => reject(err));
            req.setTimeout(10000, () => {
                req.destroy(new Error('Kashier refund API request timed out'));
            });
            req.write(postData);
            req.end();
        });
    }
    /**
     * Timing-safe string comparison to prevent timing attacks on signatures.
     */
    safeCompare(a, b) {
        if (!a || !b)
            return false;
        const bufA = Buffer.from(a);
        const bufB = Buffer.from(b);
        if (bufA.length !== bufB.length)
            return false;
        return crypto_1.default.timingSafeEqual(bufA, bufB);
    }
}
exports.KashierPaymentService = KashierPaymentService;
exports.kashierService = new KashierPaymentService();
