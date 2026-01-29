import { env } from '../../shared/config/index.js';
import type { PaymentProvider } from './payment-provider.interface.js';
import { MockPaymentProvider, mockPaymentProvider } from './providers/mock.provider.js';

/**
 * Payment configuration
 */
export const paymentConfig = {
  // Current provider: 'mock' | 'iyzico' | 'stripe'
  provider: process.env.PAYMENT_PROVIDER || 'mock',

  // Mock checkout URL (for development)
  mockCheckoutUrl: `${process.env.API_URL || 'http://localhost:3000'}/api/v1/payments/mock-checkout`,

  // Frontend URLs for redirects
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Future provider configs (currently unused)
  iyzico: {
    apiKey: process.env.IYZICO_API_KEY || '',
    secretKey: process.env.IYZICO_SECRET_KEY || '',
    baseUrl: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
};

/**
 * Get the current payment provider instance
 */
export function getPaymentProvider(): PaymentProvider {
  switch (paymentConfig.provider) {
    case 'mock':
      return mockPaymentProvider;
    // Future providers:
    // case 'iyzico':
    //   return iyzicoPaymentProvider;
    // case 'stripe':
    //   return stripePaymentProvider;
    default:
      console.warn(`Unknown payment provider: ${paymentConfig.provider}, falling back to mock`);
      return mockPaymentProvider;
  }
}

/**
 * Check if mock payments are enabled
 */
export function isMockPaymentEnabled(): boolean {
  return paymentConfig.provider === 'mock' || env.NODE_ENV !== 'production';
}
