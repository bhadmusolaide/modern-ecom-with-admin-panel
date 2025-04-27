/**
 * Session Verification API Route
 * 
 * This endpoint verifies the user's session for middleware.
 * It's a lightweight endpoint that returns the user's session information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

/**
 * Verify session
 * @route GET /api/verify-session
 */
export async function GET(request: NextRequest) {
  try {
    // Use the unified auth check
    const access = await checkAccess(request);

    // For admin routes, we need to check if the user is an admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!access.authenticated) {
        return createErrorResponse('Authentication required', 401);
      }

      if (!access.isAdmin) {
        return createErrorResponse('Admin access required', 403);
      }

      // Return the user session for admin
      return createApiResponse({
        user: {
          id: access.userId,
          isAdmin: true
        },
        message: 'Admin session verified'
      });
    }

    // For non-admin routes, just check if the user is authenticated
    if (!access.authenticated) {
      return createErrorResponse('Authentication required', 401);
    }

    // Return the user session
    return createApiResponse({
      user: {
        id: access.userId,
        isAdmin: access.isAdmin
      },
      message: 'Session verified'
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return createErrorResponse(
      'Failed to verify session',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
