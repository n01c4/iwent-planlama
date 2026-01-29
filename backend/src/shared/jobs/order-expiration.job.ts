import cron from 'node-cron';
import { prisma } from '../database/index.js';

/**
 * Order Expiration Job
 * Runs every minute to cancel expired pending orders
 * and release reserved tickets back to inventory
 */

let isRunning = false;

/**
 * Process expired orders
 */
async function processExpiredOrders(): Promise<void> {
  if (isRunning) {
    console.log('[ORDER EXPIRATION] Previous job still running, skipping...');
    return;
  }

  isRunning = true;

  try {
    // Find all expired pending orders
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      include: {
        orderItems: true,
      },
    });

    if (expiredOrders.length === 0) {
      return;
    }

    console.log(`[ORDER EXPIRATION] Found ${expiredOrders.length} expired orders`);

    for (const order of expiredOrders) {
      try {
        await prisma.$transaction(async (tx) => {
          // Update order status to cancelled
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(),
            },
          });

          // Cancel all tickets for this order
          await tx.ticket.updateMany({
            where: { orderId: order.id },
            data: { status: 'CANCELLED' },
          });

          // Release reserved tickets back to inventory
          for (const item of order.orderItems) {
            await tx.ticketType.update({
              where: { id: item.ticketTypeId },
              data: {
                reservedCount: { decrement: item.quantity },
              },
            });
          }

          // If a discount code was used, decrement the usage count
          if (order.discountCodeId) {
            await tx.discountCode.update({
              where: { id: order.discountCodeId },
              data: { usedCount: { decrement: 1 } },
            });
          }
        });

        console.log(`[ORDER EXPIRATION] Cancelled order: ${order.orderNumber}`);
      } catch (error) {
        console.error(`[ORDER EXPIRATION] Failed to cancel order ${order.orderNumber}:`, error);
      }
    }

    console.log(`[ORDER EXPIRATION] Processed ${expiredOrders.length} expired orders`);
  } catch (error) {
    console.error('[ORDER EXPIRATION] Job failed:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the order expiration job
 * Runs every minute
 */
export function startOrderExpirationJob(): void {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await processExpiredOrders();
  });

  console.log('[ORDER EXPIRATION] Job started - running every minute');
}

/**
 * Manually trigger the job (for testing)
 */
export async function runOrderExpirationJob(): Promise<void> {
  await processExpiredOrders();
}
