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
    console.log('Validating user authentication...');

    // Use unified auth check
    const access = await checkAccess(request);

    // Check if authenticated
    if (!access.authenticated) {
      console.log('Authentication failed:', access.error);
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    console.log('Authentication successful, user ID:', access.userId);

    // Get user from Firestore
    const userDoc = await db.collection('users').doc(access.userId).get();

    if (!userDoc.exists) {
      console.log('User not found in database');
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
