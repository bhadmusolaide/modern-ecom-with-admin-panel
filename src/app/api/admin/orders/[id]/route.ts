/**
 * Admin Orders API Routes
 *
 * This file contains API routes for admin management of orders.
 * - DELETE /api/admin/orders/[id] - Delete an order (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * Delete an order (admin only)
 * @route DELETE /api/admin/orders/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin-only access check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      return createErrorResponse('Admin access required', 403);
    }

    const orderId = params.id;

    if (!orderId) {
      return createErrorResponse('Order ID is required', 400);
    }

    // Use admin Firestore to bypass security rules for deletion
    const adminDb = getAdminFirestore();

    if (!adminDb) {
      return createErrorResponse('Admin database not available', 500);
    }

    try {
      const orderRef = adminDb.collection('orders').doc(orderId);
      await orderRef.delete();

      return createApiResponse({ success: true, message: 'Order deleted successfully' });
    } catch (deleteError) {
      console.error('Error deleting order:', deleteError);
      return createErrorResponse('Failed to delete order', 500);
    }
  } catch (error) {
    console.error('Error in admin order deletion:', error);
    return createErrorResponse(
      'Failed to delete order',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}