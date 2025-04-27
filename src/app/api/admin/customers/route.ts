/**
 * Customers API Route
 *
 * This file contains API routes for managing customers.
 * - GET /api/admin/customers - Get all customers
 * - POST /api/admin/customers - Create a new customer
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db, auth } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Validation schema for customer creation
const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
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
  isActive: z.boolean().default(true),
  userId: z.string().optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

/**
 * Get all customers
 * @route GET /api/admin/customers
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Customers API: Processing GET request');

    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      console.error('Customers API: Authentication failed');
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      console.error('Customers API: Admin access required but user is not admin');
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Customers API: Admin access granted for user:', access.userId);

    try {
      // Get all customers from the customers collection
      console.log('Customers API: Fetching customers from database');

      try {
        const customersSnapshot = await db.collection('customers').get();

        const customers = customersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            name: data.name,
            phone: data.phone,
            address: data.address,
            isActive: data.isActive !== false,
            emailVerified: data.emailVerified || false,
            segment: data.segment || [],
            totalOrders: data.totalOrders || 0,
            totalSpent: data.totalSpent || 0,
            lastOrderDate: data.lastOrderDate ? data.lastOrderDate.toDate() : null,
            notes: data.notes,
            avatar: data.avatar,
            userId: data.userId,
            createdAt: data.createdAt ? data.createdAt.toDate() : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
          };
        });

        console.log(`Customers API: Successfully retrieved ${customers.length} customers`);

        return createApiResponse({
          customers,
          message: 'Customers retrieved successfully'
        });
      } catch (dbOperationError) {
        console.error('Customers API: Database operation error:', dbOperationError);
        console.error('Error details:', dbOperationError instanceof Error ? dbOperationError.message : 'Unknown error');
        console.error('Error stack:', dbOperationError instanceof Error ? dbOperationError.stack : 'No stack trace');

        return createErrorResponse(
          'Database operation error while fetching customers',
          500,
          {
            details: dbOperationError instanceof Error ? dbOperationError.message : 'Unknown database error',
            stack: dbOperationError instanceof Error ? dbOperationError.stack : 'No stack trace'
          }
        );
      }
    } catch (dbError) {
      console.error('Customers API: Database error:', dbError);
      console.error('Error details:', dbError instanceof Error ? dbError.message : 'Unknown error');
      console.error('Error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');

      return createErrorResponse(
        'Database error while fetching customers',
        500,
        {
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
        }
      );
    }
  } catch (error) {
    console.error('Customers API: Unhandled error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return createErrorResponse(
      'Failed to fetch customers',
      500,
      {
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    );
  }
}

/**
 * Create a new customer
 * @route POST /api/admin/customers
 */
export async function POST(request: NextRequest) {
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
    const validation = createCustomerSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const {
      email,
      password,
      name,
      phone,
      address,
      notes,
      segment,
      isActive,
      userId,
      csrfToken: _csrfToken, // Exclude from customerData
    } = validation.data;

    // Check if customer with this email already exists
    const existingCustomersSnapshot = await db.collection('customers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingCustomersSnapshot.empty) {
      return createErrorResponse('Customer with this email already exists', 400);
    }

    let userRecordId = userId;

    // If password is provided, create a Firebase Auth user
    if (password) {
      try {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
          emailVerified: true,
          disabled: !isActive
        });
        userRecordId = userRecord.uid;
      } catch (authError) {
        console.error('Error creating Firebase Auth user:', authError);
        // If the user already exists in Auth but not in customers collection,
        // we can still proceed with creating the customer record
        if (authError.code !== 'auth/email-already-exists') {
          throw authError;
        }
      }
    }

    // Create customer in Firestore customers collection
    const customerData = {
      email,
      name: name || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
      segment: segment || [],
      isActive: isActive !== false,
      emailVerified: true,
      totalOrders: 0,
      totalSpent: 0,
      userId: userRecordId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const customerRef = await db.collection('customers').add(customerData);

    // Get the created customer
    const createdCustomerDoc = await db.collection('customers').doc(customerRef.id).get();
    const createdCustomer = {
      id: createdCustomerDoc.id,
      ...createdCustomerDoc.data(),
      createdAt: createdCustomerDoc.data()?.createdAt.toDate(),
      updatedAt: createdCustomerDoc.data()?.updatedAt.toDate()
    };

    return createApiResponse({
      customer: createdCustomer,
      message: 'Customer created successfully'
    }, 201);
  } catch (error) {
    console.error('Error creating customer:', error);

    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      return createErrorResponse('Email already in use', 400);
    }

    return createErrorResponse(
      'Failed to create customer',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
