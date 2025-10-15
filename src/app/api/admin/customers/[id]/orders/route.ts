/**
 * Customer Orders API Route
 *
 * This file contains API routes for getting customer orders.
 * - GET /api/admin/customers/[id]/orders - Get orders for a customer
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
 * Get orders for a customer
 * @route GET /api/admin/customers/[id]/orders
 */
export async function GET(
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
    console.log('Fetching orders for customer ID:', customerId);

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

      // Build the query based on available data with better error handling
      let ordersQuery;

      // Validate the database connection first
      if (!db || typeof db.collection !== 'function') {
        console.error('Invalid Firestore database instance');
        return createErrorResponse('Database connection error', 500);
      }

      try {
        // Log the customer data for debugging
        console.log('Customer data for query building:', {
          customerId,
          userId: userId || 'not available',
          customerData: customerData ? 'exists' : 'missing'
        });

        // Always try to query by customerId first (most reliable)
        console.log(`Querying orders by customerId: ${customerId}`);
        ordersQuery = db.collection('orders').where('customerId', '==', customerId);

        // Add ordering after the where clause
        ordersQuery = ordersQuery.orderBy('createdAt', 'desc');

        console.log('Query built successfully');
      } catch (queryBuildError) {
        console.error('Error building Firestore query:', queryBuildError);
        return createErrorResponse('Failed to build database query', 500);
      }

      // Execute the query with better error handling
      try {
        console.log('Executing Firestore query for orders');
        const ordersSnapshot = await ordersQuery.get();
        console.log(`Query executed successfully, got ${ordersSnapshot.size} documents`);

        // Convert the documents to Order objects with safer date handling
        const orders = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          try {
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            };
          } catch (dateError) {
            console.error(`Error processing dates for order ${doc.id}:`, dateError);
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            };
          }
        });

        console.log(`Found ${orders.length} orders for customer ${customerId}`);

        return createApiResponse({
          orders,
          message: 'Customer orders retrieved successfully'
        });
      } catch (queryError) {
        // Fallback: handle missing composite index by removing orderBy and sorting in memory
        const message = queryError instanceof Error ? queryError.message : String(queryError);
        console.warn('Primary orders query failed, attempting fallback without orderBy. Reason:', message);
        if (/FAILED_PRECONDITION|index/i.test(message)) {
          try {
            console.warn('Missing Firestore composite index for (customerId, createdAt). Using fallback query and in-memory sort.');
            const fallbackSnap = await db.collection('orders')
              .where('customerId', '==', customerId)
              .get();

            const docs = fallbackSnap.docs.sort((a, b) => {
              const ad = a.data();
              const bd = b.data();
              const at = ad.createdAt?.toDate ? ad.createdAt.toDate().getTime() : new Date(ad.createdAt).getTime();
              const bt = bd.createdAt?.toDate ? bd.createdAt.toDate().getTime() : new Date(bd.createdAt).getTime();
              return bt - at; // desc
            });

            const orders = docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
              };
            });

            console.log(`Fallback succeeded, found ${orders.length} orders for customer ${customerId}`);
            console.warn('Recommendation: add Firestore composite index for orders on fields: customerId (ASC), createdAt (DESC).');

            return createApiResponse({
              orders,
              message: 'Customer orders retrieved successfully (fallback)'
            });
          } catch (fallbackError) {
            console.error('Fallback query failed:', fallbackError);
            throw new Error(`Error executing Firestore query (and fallback): ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          }
        }

        console.error('Error executing Firestore query:', queryError);
        throw new Error(`Error executing Firestore query: ${message}`);
      }
    } catch (ordersError) {
      console.error('Error fetching customer orders:', ordersError);
      return createErrorResponse(
        ordersError instanceof Error ? ordersError.message : 'Failed to fetch customer orders',
        500
      );
    }
  } catch (error) {
    console.error('Error getting customer orders:', error);
    return createErrorResponse(
      'Failed to get customer orders',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
