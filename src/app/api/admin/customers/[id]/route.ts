import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db, auth } from '@/lib/firebase/admin';
import { getCustomerById, updateCustomer, setCustomerActiveStatus } from '@/lib/firebase/customers';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';





// Validation schema for customer update
const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
  segment: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Validation schema for customer deletion
const deleteCustomerSchema = z.object({
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Get a customer by ID
 * @route GET /api/admin/customers/[id]
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

    // Get customer by ID
    const customerId = params.id;
    console.log('Fetching customer with ID:', customerId);

    try {
      // Use admin SDK directly in the API route
      const adminDb = db;
      const customerRef = adminDb.collection('customers').doc(customerId);
      const customerDoc = await customerRef.get();

      if (!customerDoc.exists) {
        console.error(`Customer with ID ${customerId} not found in Firestore`);
        return createErrorResponse('Customer not found', 404);
      }

      const data = customerDoc.data();

      // Convert the customer data to the expected format
      const customer = {
        id: customerDoc.id,
        email: data?.email || '',
        name: data?.name || null,
        role: data?.role || 'CUSTOMER',
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
        lastLoginAt: data?.lastLoginAt?.toDate(),
        lastOrderDate: data?.lastOrderDate?.toDate(),
        phone: data?.phone || null,
        address: data?.address || null,
        isActive: data?.isActive !== false, // Default to true if not specified
        emailVerified: data?.emailVerified || false,
        segment: data?.segment || [],
        totalOrders: data?.totalOrders || 0,
        totalSpent: data?.totalSpent || 0,
        notes: data?.notes || null,
        avatar: data?.avatar || null,
        permissions: data?.permissions || []
      };

      console.log('Successfully fetched customer:', customer.id);

      return createApiResponse({
        customer,
        message: 'Customer retrieved successfully'
      });
    } catch (customerError) {
      console.error('Error fetching customer:', customerError);
      return createErrorResponse(
        customerError instanceof Error ? customerError.message : 'Failed to fetch customer',
        404
      );
    }
  } catch (error) {
    console.error('Error fetching customer:', error);
    return createErrorResponse(
      'Failed to fetch customer',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Delete a customer
 * @route DELETE /api/admin/customers/[id]
 */
export async function DELETE(
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

    // Parse request body
    const body = await request.json();

    // Verify CSRF token
    const csrfTokenValid = await verifyCsrfToken(body.csrfToken);
    if (!csrfTokenValid) {
      return createErrorResponse('Invalid CSRF token', 403);
    }

    // Validate request body
    const validation = deleteCustomerSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Get customer ID
    const customerId = params.id;
    console.log('Deleting customer with ID:', customerId);

    // Check if customer exists
    try {
      const customerDoc = await db.collection('customers').doc(customerId).get();

      if (!customerDoc.exists) {
        return createErrorResponse('Customer not found', 404);
      }

      // Get user ID if available
      const userData = customerDoc.data();
      const userId = userData?.userId;

      // Delete customer from Firebase Auth if they have a userId
      if (userId) {
        try {
          await auth.deleteUser(userId);
          console.log('Deleted user from Firebase Auth:', userId);
        } catch (authError) {
          console.error('Error deleting user from Firebase Auth:', authError);
          // Continue with Firestore deletion even if Auth deletion fails
        }
      }

      // Delete customer from Firestore
      await db.collection('customers').doc(customerId).delete();
      console.log('Deleted customer from Firestore:', customerId);
    } catch (dbError) {
      console.error('Error accessing Firestore:', dbError);
      return createErrorResponse(
        dbError instanceof Error ? dbError.message : 'Failed to delete customer',
        500
      );
    }

    return createApiResponse({
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return createErrorResponse(
      'Failed to delete customer',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
