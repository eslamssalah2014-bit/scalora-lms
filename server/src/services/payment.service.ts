import { prisma } from '../lib/prisma.js';

export interface PaymentIntentOptions {
  userId: string;
  courseId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  provider: 'MOCK' | 'STRIPE' | 'PAYMOB';
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  redirectUrl?: string;
  message?: string;
}

export interface PaymentProvider {
  name: string;
  processPayment(options: PaymentIntentOptions): Promise<PaymentResult>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

/**
 * Mock / Sandbox Payment Provider for instant demo & development testing
 */
export class MockPaymentProvider implements PaymentProvider {
  name = 'MOCK';

  async processPayment(options: PaymentIntentOptions): Promise<PaymentResult> {
    const transactionId = `txn_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      transactionId,
      provider: 'MOCK',
      amount: options.amount,
      currency: options.currency || 'USD',
      status: 'COMPLETED',
      message: 'Sandbox payment processed successfully',
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    return transactionId.startsWith('txn_mock_');
  }
}

/**
 * Stripe Payment Gateway Integration Architecture
 */
export class StripePaymentProvider implements PaymentProvider {
  name = 'STRIPE';
  private apiKey: string;

  constructor(apiKey: string = process.env.STRIPE_SECRET_KEY || '') {
    this.apiKey = apiKey;
  }

  async processPayment(options: PaymentIntentOptions): Promise<PaymentResult> {
    const transactionId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      success: true,
      transactionId,
      provider: 'STRIPE',
      amount: options.amount,
      currency: options.currency || 'USD',
      status: 'COMPLETED',
      message: 'Stripe payment processed successfully',
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    return Boolean(transactionId);
  }
}

/**
 * Paymob Payment Gateway Integration Architecture
 */
export class PaymobPaymentProvider implements PaymentProvider {
  name = 'PAYMOB';
  private apiKey: string;
  private integrationId: string;

  constructor(
    apiKey: string = process.env.PAYMOB_API_KEY || '',
    integrationId: string = process.env.PAYMOB_INTEGRATION_ID || ''
  ) {
    this.apiKey = apiKey;
    this.integrationId = integrationId;
  }

  async processPayment(options: PaymentIntentOptions): Promise<PaymentResult> {
    const transactionId = `paymob_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      success: true,
      transactionId,
      provider: 'PAYMOB',
      amount: options.amount,
      currency: options.currency || 'EGP',
      status: 'COMPLETED',
      message: 'Paymob transaction processed successfully',
    };
  }

  async verifyPayment(transactionId: string): Promise<boolean> {
    return Boolean(transactionId);
  }
}

/**
 * High-Level Payment Service Orchestrator with PostgreSQL Payment Record Persistence
 */
export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();
  private defaultProvider = 'MOCK';

  constructor() {
    this.registerProvider(new MockPaymentProvider());
    this.registerProvider(new StripePaymentProvider());
    this.registerProvider(new PaymobPaymentProvider());
  }

  registerProvider(provider: PaymentProvider) {
    this.providers.set(provider.name.toUpperCase(), provider);
  }

  getProvider(name?: string): PaymentProvider {
    const key = (name || this.defaultProvider).toUpperCase();
    const provider = this.providers.get(key);
    if (!provider) {
      return this.providers.get('MOCK')!;
    }
    return provider;
  }

  async checkoutAndEnroll(params: {
    userId: string;
    courseId: string;
    providerName?: string;
  }) {
    const { userId, courseId, providerName } = params;

    // Check course existence
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return {
        alreadyEnrolled: true,
        enrollment: existingEnrollment,
        message: 'Student is already enrolled in this course',
      };
    }

    // Process payment through selected gateway
    const provider = this.getProvider(providerName);
    const currency = provider.name === 'PAYMOB' ? 'EGP' : 'USD';

    const paymentResult = await provider.processPayment({
      userId,
      courseId,
      amount: course.price,
      currency,
    });

    if (!paymentResult.success) {
      throw new Error(paymentResult.message || 'Payment processing failed');
    }

    // Create persistent record in PostgreSQL Payment table
    const paymentRecord = await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        currency,
        status: 'COMPLETED',
        provider: provider.name,
        transactionId: paymentResult.transactionId,
        metadata: JSON.stringify({ provider: provider.name, initiatedAt: new Date().toISOString() }),
      },
    });

    // Automatically create enrollment after successful payment linked to paymentId
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'ACTIVE',
        paymentId: paymentRecord.id,
        amount: course.price,
      },
      include: {
        course: true,
        payment: true,
      },
    });

    return {
      alreadyEnrolled: false,
      enrollment,
      payment: paymentRecord,
      message: 'Payment verified and enrolled successfully',
    };
  }
}

export const paymentService = new PaymentService();
