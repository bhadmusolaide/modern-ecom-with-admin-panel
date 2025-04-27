import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth as adminAuth } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/admin';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { checkAccess } from '@/lib/auth/checkAccess';

// Validation schema
const loginAsUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if the request is from an admin
    const isAdmin = await checkAccess(request);
    if (!isAdmin) {
      return createErrorResponse('Unauthorized', 403);
    }

    const body = await request.json();
    const validation = loginAsUserSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { userId } = validation.data;

    // Get the target user's data
    const userRecord = await adminAuth.getUser(userId);
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();

    // Create a custom token for the target user
    const customToken = await adminAuth.createCustomToken(userId, {
      adminImpersonation: true,
      originalAdminId: request.headers.get('x-admin-id')
    });

    return createApiResponse({
      customToken,
      user: {
        id: userId,
        email: userRecord.email,
        name: userData?.name || userRecord.displayName,
        role: userData?.role || 'CUSTOMER',
        emailVerified: userRecord.emailVerified
      }
    });
  } catch (error) {
    console.error('Error in login-as-user:', error);
    return createErrorResponse(
      'Failed to login as user',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
} 