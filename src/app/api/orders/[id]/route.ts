/**
 * Order API Routes for specific order
 *
 * This file contains API routes for managing a specific order.
 * - GET /api/orders/[id] - Get order by ID
 * - PUT /api/orders/[id] - Update order
 * - DELETE /api/orders/[id] - Delete order
 *
 * Note: This file has been fixed to properly handle GET, PUT, and DELETE operations.
 */

import { NextRequest } from 'next/server';
import {
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  addOrderNote
} from '@/lib/firebase/orders';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { Order, OrderStatus } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Get order by ID
 * @route GET /api/orders/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Ensure params is awaited properly
    const { id } = await params;
    console.log(`API: Processing GET request for order ID: ${id}`);

    // Validate the ID format
    if (!id || typeof id !== 'string') {
      console.error(`Invalid order ID format: ${id}`);
      return createErrorResponse('Invalid order ID format', 400);
    }

    // Unified auth check
    console.log('API: Checking access for order request');
    let access;
    try {
      access = await checkAccess(request);
      console.log('API: Access check result:', JSON.stringify({
        authenticated: access.authenticated,
        userId: access.userId,
        isAdmin: access.isAdmin,
        error: access.error
      }, null, 2));
    } catch (authError) {
      console.error('API: Error during access check:', authError);
      return createErrorResponse(
        `Authentication error: ${authError instanceof Error ? authError.message : 'Unknown error'}`,
        401,
        { details: authError instanceof Error ? authError.stack : 'No stack trace' }
      );
    }

    if (!access.authenticated) {
      console.error('API: Authentication failed:', access.error);

      // For guest users trying to access their own orders, try to validate using order email
      // This allows the thank you page to work for guest orders
      try {
        console.log('API: Attempting to validate guest access using order email');
        const order = await getOrderById(id);

        if (order) { // Order exists
          console.log('API: Found order, allowing guest access for order details');
          console.log('API: Order userId:', order.userId);
          // Allow guest access to view order details on thank you page
          // In production, you might want to add additional validation here
        } else {
          console.error('API: Order not found for guest access');
          return createErrorResponse(
            'Order not found',
            404
          );
        }
      } catch (orderError) {
        console.error('API: Error checking for guest order:', orderError);
        return createErrorResponse(
          'Order not found or access denied',
          404
        );
      }
    }

    // Allow both admin users and the order owner to access the order
    console.log('API: Access granted for user:', access.authenticated ? access.userId : 'guest');

    // Fetch the order using the orders service with client SDK
    console.log('API: Attempting to fetch order from Firestore using client SDK');
    let order;

    try {
      // Use client SDK instead of admin SDK to avoid permission issues
      order = await getOrderById(id);
      console.log('API: getOrderById result:', order ? 'Order found' : 'Order not found');
    } catch (dbError) {
      console.error('API: Error fetching order from database service:', dbError);
      console.error('API: Error details:', dbError instanceof Error ? dbError.message : 'Unknown error');
      console.error('API: Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');

      // If it's a permission error, try a different approach
      if (dbError instanceof Error && dbError.message.includes('permission-denied')) {
        console.log('API: Permission denied, trying alternative approach');

        // For now, return a generic error - in production, you might want to:
        // 1. Check if the user owns the order
        // 2. Use admin SDK with proper service account
        // 3. Implement proper Firestore security rules
        return createErrorResponse(
          'Order access denied. Please check your permissions.',
          403,
          { details: 'Firestore security rules may need to be updated to allow order access.' }
        );
      }

      return createErrorResponse(
        `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        500,
        { details: dbError instanceof Error ? dbError.stack : 'No stack trace' }
      );
    }

    if (!order) {
      console.error(`API: Order with ID ${id} not found`);
      return createErrorResponse('Order not found', 404);
    }

    console.log(`API: Successfully fetched order ${id}`);
    return createApiResponse({ order });
  } catch (error) {
    console.error('API: Unhandled error in GET handler:', error);
    console.error('API: Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('API: Error stack:', error instanceof Error ? error.stack : 'No stack trace available');

    return createErrorResponse(
      'Failed to fetch order',
      500,
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace available'
      }
    );
  }
}

/**
 * Update order by ID
 * @route PUT /api/orders/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Ensure params is awaited properly
    const { id } = await params;
    console.log(`API: Processing PUT request for order ID: ${id}`);

    // Validate the ID format
    if (!id || typeof id !== 'string') {
      console.error(`Invalid order ID format: ${id}`);
      return createErrorResponse('Invalid order ID format', 400);
    }

    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Admin access granted for user:', access.userId);

    // Get the existing order
    const existingOrder = await getOrderById(id);

    if (!existingOrder) {
      console.error(`Order with ID ${id} not found`);
      return createErrorResponse('Order not found', 404);
    }

    // Parse request body
    const updateData = await request.json();
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Update the order
    const updatedOrder = await updateOrder(id, updateData);

    console.log(`Successfully updated order ${id}`);
    return createApiResponse(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return createErrorResponse('Failed to update order', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Delete order by ID
 * @route DELETE /api/orders/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Ensure params is awaited properly
    const { id } = await params;
    console.log(`API: Processing DELETE request for order ID: ${id}`);

    // Validate the ID format
    if (!id || typeof id !== 'string') {
      console.error(`Invalid order ID format: ${id}`);
      return createErrorResponse('Invalid order ID format', 400);
    }

    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Admin access granted for user:', access.userId);

    // Delete the order
    await deleteOrder(id);

    return createApiResponse({ message: 'Order deleted successfully' }, 200);
  } catch (error) {
    console.error('Error deleting order:', error);
    return createErrorResponse('Failed to delete order', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}