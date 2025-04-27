/**
 * Order Notes API Route
 *
 * This file contains API routes for managing order notes.
 * - POST /api/orders/[id]/notes - Add a note to an order
 */

import { NextRequest } from 'next/server';
import { addOrderNote, getOrderById } from '@/lib/firebase/orders';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Add a note to an order
 * @route POST /api/orders/[id]/notes
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

    // Get the existing order
    const existingOrder = await getOrderById(id);

    if (!existingOrder) {
      return createErrorResponse('Order not found', 404);
    }

    // Parse request body
    const { message, isCustomerVisible = false } = await request.json();

    // Validate message
    if (!message) {
      return createErrorResponse('Note message is required', 400);
    }

    // Add note to order
    const updatedOrder = await addOrderNote(
      id,
      {
        message,
        createdBy: access.userId,
        isCustomerVisible
      }
    );

    return createApiResponse(updatedOrder);
  } catch (error) {
    console.error('Error adding note to order:', error);
    return createErrorResponse('Failed to add note to order', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}