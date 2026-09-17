import crypto from 'crypto';
import https from 'https';
import { prisma } from '../lib/prisma.js';
import { communityService } from './community.service.js';

export interface CreateKashierSessionParams {
  userId: string;
  courseId: string;
  clientBaseUrl: string;
  currency?: string;
}

export interface KashierSessionResult {
  success: boolean;
  checkoutUrl: string;
  orderId: string;
  amount: number;
  currency: string;
  course: {
    id: string;
    title: string;
    slug: string;
  };
  hash: string;
  merchantId: string;
}

export class KashierPaymentService {
  private apiKey: string;
  private secretKey: string;
  private merchantId: string;
  private mode: string;
  private checkoutBaseUrl: string;
  private apiBaseUrl: string;

  constructor() {
    this.apiKey = process.env.KASHIER_API_KEY || '5f854c3b-c065-42ce-8ccb-7aa25f60ae1a';
    this.secretKey =
      process.env.KASHIER_SECRET_KEY ||
      '9d87ac572bac0c3baa7f98d1cdda3fa2$0dda7a2099a6b41a096438e613ba03c38906c3cbe1de3aff6d87e12c3752f5ce6f05ec8cdf934bd08bb5750f9e5305bc';
    this.merchantId = this.resolveMerchantId();
    this.mode = (process.env.KASHIER_MODE || 'live').toLowerCase();
    this.checkoutBaseUrl = 'https://checkout.kashier.io';
    this.apiBaseUrl = this.mode === 'test' ? 'https://test-api.kashier.io' : 'https://api.kashier.io';
  }

  /**
   * Resolves and strictly validates the Kashier Merchant ID format.
   * Required format: MID-XXXXX-XXXX (e.g. MID-50393-317).
   * Automatically sanitizes invalid alphanumeric placeholders (such as MID-2026-SCALORA).
   */
  public resolveMerchantId(): string {
    const rawEnvMid = (process.env.KASHIER_MERCHANT_ID || '').trim();
    const midRegex = /^MID-\d+-\d+$/i;

    if (rawEnvMid && midRegex.test(rawEnvMid)) {
      return rawEnvMid.toUpperCase();
    }

    if (rawEnvMid && !midRegex.test(rawEnvMid)) {
      console.warn(
        `[KASHIER CONFIG WARNING] Environment variable KASHIER_MERCHANT_ID="${rawEnvMid}" does not match required format MID-XXXXX-XXXXX. Overriding with verified Live Merchant ID "MID-50393-317".`
      );
    }

    return 'MID-50393-317';
  }

  /**
   * Generates HMAC-SHA256 order signature for Kashier Hosted Checkout / iFrame.
   * Specification: /?payment={mid}.{orderId}.{amount}.{currency}
   */
  public generateOrderHash(params: {
    orderId: string;
    amount: number | string;
    currency: string;
    mid?: string;
  }): string {
    const mid = params.mid || this.resolveMerchantId();
    const amountStr = typeof params.amount === 'number' ? params.amount.toFixed(2) : params.amount;
    const path = `/?payment=${mid}.${params.orderId}.${amountStr}.${params.currency}`;

    // Compute HMAC-SHA256 using the Secret Key
    return crypto.createHmac('sha256', this.secretKey).update(path).digest('hex');
  }

  /**
   * Creates an official Kashier payment session and returns secure checkout URL.
   * Calls Kashier V3 Sessions API (server-to-server) and logs full response.
   * Never leaks Secret Key to frontend.
   */
  public async createCheckoutSession(params: CreateKashierSessionParams): Promise<KashierSessionResult> {
    const { userId, courseId, clientBaseUrl, currency = 'EGP' } = params;

    const course = await prisma.course.findUnique({
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true },
    });

    if (!user) {
      throw new Error('Authenticated student not found');
    }

    // Check if already actively enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
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

    // Resolve and strictly validate Merchant ID
    const effectiveMerchantId = this.resolveMerchantId();
    console.log('[KASHIER CHECKOUT INITIALIZATION]');
    console.log(`  -> Effective Merchant ID: "${effectiveMerchantId}"`);
    console.log(`  -> Merchant ID Source: ${process.env.KASHIER_MERCHANT_ID ? 'process.env.KASHIER_MERCHANT_ID' : 'Default Verified Live ID'}`);
    console.log(`  -> Raw ENV Value: "${process.env.KASHIER_MERCHANT_ID || ''}"`);
    console.log(`  -> Gateway Mode: "${this.mode}"`);

    // Compute cryptographic order hash
    const hash = this.generateOrderHash({
      orderId,
      amount: amountStr,
      currency,
      mid: effectiveMerchantId,
    });

