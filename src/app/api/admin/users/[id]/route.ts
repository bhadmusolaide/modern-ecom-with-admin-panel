import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';







// Validation schema for user update
const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'CUSTOMER']).optional(),
  emailVerified: z.boolean().optional(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Validation schema for user deletion
const deleteUserSchema = z.object({
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Get a single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Check if user exists
    const userDoc = await db.collection('users').doc(params.id).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();

    // Format the user data
    const user = {
      id: userDoc.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      emailVerified: userData.emailVerified,
      createdAt: userData.createdAt?.toDate(),
      lastLoginAt: userData.lastLoginAt?.toDate(),
      permissions: userData.permissions || [],
    };

    return createApiResponse({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return createErrorResponse('Failed to fetch user', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Parse and validate request body
    const body = await request.json();
    const validation = deleteUserSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Verify CSRF token
    const { csrfToken } = validation.data;
    if (!verifyCsrfToken(csrfToken)) {
      return createErrorResponse('Invalid CSRF token', 403);
    }

    // Prevent deleting yourself
    if (params.id === access.userId) {
      return createErrorResponse('You cannot delete your own account', 400);
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(params.id).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    // Delete user from Firestore
    await db.collection('users').doc(params.id).delete();

    return createApiResponse({
      success: true,
      message: 'User deleted successfully',
     });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createErrorResponse('Failed to delete user', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
