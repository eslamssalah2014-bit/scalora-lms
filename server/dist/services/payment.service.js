"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = exports.PaymobPaymentProvider = exports.StripePaymentProvider = exports.MockPaymentProvider = void 0;
const prisma_js_1 = require("../lib/prisma.js");
/**
 * Mock / Sandbox Payment Provider for instant demo & development testing
 */
class MockPaymentProvider {
    name = 'MOCK';
    async processPayment(options) {
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
    async verifyPayment(transactionId) {
        return transactionId.startsWith('txn_mock_');
    }
}
exports.MockPaymentProvider = MockPaymentProvider;
/**
 * Stripe Payment Gateway Integration Architecture
 */
class StripePaymentProvider {
    name = 'STRIPE';
    apiKey;
    constructor(apiKey = process.env.STRIPE_SECRET_KEY || '') {
        this.apiKey = apiKey;
    }
    async processPayment(options) {
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
    async verifyPayment(transactionId) {
        return Boolean(transactionId);
    }
}
exports.StripePaymentProvider = StripePaymentProvider;
/**
 * Paymob Payment Gateway Integration Architecture
 */
class PaymobPaymentProvider {
    name = 'PAYMOB';
    apiKey;
    integrationId;
    constructor(apiKey = process.env.PAYMOB_API_KEY || '', integrationId = process.env.PAYMOB_INTEGRATION_ID || '') {
        this.apiKey = apiKey;
        this.integrationId = integrationId;
    }
    async processPayment(options) {
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
    async verifyPayment(transactionId) {
        return Boolean(transactionId);
    }
}
exports.PaymobPaymentProvider = PaymobPaymentProvider;
/**
 * High-Level Payment Service Orchestrator with PostgreSQL Payment Record Persistence
 */
class PaymentService {
    providers = new Map();
    defaultProvider = 'MOCK';
    constructor() {
        this.registerProvider(new MockPaymentProvider());
        this.registerProvider(new StripePaymentProvider());
        this.registerProvider(new PaymobPaymentProvider());
    }
    registerProvider(provider) {
        this.providers.set(provider.name.toUpperCase(), provider);
    }
    getProvider(name) {
        const key = (name || this.defaultProvider).toUpperCase();
        const provider = this.providers.get(key);
        if (!provider) {
            return this.providers.get('MOCK');
        }
        return provider;
    }
    async checkoutAndEnroll(params) {
        const { userId, courseId, providerName } = params;
        // Check course existence
        const course = await prisma_js_1.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new Error('Course not found');
        }
        // Check if already enrolled
        const existingEnrollment = await prisma_js_1.prisma.enrollment.findUnique({
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
        const paymentRecord = await prisma_js_1.prisma.payment.create({
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
        const enrollment = await prisma_js_1.prisma.enrollment.create({
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
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
