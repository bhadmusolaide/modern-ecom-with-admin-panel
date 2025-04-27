import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/firebase/admin';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Session duration in seconds
const SESSION_DURATION = 60 * 60; // 1 hour

/**
 * Create a secure session with HttpOnly cookies
 *
 * Note: This is a special case where we need to use the token directly
 * to set it as a cookie, so we can't fully use checkAccess here.
 * However, we still use the standardized API response helpers.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return createErrorResponse('Token is required', 400);
    }

    // Special case: We need to verify the token and then use it for the cookie
    try {
      // Create a mock request with the token in the Authorization header
      const mockRequest = new Request('http://localhost', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Use checkAccess to verify the token
      const access = await checkAccess(mockRequest as unknown as NextRequest);

      if (!access.authenticated) {
        return createErrorResponse(
          access.error || 'Invalid authentication token',
          access.status || 401
        );
      }

      // Get the cookies instance and await it before using
      const cookieStore = await cookies();

      // Set HttpOnly cookie
      cookieStore.set({
        name: 'session',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_DURATION,
        path: '/',
      });

      // Log session creation
      console.log(`Session created for user: ${access.userId}`);

      // Update last login time in Firestore
      try {
        if (access.userId) {
          // First check if the user document exists
          const userRef = db.collection('users').doc(access.userId);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            // Update existing document
            await userRef.update({
              lastLoginAt: new Date(),
              lastSessionAt: new Date()
            });
            console.log(`Updated login time for user: ${access.userId}`);
          } else {
            // Log the issue but don't create a document
            // Users should be created through proper registration flow
            console.warn(`User document not found for ID: ${access.userId}. Cannot update login time.`);
          }
        }
      } catch (dbError) {
        console.error('Error updating user login time:', dbError);
        // Continue even if this fails
      }

      return createApiResponse({
        success: true,
        expiresIn: SESSION_DURATION,
        userId: access.userId,
        isAdmin: access.isAdmin
      });
    } catch (verifyError) {
      console.error('Invalid token provided:', verifyError);
      return createErrorResponse('Invalid authentication token', 401);
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return createErrorResponse(
      'Failed to create session',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Get current session information
 */
export async function GET(request: NextRequest) {
  try {
    // Use the unified auth check
    const access = await checkAccess(request);

    if (!access.authenticated) {
      return createApiResponse({ authenticated: false });
    }

    return createApiResponse({
      authenticated: true,
      userId: access.userId,
      isAdmin: access.isAdmin,
      user: access.user
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return createErrorResponse(
      'Failed to check session',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}