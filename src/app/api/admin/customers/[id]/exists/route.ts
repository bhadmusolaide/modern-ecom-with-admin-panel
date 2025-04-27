/**
 * Customer Existence Check API Route
 *
 * This file contains the API route for checking if a customer exists.
 * - GET /api/admin/customers/[id]/exists - Check if a customer exists
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { checkCustomerIdExists } from '@/lib/firebase/customers';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Check if a customer exists
 * @route GET /api/admin/customers/[id]/exists
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
    console.log('Checking if customer exists with ID:', customerId);

    try {
      // Use admin SDK directly in the API route
      const adminDb = db;
      const customerRef = adminDb.collection('customers').doc(customerId);
      const customerDoc = await customerRef.get();

      const exists = customerDoc.exists;
      console.log('Customer exists check result:', exists);

      return createApiResponse({
        exists,
        message: exists ? 'Customer exists' : 'Customer does not exist'
      });
    } catch (checkError) {
      console.error('Error checking if customer exists:', checkError);
      return createErrorResponse(
        checkError instanceof Error ? checkError.message : 'Failed to check if customer exists',
        500
      );
    }
  } catch (error) {
    console.error('Error checking if customer exists:', error);
    return createErrorResponse('Failed to check if customer exists', 500);
  }
}
