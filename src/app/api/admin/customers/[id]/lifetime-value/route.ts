/**
 * Customer Lifetime Value API Route
 *
 * This file contains API routes for calculating customer lifetime value.
 * - POST /api/admin/customers/[id]/lifetime-value - Calculate lifetime value for a customer
 */

import { NextRequest } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { db } from '@/lib/firebase/admin';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Calculate lifetime value for a customer
 * @route POST /api/admin/customers/[id]/lifetime-value
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
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

    // Get customer ID
    const customerId = params.id;
    console.log('Calculating lifetime value for customer ID:', customerId);

    try {
      // First check if the customer exists
      const customerRef = db.collection('customers').doc(customerId);
      const customerDoc = await customerRef.get();

      if (!customerDoc.exists) {
        console.error(`Customer with ID ${customerId} not found in Firestore`);
        return createErrorResponse('Customer not found', 404);
      }

      // Get the customer data
      const customerData = customerDoc.data();
      const userId = customerData?.userId;

      // Build the query based on available data
      let ordersQuery;

      if (userId) {
        // If we have a userId, query by that first
        console.log(`Querying orders by userId: ${userId}`);
        ordersQuery = db.collection('orders').where('userId', '==', userId);
      } else {
        // Otherwise, query by customerId
        console.log(`Querying orders by customerId: ${customerId}`);
        ordersQuery = db.collection('orders').where('customerId', '==', customerId);
      }

      // Execute the query
      const ordersSnapshot = await ordersQuery.get();

      // Calculate total spent
      let totalSpent = 0;
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        totalSpent += order.total || 0;
      });

      // Update the customer with the calculated values
      await customerRef.update({
        totalOrders: ordersSnapshot.docs.length,
        totalSpent,
        updatedAt: new Date()
      });

      console.log(`Updated customer ${customerId} with lifetime value: ${totalSpent} from ${ordersSnapshot.docs.length} orders`);

      return createApiResponse({
        totalOrders: ordersSnapshot.docs.length,
        totalSpent,
        message: 'Customer lifetime value calculated successfully'
      });
    } catch (calcError) {
      console.error('Error calculating customer lifetime value:', calcError);
      return createErrorResponse(
        calcError instanceof Error ? calcError.message : 'Failed to calculate customer lifetime value',
        500
      );
    }
  } catch (error) {
    console.error('Error calculating customer lifetime value:', error);
    return createErrorResponse(
      'Failed to calculate customer lifetime value',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
