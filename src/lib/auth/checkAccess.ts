import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '../firebase/admin';

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

  // Get token from cookie first (preferred method)
  // Handle both NextRequest cookies and standard Request cookies
  let sessionCookie: string | undefined;

  try {
    if (req.cookies && typeof req.cookies.get === 'function') {
      sessionCookie = req.cookies.get('session')?.value;
    } else if (req.headers && req.headers.get) {
      // Fallback: try to get from cookie header
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const sessionMatch = cookieHeader.match(/session=([^;]+)/);
        sessionCookie = sessionMatch ? sessionMatch[1] : undefined;
      }
    }
  } catch (error) {

    sessionCookie = undefined;
  }

  // Fallback to Authorization header if no cookie
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

  let headerToken = null;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      headerToken = authHeader.split('Bearer ')[1];
    } else {

      headerToken = authHeader;
    }
  }

  const token = sessionCookie || headerToken;

  if (token) {

}

  if (!token) {

    return {
      authenticated: false,
      error: 'Authentication required',
      status: 401
    };
  }

  try {
    // Verify Firebase token

    try {
      const auth = getAdminAuth();

      const decoded = await auth.verifyIdToken(token);

      // Log minimal information about the token (uid already logged above)

      // Check if user is admin - first check custom claims
      let isAdmin = decoded.admin === true;

      // If not admin by claims, check Firestore data
      if (!isAdmin) {
        try {

          const db = getAdminFirestore();
          const userRef = db.collection('users').doc(decoded.uid);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            const userData = userDoc.data();

            isAdmin = userData?.role === 'ADMIN';

          } else {

          }
        } catch (firestoreError) {
          console.error('checkAccess: Error checking Firestore for admin role:', firestoreError);
          console.error('checkAccess: Error details:', firestoreError instanceof Error ? firestoreError.message : 'Unknown error');
          console.error('checkAccess: Error stack:', firestoreError instanceof Error ? firestoreError.stack : 'No stack trace available');
          // Log error but continue with isAdmin = false
        }
      }

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
