/**
 * Payment Intent Interface
 * Represents a payment intent created by a payment provider
 */
export interface PaymentIntent {
  intentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  metadata: Record<string, any>;
}

/**
 * Payment Provider Interface
 * Abstract interface for payment providers (mock, iyzico, stripe, etc.)
 */
export interface PaymentProvider {
  /**
   * Create a payment intent for an order
   */
  createIntent(
    orderId: string,
    orderNumber: string,
    amount: number,
    currency: string,
    userId: string,
    userEmail: string
  ): Promise<PaymentIntent>;

  /**
   * Confirm a payment using the intent ID and client secret
   */
  confirmPayment(intentId: string, clientSecret: string): Promise<boolean>;

  /**
   * Get payment intent by ID
   */
  getIntent(intentId: string): PaymentIntent | undefined;

  /**
   * Process a refund for a payment
   */
  refundPayment(paymentId: string, amount?: number): Promise<boolean>;

  /**
   * Verify webhook signature (for real providers)
   */
  verifyWebhook(payload: any, signature?: string): Promise<boolean>;
}
