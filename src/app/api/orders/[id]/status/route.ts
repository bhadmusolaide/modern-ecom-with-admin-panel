/**
 * Order Status API Route
 *
 * This file contains API routes for updating order status.
 * - PUT /api/orders/[id]/status - Update order status
 */

import { NextRequest } from 'next/server';
import { updateOrderStatus, getOrderById } from '@/lib/firebase/orders';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { OrderStatus } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Update order status
 * @route PUT /api/orders/[id]/status
 */
export async function PUT(
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

    // Parse request body
    const { status, note } = await request.json();

    // Validate status
    if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
      return createErrorResponse('Invalid order status', 400);
    }

    // Update order status
    const updatedOrder = await updateOrderStatus(
      id,
      status as OrderStatus,
      note ? {
        message: note,
        createdBy: access.userId,
        isCustomerVisible: true
      } : undefined
    );

    return createApiResponse(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return createErrorResponse('Failed to update order status', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}