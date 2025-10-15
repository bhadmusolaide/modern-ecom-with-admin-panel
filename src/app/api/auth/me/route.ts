import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return createApiResponse({  }, 200);
}

export async function GET(request: NextRequest) {
  try {

    // Use unified auth check
    const access = await checkAccess(request);

    // Check if authenticated
    if (!access.authenticated) {

      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(access.userId).get();

    if (!userDoc.exists) {

      return createErrorResponse('User not found', 404);
    }

    const userData = userDoc.data();

    // Return user data
    return createApiResponse({
      valid: true,
      user: {
        id: userDoc.id,
        name: userData?.name,
        email: userData?.email,
        role: userData?.role || 'CUSTOMER',
        emailVerified: userData?.emailVerified || false,
        createdAt: userData?.createdAt?.toDate(),
        lastLoginAt: userData?.lastLoginAt?.toDate(),
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return createErrorResponse('Authentication failed', 401, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
