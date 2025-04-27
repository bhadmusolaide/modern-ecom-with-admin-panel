import { NextRequest } from 'next/server';
import { setAdminClaims } from '@/lib/firebase/admin/setAdminClaims';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';








// POST /api/admin/set-admin-claims
export async function POST(request: NextRequest) {
  try {
    console.log('Processing set-admin-claims request');

    // Unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createErrorResponse(
        access.error || 'Authentication required',
        access.status || 401
      );
    }

    if (!access.isAdmin) {
      return createErrorResponse('Forbidden. Only admins can set admin claims.', 403);
    }

    console.log('Admin access granted for user:', access.userId);

    // Get the user ID from the request body
    const { uid } = await request.json();

    if (!uid) {
      return createErrorResponse('User ID (uid) is required', 400);
    }

    // Set admin claims for the user
    await setAdminClaims(uid);

    return createApiResponse({
      success: true,
      message: `Admin claims set successfully for user: ${uid}`
    });
  } catch (error) {
    console.error('Error setting admin claims:', error);

    return createErrorResponse(
      'Failed to set admin claims',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
