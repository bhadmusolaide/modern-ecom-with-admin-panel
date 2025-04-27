/**
 * Order Refund API Route
 *
 * This file contains API routes for processing refunds.
 * - POST /api/orders/[id]/refund - Process a refund for an order
 */

import { NextRequest } from 'next/server';
import { getOrderById, updateOrder, updateOrderStatus } from '@/lib/firebase/orders';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { OrderStatus, PaymentStatus } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Process a refund for an order
 * @route POST /api/orders/[id]/refund
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    // Always use real data in both development and production
    // Check if user has admin permissions
    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Admin access granted for user:', access.userId);

    // Get the existing order
    const existingOrder = await getOrderById(id);

    if (!existingOrder) {
      return createErrorResponse('Order not found', 404);
    }

    // Check if the order can be refunded
    if (existingOrder.status === OrderStatus.REFUNDED) {
      return createErrorResponse('This order has already been refunded', 400);
    }

    if (existingOrder.payment.status !== PaymentStatus.PAID) {
      return createErrorResponse('Only paid orders can be refunded', 400);
    }

    // Parse request body
    const { reason, amount, isFullRefund } = await request.json();

    if (!reason) {
      return createErrorResponse('Refund reason is required', 400);
    }

    if (!isFullRefund && (!amount || amount <= 0)) {
      return createErrorResponse('Valid refund amount is required for partial refunds', 400);
    }

    // In a real app, this would process the refund with a payment provider
    // For example:
    // const refundResult = await processRefundWithPaymentProvider(
    //   existingOrder.payment.transactionId,
    //   isFullRefund ? existingOrder.total : amount
    // );

    // Update order status to REFUNDED
    const noteMessage = `Refund processed: ${isFullRefund ? 'Full refund' : `Partial refund of $${(amount / 100).toFixed(2)}`}. Reason: ${reason}`;

    const updatedOrder = await updateOrderStatus(
      id,
      OrderStatus.REFUNDED,
      {
        message: noteMessage,
        createdBy: access.userId,
        isCustomerVisible: true
      }
    );

    // Update payment status
    await updateOrder(id, {
      payment: {
        ...existingOrder.payment,
        status: PaymentStatus.REFUNDED,
        refundAmount: isFullRefund ? existingOrder.total : amount,
        refundedAt: new Date().toISOString()
      }
    });

    return createApiResponse(updatedOrder);
  } catch (error) {
    console.error('Error processing refund:', error);
    return createErrorResponse('Failed to process refund', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}