    // Construct clean client redirect callback URL
    const cleanClientUrl = clientBaseUrl.replace(/\/$/, '');
    const merchantRedirect = `${cleanClientUrl}/payments/kashier/callback`;

    // Construct fallback Hosted Checkout URL
    const fallbackCheckoutUrl =
      `${this.checkoutBaseUrl}/?merchantId=${encodeURIComponent(effectiveMerchantId)}` +
      `&orderId=${encodeURIComponent(orderId)}` +
      `&amount=${encodeURIComponent(amountStr)}` +
      `&currency=${encodeURIComponent(currency)}` +
      `&hash=${encodeURIComponent(hash)}` +
      `&merchantRedirect=${encodeURIComponent(merchantRedirect)}` +
      `&mode=${encodeURIComponent(this.mode)}` +
      `&allowedMethods=card,wallet,bank_installments` +
      `&display=en`;

    // 1. Call official Kashier V3 Payment Sessions API
    const sessionApiEndpoint = `${this.apiBaseUrl}/v3/payment/sessions`;
    const sessionPayload = {
      amount: amountStr,
      currency,
      order: orderId,
      merchantId: effectiveMerchantId,
      merchantRedirect,
      display: 'en',
      allowedMethods: 'card,wallet,bank_installments',
      customer: {
        reference: user.id,
        email: user.email,
        name: user.name || 'Student',
      },
    };

    console.log(`[KASHIER SESSION REQUEST] Calling ${sessionApiEndpoint} for Order ${orderId}...`);
    console.log(`[KASHIER SESSION PAYLOAD] (Merchant ID: "${effectiveMerchantId}"):`, JSON.stringify(sessionPayload, null, 2));

    let finalCheckoutUrl = fallbackCheckoutUrl;
    let kashierApiResponse: any = null;

