import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';





// Validation schema for permissions update
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Get user permissions
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

    // Check if user is admin
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

    // Return user permissions
    return createApiResponse({
      permissions: userData?.permissions || [],
      user: {
        id: userDoc.id,
        name: userData?.name,
        email: userData?.email,
        role: userData?.role || 'CUSTOMER',
      }
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return createErrorResponse('Failed to fetch user permissions', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}

// Update user permissions
export async function PUT(
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

    // Check if user is admin
    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Admin access granted for user:', access.userId);

    // Parse and validate request body
    const body = await request.json();
    const validation = updatePermissionsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { permissions, csrfToken } = validation.data;

    // Verify CSRF token
    const csrfValid = await verifyCsrfToken(csrfToken);
    if (!csrfValid) {
      return createErrorResponse('Invalid CSRF token', 400);
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(params.id).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    // Prevent changing own permissions (admin can't restrict themselves)
    if (params.id === access.userId) {
      return createErrorResponse('You cannot change your own permissions', 400);
    }

    // Update user permissions in Firestore
    await db.collection('users').doc(params.id).update({
      permissions,
      updatedAt: new Date(),
    });

    // Return success
    return createApiResponse({
      message: 'User permissions updated successfully',
      permissions
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return createErrorResponse('Failed to update user permissions', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
