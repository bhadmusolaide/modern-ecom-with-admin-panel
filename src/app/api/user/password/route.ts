import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken } from '@/lib/csrf';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';



// Validation schema
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookies
    // Unified auth check
  const access = await checkAccess(request);

  if (!access.authenticated) {
    return createErrorResponse(
      access.error || 'Authentication required',
      access.status || 401
    );
  }

    // Parse and validate request body
    const body = await request.json();
    const validation = updatePasswordSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    // Verify CSRF token
    const { csrfToken, currentPassword, newPassword } = validation.data;
    if (!verifyCsrfToken(csrfToken)) {
      return createErrorResponse('Invalid CSRF token', 403);
    }

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(access.userId).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    // Get Firebase user
    const firebaseUser = await auth.getUser(access.userId);

    // Update password in Firebase Auth
    await auth.updateUser(access.userId, {
      password: newPassword
    });

    // Update the user document in Firestore
    await db.collection('users').doc(access.userId).update({
      updatedAt: new Date()
    });

    return createApiResponse({ 
      success: true,
      message: 'Password updated successfully',
     });
  } catch (error) {
    console.error('Password update error:', error);
    return createErrorResponse('Failed to update password', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
