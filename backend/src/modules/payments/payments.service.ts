import { prisma } from '../../shared/database/index.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../shared/utils/errors.js';
import { getPaymentProvider, paymentConfig, isMockPaymentEnabled } from './payments.config.js';
import { ordersService } from '../orders/orders.service.js';
import type { CreatePaymentIntentInput, ConfirmOrderPaymentInput } from './payments.schema.js';

/**
 * Payment Intent Response
 */
export interface PaymentIntentResponse {
  intentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  mockPaymentUrl?: string; // Only for mock provider
}

/**
 * Confirm Payment Response
 */
export interface ConfirmPaymentResponse {
  success: boolean;
  order: any;
  tickets: any[];
}

class PaymentsService {
  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(
    userId: string,
    data: CreatePaymentIntentInput
  ): Promise<PaymentIntentResponse> {
    // Get order and validate
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        amount: true,
        currency: true,
        expiresAt: true,
        user: {
          select: { email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status !== 'pending') {
      throw new ConflictError(`Cannot create payment for order with status: ${order.status}`);
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      throw new ConflictError('Order has expired');
    }

    const provider = getPaymentProvider();

    const intent = await provider.createIntent(
      order.id,
      order.orderNumber,
      Number(order.amount),
      order.currency,
      userId,
      order.user.email
    );

    const response: PaymentIntentResponse = {
      intentId: intent.intentId,
      clientSecret: intent.clientSecret,
      amount: intent.amount,
      currency: intent.currency,
    };

    // Add mock payment URL for development
    if (isMockPaymentEnabled()) {
      response.mockPaymentUrl = `${paymentConfig.mockCheckoutUrl}/${intent.intentId}`;
    }

    return response;
  }

  /**
   * Confirm order payment
   */
  async confirmPayment(
    userId: string,
    orderId: string,
    data: ConfirmOrderPaymentInput
  ): Promise<ConfirmPaymentResponse> {
    const provider = getPaymentProvider();

    // Verify payment with provider
    const isValid = await provider.confirmPayment(data.paymentIntentId, data.clientSecret);

    if (!isValid) {
      throw new ForbiddenError('Payment verification failed');
    }

    // Confirm order in database
    const result = await ordersService.confirmOrder(
      userId,
      orderId,
      data.paymentIntentId,
      'card'
    );

    return {
      success: true,
      order: result.order,
      tickets: result.tickets,
    };
  }

  /**
   * Handle mock checkout (development only)
   */
  async handleMockCheckout(
    intentId: string,
    action: 'success' | 'fail'
  ): Promise<{ success: boolean; message: string; redirectUrl: string }> {
    if (!isMockPaymentEnabled()) {
      throw new ForbiddenError('Mock payments are not enabled');
    }

    const provider = getPaymentProvider();
    const intent = provider.getIntent(intentId);

    if (!intent) {
      throw new NotFoundError('Payment intent not found');
    }

    const orderId = intent.metadata.orderId;
    const userId = intent.metadata.userId;

    if (action === 'success') {
      // Simulate successful payment
      const isConfirmed = await provider.confirmPayment(intentId, intent.clientSecret);

      if (isConfirmed) {
        // Confirm the order
        await ordersService.confirmOrder(userId, orderId, intentId, 'card');

        return {
          success: true,
          message: 'Mock payment successful',
          redirectUrl: `${paymentConfig.frontendUrl}/orders/${orderId}/success`,
        };
      }
    }

    // Simulate failed payment
    // Update order status to failed
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'failed' },
    });

    return {
      success: false,
      message: 'Mock payment failed',
      redirectUrl: `${paymentConfig.frontendUrl}/orders/${orderId}/failed`,
    };
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<{ received: boolean }> {
    const provider = getPaymentProvider();

    const isValid = await provider.verifyWebhook(payload, signature);

    if (!isValid) {
      throw new ForbiddenError('Invalid webhook signature');
    }

    // Process webhook payload based on event type
    // This would be extended for real payment providers
    console.log('[PAYMENT WEBHOOK] Received:', JSON.stringify(payload));

    return { received: true };
  }
}

export const paymentsService = new PaymentsService();