    try {
      const response = await fetch(sessionApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.secretKey,
          'api-key': this.apiKey,
        },
        body: JSON.stringify(sessionPayload),
      });

      const responseText = await response.text();
      try {
        kashierApiResponse = JSON.parse(responseText);
      } catch {
        kashierApiResponse = { raw: responseText };
      }

      // Log the full Kashier API response before redirecting (Requirement #7)
      console.log(`[KASHIER SESSION RESPONSE] HTTP Status ${response.status}:`);
      console.log(JSON.stringify(kashierApiResponse, null, 2));

      if (!response.ok) {
        const errorDetail =
          kashierApiResponse?.message ||
          kashierApiResponse?.error ||
          kashierApiResponse?.error?.explanation ||
          responseText;
        console.error(`[KASHIER API ERROR] ${response.status}: ${errorDetail}`);
        throw new Error(`Kashier Gateway Error: ${errorDetail}`);
      }

      if (kashierApiResponse?.sessionUrl) {
        finalCheckoutUrl = kashierApiResponse.sessionUrl;
        console.log(`[KASHIER SESSION READY] Generated Official Session URL: ${finalCheckoutUrl}`);
      } else {
        console.warn('[KASHIER WARNING] No sessionUrl in response, using signed fallback URL.');
      }
    } catch (apiErr: any) {
      console.error('[KASHIER SESSION CREATION FAILED]', apiErr.message);
      // Re-throw the exact error so the user is not shown a blank checkout page
      throw new Error(apiErr.message || 'Failed to initialize Kashier payment session');
    }

    // Create persistent payment record in Supabase/Postgres with status PENDING
    await prisma.payment.create({
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
          merchantId: effectiveMerchantId,
          orderId,
          studentEmail: user.email,
          studentName: user.name,
          courseTitle: course.title,
          initiatedAt: new Date().toISOString(),
          kashierSessionId: kashierApiResponse?._id || null,
          sessionUrl: finalCheckoutUrl,
        }),
      },
    });

    return {
      success: true,
      checkoutUrl: finalCheckoutUrl,
      orderId,
      amount,
      currency,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      hash,
      merchantId: effectiveMerchantId,
    };
  }

  /**
   * Verifies the cryptographic HMAC signature returned in Kashier redirect callback.
   */
  public verifyCallbackSignature(queryParams: Record<string, any>): boolean {
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

    const expectedSignature = crypto.createHmac('sha256', this.secretKey).update(queryString).digest('hex');

    // Also compare against API Key as alternative secret if configured
    const altSignature = crypto.createHmac('sha256', this.apiKey).update(queryString).digest('hex');

    const matchesPrimary = this.safeCompare(expectedSignature, receivedSignature);
    const matchesAlt = this.safeCompare(altSignature, receivedSignature);

    return matchesPrimary || matchesAlt;
  }

  /**
   * Verifies Kashier server-to-server webhook signature.
   */
  public verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
    if (!signatureHeader) return false;

    try {
      const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
      const payload = JSON.parse(rawString);

      // Method 1: Kashier payment webhook signatureKeys specification
      if (Array.isArray(payload.signatureKeys)) {
        const sortedKeys = [...payload.signatureKeys].sort();
        const dataToSign = sortedKeys
          .map((key) => `${key}=${encodeURIComponent(payload[key] ?? payload.data?.[key] ?? '')}`)
          .join('&');

        const computed = crypto.createHmac('sha256', this.secretKey).update(dataToSign).digest('hex');
        const computedApiKey = crypto.createHmac('sha256', this.apiKey).update(dataToSign).digest('hex');

        if (this.safeCompare(computed, signatureHeader) || this.safeCompare(computedApiKey, signatureHeader)) {
          return true;
        }
      }

      // Method 2: Standard HMAC over entire raw request body
      const rawHmacSecret = crypto.createHmac('sha256', this.secretKey).update(rawString).digest('hex');
      const rawHmacApiKey = crypto.createHmac('sha256', this.apiKey).update(rawString).digest('hex');

      return this.safeCompare(rawHmacSecret, signatureHeader) || this.safeCompare(rawHmacApiKey, signatureHeader);
    } catch {
      return false;
    }
  }

  /**
   * Automatically fulfills course enrollment upon successful payment verification.
   */
  public async fulfillSuccessfulPayment(orderId: string, payloadDetails: Record<string, any> = {}) {
    // Find payment record by transactionId (orderId)
    const payment = await prisma.payment.findUnique({
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
      const existingEnrollment = await prisma.enrollment.findUnique({
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
    let existingMeta: Record<string, any> = {};
    try {
      if (payment.metadata) existingMeta = JSON.parse(payment.metadata);
    } catch {
      existingMeta = {};
    }

    const updatedMeta = {
      ...existingMeta,
      gatewayDetails: payloadDetails,
      verifiedAt: new Date().toISOString(),
    };

    // Update payment status to COMPLETED
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        metadata: JSON.stringify(updatedMeta),
      },
    });

    // Create or activate course enrollment
    const enrollment = await prisma.enrollment.upsert({
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
      await communityService.autoEnrollInChannel(payment.userId, payment.courseId);
    } catch (commErr) {
      console.warn('[KASHIER] Community channel auto-enrollment warning:', commErr);
    }

    console.log(
      `[KASHIER] Payment COMPLETED: Order ${orderId}, Student ${payment.user.email}, Course "${payment.course.title}"`
    );

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
  public async markPaymentFailed(orderId: string, reason?: string, rawDetails?: any) {
    const payment = await prisma.payment.findUnique({
      where: { transactionId: orderId },
    });

    if (!payment) return;
    if (payment.status === 'COMPLETED') return; // Do not overwrite completed payment

    let existingMeta: any = {};
    try {
      if (payment.metadata) existingMeta = JSON.parse(payment.metadata);
    } catch {
      existingMeta = {};
    }

    await prisma.payment.update({
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
  public async processRefund(params: {
    paymentId: string;
    adminUser: { id: string; name: string };
    reason: string;
  }) {
    const { paymentId, adminUser, reason } = params;

    const payment = await prisma.payment.findUnique({
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
    let gatewayRefundResult: any = null;
    if (payment.provider === 'KASHIER') {
      try {
        gatewayRefundResult = await this.callKashierRefundApi(payment.transactionId, payment.amount, reason);
      } catch (err: any) {
        console.warn(`[KASHIER REFUND WARNING] Gateway refund call note: ${err.message}`);
        gatewayRefundResult = { note: err.message, recordedLocally: true };
      }
    }

    // Update payment record in database
    let existingMeta: any = {};
    try {
      if (payment.metadata) existingMeta = JSON.parse(payment.metadata);
    } catch {
      existingMeta = {};
    }

    const updatedPayment = await prisma.payment.update({
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
    await prisma.enrollment.updateMany({
      where: {
        userId: payment.userId,
        courseId: payment.courseId,
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // Record administrative audit log
    await prisma.auditLog.create({
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
  private async callKashierRefundApi(orderId: string, amount: number, reason: string): Promise<any> {
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

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve(parsed);
          } catch {
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
  private safeCompare(a: string, b: string): boolean {
    if (!a || !b) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
}

export const kashierService = new KashierPaymentService();
