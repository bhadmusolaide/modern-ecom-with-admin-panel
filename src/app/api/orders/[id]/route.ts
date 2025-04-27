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
// Import client Firebase SDK for direct access
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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
    const id = params.id;
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
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      console.error('API: Admin access required but user is not admin');
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('API: Admin access granted for user:', access.userId);

    // Fetch the order - try both methods
    console.log('API: Attempting to fetch order from Firestore');
    let order;

    // First try direct client SDK access
    try {
      console.log('API: Trying direct client SDK access first');
      const orderRef = doc(db, 'orders', id);
      const orderDoc = await getDoc(orderRef);

      if (orderDoc.exists()) {
        // Get raw data and sanitize it
        const rawData = orderDoc.data();

        // Sanitize dates to ensure they are valid
        const sanitizeDate = (dateStr: any): string => {
          if (!dateStr) return new Date().toISOString(); // Default to current date

          try {
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? new Date().toISOString() : dateStr;
          } catch (e) {
            return new Date().toISOString();
          }
        };

        // Create sanitized order object
        order = {
          id: orderDoc.id,
          ...rawData,
          createdAt: sanitizeDate(rawData.createdAt),
          updatedAt: sanitizeDate(rawData.updatedAt),
          payment: {
            ...(rawData.payment || {}),
            datePaid: rawData.payment?.datePaid ? sanitizeDate(rawData.payment.datePaid) : undefined,
            dateRefunded: rawData.payment?.dateRefunded ? sanitizeDate(rawData.payment.dateRefunded) : undefined
          },
          notes: Array.isArray(rawData.notes) ? rawData.notes.map(note => ({
            ...note,
            createdAt: sanitizeDate(note.createdAt)
          })) : []
        };

        console.log('API: Successfully fetched order using client SDK');
      } else {
        console.log('API: Order not found using client SDK');
      }
    } catch (clientError) {
      console.error('API: Error fetching with client SDK:', clientError);
      console.error('API: Client error details:', clientError instanceof Error ? clientError.message : 'Unknown error');
    }

    // If client SDK failed, try the orders service
    if (!order) {
      try {
        console.log('API: Client SDK failed, trying orders service');
        order = await getOrderById(id);
        console.log('API: getOrderById result:', order ? 'Order found' : 'Order not found');
      } catch (dbError) {
        console.error('API: Error fetching order from database service:', dbError);
        return createErrorResponse(
          `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
          500,
          { details: dbError instanceof Error ? dbError.stack : 'No stack trace' }
        );
      }
    }

    if (!order) {
      console.error(`API: Order with ID ${id} not found`);
      return createErrorResponse('Order not found', 404);
    }

    console.log(`API: Successfully fetched order ${id}`);
    return createApiResponse(order);
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
    const id = params.id;
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
    const id = params.id;
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