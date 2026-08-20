import { Response } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const checkoutSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  provider: z.enum(['MOCK', 'STRIPE', 'PAYMOB']).optional().default('MOCK'),
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

export const getPaymentGateways = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
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
