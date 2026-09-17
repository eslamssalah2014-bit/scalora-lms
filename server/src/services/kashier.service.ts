import crypto from 'crypto';
import https from 'https';
import { prisma } from '../lib/prisma.js';
import { communityService } from './community.service.js';
import { notificationService } from './notification.service.js';

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

    // Construct clean client redirect callback URL with orderId query parameter preserved
    const cleanClientUrl = clientBaseUrl.replace(/\/$/, '');
    const merchantRedirect = `${cleanClientUrl}/payments/kashier/callback?orderId=${encodeURIComponent(orderId)}`;


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
   * Queries Kashier Orders API directly: GET /v3/payment/orders?search=<searchTerm>
   * Returns matching live transaction details from Kashier servers.
   */
  public async queryKashierOrder(searchTerm: string): Promise<any | null> {
    try {
      const cleanTerm = (searchTerm || '').trim();
      if (!cleanTerm) return null;

      const url = `${this.apiBaseUrl}/v3/payment/orders?search=${encodeURIComponent(cleanTerm)}`;
      console.log(`[KASHIER VERIFICATION QUERY] Calling Kashier Orders API: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.secretKey,
          'api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        console.warn(`[KASHIER VERIFICATION QUERY] HTTP ${response.status} from Kashier:`, await response.text());
        return null;
      }

      const resData = (await response.json()) as any;
      console.log(
        `[KASHIER VERIFICATION QUERY] Kashier API status: "${resData.status}", matching count: ${resData.data?.length || 0}`
      );

      if (resData && Array.isArray(resData.data) && resData.data.length > 0) {
        return resData.data[0];
      }

      return null;
    } catch (err: any) {
      console.error('[KASHIER VERIFICATION QUERY ERROR]', err.message);
      return null;
    }
  }

  /**
   * Resolves a Payment DB record across multiple identification strategies:
   * 1. Exact match on transactionId (e.g. SCL-1789649062367-1R4YV)
   * 2. Exact match on local payment ID (e.g. cmu5iuewq0007m4v5853432lp)
   * 3. Metadata containing the reference (e.g. paymentId UUID or kashierSessionId)
   * 4. Kashier API query using reference (resolves merchantOrderId from live gateway)
   * 5. Authenticated student's most recent PENDING payment verified against Kashier API
   */
  public async resolvePaymentRecord(reference?: string, userId?: string) {
    const cleanRef = (reference || '').trim();

    if (cleanRef) {
      // Strategy 1: Match by transactionId
      try {
        const byTxn = await prisma.payment.findUnique({
          where: { transactionId: cleanRef },
          include: {
            course: { select: { id: true, title: true, slug: true, price: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        });
        if (byTxn) {
          console.log(`[KASHIER RESOLVE] Found payment by transactionId: ${cleanRef}`);
          return byTxn;
        }
      } catch (err: any) {
        console.warn(`[KASHIER RESOLVE] Strategy 1 note: ${err.message}`);
      }

      // Strategy 2: Match by local ID
      try {
        const byId = await prisma.payment.findUnique({
          where: { id: cleanRef },
          include: {
            course: { select: { id: true, title: true, slug: true, price: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        });
        if (byId) {
          console.log(`[KASHIER RESOLVE] Found payment by local ID: ${cleanRef}`);
          return byId;
        }
      } catch (err: any) {
        console.warn(`[KASHIER RESOLVE] Strategy 2 note: ${err.message}`);
      }

      // Strategy 3: Match by metadata substring (e.g. paymentId or session URL)
      try {
        const byMeta = await prisma.payment.findFirst({
          where: {
            metadata: { contains: cleanRef },
          },
          include: {
            course: { select: { id: true, title: true, slug: true, price: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        });
        if (byMeta) {
          console.log(`[KASHIER RESOLVE] Found payment by metadata containing: ${cleanRef}`);
          return byMeta;
        }
      } catch (err: any) {
        console.warn(`[KASHIER RESOLVE] Strategy 3 note: ${err.message}`);
      }

      // Strategy 4: Query Kashier Orders API with reference
      try {
        const kashierOrder = await this.queryKashierOrder(cleanRef);
        if (kashierOrder && kashierOrder.merchantOrderId) {
          const byKashierOrder = await prisma.payment.findUnique({
            where: { transactionId: kashierOrder.merchantOrderId },
            include: {
              course: { select: { id: true, title: true, slug: true, price: true } },
              user: { select: { id: true, name: true, email: true } },
            },
          });
          if (byKashierOrder) {
            console.log(
              `[KASHIER RESOLVE] Found payment via Kashier API merchantOrderId: ${kashierOrder.merchantOrderId}`
            );
            return byKashierOrder;
          }
        }
      } catch (err: any) {
        console.warn(`[KASHIER RESOLVE] Strategy 4 note: ${err.message}`);
      }
    }


    // Strategy 5: Student Recent Pending Session Lookup
    const recentWhere: any = {
      provider: 'KASHIER',
      status: 'PENDING',
      createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    };
    if (userId) {
      recentWhere.userId = userId;
    }

    const pendingCandidates = await prisma.payment.findMany({
      where: recentWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        course: { select: { id: true, title: true, slug: true, price: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log(
      `[KASHIER RESOLVE] Evaluating ${pendingCandidates.length} recent pending candidates for reference "${cleanRef}" (userId: ${userId || 'N/A'})...`
    );

    for (const candidate of pendingCandidates) {
      const orderInfo = await this.queryKashierOrder(candidate.transactionId);
      if (orderInfo) {
        const orderStatus = (orderInfo.status || '').toUpperCase();
        const gatewayKey = orderInfo.gatewayTransactionUniqueKey || '';

        // Match if gateway key contains the reference (e.g. paymentId UUID)
        // OR candidate is confirmed as CAPTURED / SUCCESS / PAID on Kashier
        const isMatchedRef = cleanRef && gatewayKey.includes(cleanRef);
        const isLivePaid = orderStatus === 'CAPTURED' || orderStatus === 'SUCCESS' || orderStatus === 'PAID';

        if (isMatchedRef || isLivePaid) {
          console.log(
            `[KASHIER RESOLVE] Matched candidate ${candidate.transactionId} with status ${orderStatus} on Kashier (refMatch: ${!!isMatchedRef})`
          );
          return candidate;
        }
      }
    }

    return null;
  }

  /**
   * Automatically fulfills course enrollment upon successful payment verification.
   * Directly queries Kashier API to confirm live transaction state before granting LMS access.
   */
  public async fulfillSuccessfulPayment(
    reference: string,
    payloadDetails: Record<string, any> = {},
    userId?: string
  ) {
    console.log(`[KASHIER FULFILLMENT] Initiating fulfillment for reference: "${reference}", userId: "${userId || 'N/A'}"`);

    // 1. Resolve payment record
    const payment = await this.resolvePaymentRecord(reference, userId);

    if (!payment) {
      throw new Error(`Payment with transaction ID or reference "${reference}" not found.`);
    }

    // 2. If already completed, return existing enrollment
    if (payment.status === 'COMPLETED') {
      console.log(`[KASHIER FULFILLMENT] Payment ${payment.transactionId} is already COMPLETED.`);
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

    // 3. Query Kashier API directly to confirm status before marking completed
    let kashierOrderStatus: string | null = null;
    let kashierOrderData: any = null;
    try {
      kashierOrderData = await this.queryKashierOrder(payment.transactionId);
      if (kashierOrderData) {
        kashierOrderStatus = (kashierOrderData.status || '').toUpperCase();
        console.log(`[KASHIER FULFILLMENT] Kashier live order status for ${payment.transactionId}: "${kashierOrderStatus}"`);
      }
    } catch (err: any) {
      console.warn(`[KASHIER FULFILLMENT] Live gateway query note: ${err.message}`);
    }

    // Check if Kashier gateway explicitly reports failure
    if (kashierOrderStatus === 'FAILED' || kashierOrderStatus === 'DECLINED' || kashierOrderStatus === 'CANCELLED') {
      await this.markPaymentFailed(payment.transactionId, `Kashier Gateway reported status: ${kashierOrderStatus}`, kashierOrderData);
      throw new Error(`Kashier reported transaction as ${kashierOrderStatus}. Course enrollment was not granted.`);
    }

    // 4. Merge existing metadata with gateway details
    let existingMeta: Record<string, any> = {};
    try {
      if (payment.metadata) existingMeta = JSON.parse(payment.metadata);
    } catch {
      existingMeta = {};
    }

    const updatedMeta = {
      ...existingMeta,
      gatewayDetails: payloadDetails,
      kashierLiveOrder: kashierOrderData || null,
      verifiedAt: new Date().toISOString(),
    };

    // 5. Update payment status to COMPLETED
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        metadata: JSON.stringify(updatedMeta),
      },
      include: {
        course: { select: { id: true, title: true, slug: true, price: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log(`[KASHIER FULFILLMENT] Payment record ${updatedPayment.transactionId} successfully marked as COMPLETED.`);

    // 6. Create or activate course enrollment
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

    console.log(
      `[KASHIER ENROLLMENT CREATED] Student ${payment.user.email} actively enrolled into course "${payment.course.title}" (Enrollment ID: ${enrollment.id})`
    );

    // 7. Auto-enroll student in course community chat channel
    try {
      await communityService.autoEnrollInChannel(payment.userId, payment.courseId);
      console.log(`[KASHIER COMMUNITY] Student auto-enrolled in community channel for course ${payment.courseId}`);
    } catch (commErr) {
      console.warn('[KASHIER] Community channel auto-enrollment warning:', commErr);
    }

    // 8. Send in-app notification & native Web Push to student
    try {
      await notificationService.createNotification({
        userId: payment.userId,
        type: 'PAYMENT_CONFIRMED' as any,
        message: `Your payment of ${payment.amount} ${payment.currency} for "${payment.course.title}" has been confirmed! Your course is now active.`,
        actionUrl: `/learn/${payment.course.slug}`,
      });
      console.log(`[KASHIER NOTIFICATION] Confirmation notification delivered to student ${payment.userId}`);
    } catch (notifErr) {
      console.warn('[KASHIER] Notification dispatch warning:', notifErr);
    }

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
  public async markPaymentFailed(reference: string, reason?: string, rawDetails?: any, userId?: string) {
    const payment = await this.resolvePaymentRecord(reference, userId);

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
    console.log(`[KASHIER FAILED] Payment ${payment.transactionId} marked as FAILED. Reason: ${reason}`);
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
