import { getAuth } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';
import { db } from '../firebase/admin';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  isAdmin?: boolean;
  error?: string;
  status?: number;
  user?: any;
}

/**
 * Unified authentication check for API routes
 *
 * This function provides a consistent way to check authentication across all API routes.
 * It enforces Firebase authentication and admin role checks in all environments.
 *
 * @param req - The Next.js request object
 * @returns AuthResult object with authentication status and user info
 */
export async function checkAccess(req: NextRequest): Promise<AuthResult> {
  // No bypass auth - both development and production use Firebase authentication directly
  console.log('checkAccess: Using Firebase authentication for all environments');

  // Get token from cookie first (preferred method)
  const sessionCookie = req.cookies.get('session')?.value;
  console.log('checkAccess: Session cookie present:', !!sessionCookie);

  // Fallback to Authorization header if no cookie
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  console.log('checkAccess: Authorization header present:', !!authHeader);

  let headerToken = null;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      headerToken = authHeader.split('Bearer ')[1];
    } else {
      console.warn('checkAccess: Authorization header does not start with "Bearer "');
      headerToken = authHeader;
    }
  }

  const token = sessionCookie || headerToken;
  console.log('checkAccess: Final token present:', !!token);

  if (token) {
    console.log('checkAccess: Token length:', token.length);
    console.log('checkAccess: Token prefix:', token.substring(0, 10) + '...');
  }

  if (!token) {
    console.log('checkAccess: No authentication token provided');
    return {
      authenticated: false,
      error: 'Authentication required',
      status: 401
    };
  }

  try {
    // Verify Firebase token
    console.log('checkAccess: Verifying Firebase token');

    try {
      const auth = getAuth();
      console.log('checkAccess: Got Firebase Admin auth instance');

      const decoded = await auth.verifyIdToken(token);
      console.log(`checkAccess: Token verified for user: ${decoded.uid}`);
      // Log minimal information about the token (uid already logged above)

      // Check if user is admin - first check custom claims
      let isAdmin = decoded.admin === true;
      console.log('checkAccess: Admin from claims:', isAdmin);

      // If not admin by claims, check Firestore data
      if (!isAdmin) {
        try {
          console.log(`checkAccess: Checking Firestore for admin role for user ${decoded.uid}`);
          const userRef = db.collection('users').doc(decoded.uid);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('checkAccess: User data from Firestore:', JSON.stringify({
              role: userData?.role,
              email: userData?.email
            }, null, 2));

            isAdmin = userData?.role === 'ADMIN';
            console.log('checkAccess: Admin from Firestore:', isAdmin);
          } else {
            console.log(`checkAccess: No user document found in Firestore for ${decoded.uid}`);
          }
        } catch (firestoreError) {
          console.error('checkAccess: Error checking Firestore for admin role:', firestoreError);
          console.error('checkAccess: Error details:', firestoreError instanceof Error ? firestoreError.message : 'Unknown error');
          console.error('checkAccess: Error stack:', firestoreError instanceof Error ? firestoreError.stack : 'No stack trace available');
          // Log error but continue with isAdmin = false
        }
      }

      console.log(`checkAccess: User ${decoded.uid} isAdmin: ${isAdmin}`);

      return {
        authenticated: true,
        userId: decoded.uid,
        isAdmin,
        user: decoded
      };
    } catch (verifyError) {
      console.error('checkAccess: Error in verifyIdToken:', verifyError);
      console.error('checkAccess: Error details:', verifyError instanceof Error ? verifyError.message : 'Unknown error');
      console.error('checkAccess: Error stack:', verifyError instanceof Error ? verifyError.stack : 'No stack trace available');
      throw verifyError; // Re-throw to be caught by outer catch
    }
  } catch (err: any) {
    console.error('checkAccess: Error verifying token:', err);
    console.error('checkAccess: Error message:', err.message);
    console.error('checkAccess: Error code:', err.code);
    console.error('checkAccess: Error stack:', err.stack);

    // Check for specific Firebase Auth error codes
    if (err.code === 'auth/id-token-expired') {
      return {
        authenticated: false,
        error: 'Authentication token has expired. Please log in again.',
        status: 401
      };
    } else if (err.code === 'auth/id-token-revoked') {
      return {
        authenticated: false,
        error: 'Authentication token has been revoked. Please log in again.',
        status: 401
      };
    } else if (err.code === 'auth/invalid-id-token') {
      return {
        authenticated: false,
        error: 'Invalid authentication token. Please log in again.',
        status: 401
      };
    }

    return {
      authenticated: false,
      error: `Invalid authentication token: ${err.message}`,
      status: 401
    };
  }
}
