import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db, auth } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Validation schema for status update
const updateStatusSchema = z.object({
  isActive: z.boolean(),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

// Update user status
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

    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Admin access required.', 403);
    }

    console.log('Admin access granted for user:', access.userId);

    // Parse and validate request body
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { isActive, csrfToken } = validation.data;

    // Verify CSRF token
    if (!verifyCsrfToken(csrfToken)) {
      return createErrorResponse('Invalid CSRF token', 403);
    }

    // Prevent disabling yourself
    if (params.id === access.userId) {
      return createErrorResponse('You cannot disable your own account', 400);
    }

    // Check if user exists
    const userDoc = await db.collection('users').doc(params.id).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    // Update user status in Firebase Auth
    await auth.updateUser(params.id, {
      disabled: !isActive
    });

    // Update user status in Firestore
    await db.collection('users').doc(params.id).update({
      isActive,
      updatedAt: new Date()
    });

    return createApiResponse({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return createErrorResponse('Failed to update user status', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
} 