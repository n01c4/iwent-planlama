import { randomUUID } from 'crypto';
import type { PaymentProvider, PaymentIntent } from '../payment-provider.interface.js';

/**
 * Mock Payment Provider
 * For development and testing purposes only
 * DO NOT USE IN PRODUCTION
 */
export class MockPaymentProvider implements PaymentProvider {
  // In-memory storage for mock intents
  private intents = new Map<string, PaymentIntent>();

  async createIntent(
    orderId: string,
    orderNumber: string,
    amount: number,
    currency: string,
    userId: string,
    userEmail: string
  ): Promise<PaymentIntent> {
    const intentId = randomUUID();
    const clientSecret = `mock_secret_${randomUUID()}`;

    const intent: PaymentIntent = {
      intentId,
      clientSecret,
      amount,
      currency,
      status: 'pending',
      metadata: {
        orderId,
        orderNumber,
        userId,
        userEmail,
        createdAt: new Date().toISOString(),
      },
    };

    this.intents.set(intentId, intent);

    console.log(`[MOCK PAYMENT] Created intent: ${intentId} for order: ${orderNumber}`);

    return intent;
  }

  async confirmPayment(intentId: string, clientSecret: string): Promise<boolean> {
    const intent = this.intents.get(intentId);

    if (!intent) {
      console.log(`[MOCK PAYMENT] Intent not found: ${intentId}`);
      return false;
    }

    // Mock validation: clientSecret should match
    if (clientSecret !== intent.clientSecret) {
      console.log(`[MOCK PAYMENT] Invalid client secret for intent: ${intentId}`);
      return false;
    }

    intent.status = 'completed';
    this.intents.set(intentId, intent);

    console.log(`[MOCK PAYMENT] Payment confirmed for intent: ${intentId}`);
    return true;
  }

  getIntent(intentId: string): PaymentIntent | undefined {
    return this.intents.get(intentId);
  }

  async refundPayment(paymentId: string, amount?: number): Promise<boolean> {
    console.log(`[MOCK PAYMENT] Refund processed for payment: ${paymentId}, amount: ${amount || 'full'}`);
    return true;
  }

  async verifyWebhook(payload: any, signature?: string): Promise<boolean> {
    // Mock always returns true in development
    console.log(`[MOCK PAYMENT] Webhook verified (mock)`);
    return true;
  }

  /**
   * Simulate a successful payment (for testing)
   */
  simulateSuccess(intentId: string): boolean {
    const intent = this.intents.get(intentId);
    if (intent) {
      intent.status = 'completed';
      this.intents.set(intentId, intent);
      return true;
    }
    return false;
  }

  /**
   * Simulate a failed payment (for testing)
   */
  simulateFailure(intentId: string): boolean {
    const intent = this.intents.get(intentId);
    if (intent) {
      intent.status = 'failed';
      this.intents.set(intentId, intent);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const mockPaymentProvider = new MockPaymentProvider();
