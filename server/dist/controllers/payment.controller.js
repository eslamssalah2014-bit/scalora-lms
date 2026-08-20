"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentGateways = exports.checkout = void 0;
const zod_1 = require("zod");
const payment_service_js_1 = require("../services/payment.service.js");
const checkoutSchema = zod_1.z.object({
    courseId: zod_1.z.string().min(1, 'Course ID is required'),
    provider: zod_1.z.enum(['MOCK', 'STRIPE', 'PAYMOB']).optional().default('MOCK'),
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
const getPaymentGateways = async (_req, res) => {
    res.json({
        success: true,
        gateways: [
            {
                id: 'MOCK',
                name: 'Scalora Fast Checkout (Sandbox / Instant)',
                description: 'Instant 1-click test checkout without real charges',
                currencies: ['USD', 'EGP', 'EUR'],
                isDefault: true,
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
                name: 'Paymob Gateway',
                description: 'Cards, Mobile Wallets (Vodafone Cash, Orange, etc.), Meeza',
                currencies: ['EGP', 'SAR', 'AED'],
                isDefault: false,
                badge: 'MENA / Mobile Wallets',
            },
        ],
    });
};
exports.getPaymentGateways = getPaymentGateways;
