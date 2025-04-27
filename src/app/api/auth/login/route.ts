import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyCsrfToken, csrfProtection } from '@/lib/csrf';
import { rateLimitAuth, resetRateLimit } from '@/lib/rateLimit';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase/config';
import { db as clientDb } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  csrfToken: z.string().min(1, 'CSRF token is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const response = createApiResponse({}, 204);

  // Add CORS headers
  const headers = response.headers;
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return response;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimit = rateLimitAuth(request, 'login');

    // If rate limited, return 429 Too Many Requests
    if (rateLimit.isLimited) {
      const response = createErrorResponse('Too many login attempts. Please try again later.', 429);

      // Add rate limit headers
      Object.entries(rateLimit.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Verify CSRF protection
    if (!csrfProtection(request)) {
      const response = createErrorResponse('Invalid security token. Please refresh and try again.', 403);

      // Add rate limit headers
      Object.entries(rateLimit.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const response = createErrorResponse(validation.error.errors[0].message, 400);

      // Add rate limit headers
      Object.entries(rateLimit.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    const { email, password, rememberMe } = validation.data;

    // Apply email-specific rate limiting
    const emailRateLimit = rateLimitAuth(request, 'login-email', email);

    if (emailRateLimit.isLimited) {
      const response = createErrorResponse('Too many login attempts for this email. Please try again later.', 429);

      // Add rate limit headers
      Object.entries({
        ...rateLimit.headers,
        ...emailRateLimit.headers
      }).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const firebaseUser = userCredential.user;

      // Get ID token for secure session
      const idToken = await firebaseUser.getIdToken();

      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(clientDb, 'users', firebaseUser.uid));

      // Create or update user document if it doesn't exist
      if (!userDoc.exists()) {
        // Create basic user document
        await updateDoc(doc(clientDb, 'users', firebaseUser.uid), {
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          role: 'CUSTOMER',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          emailVerified: firebaseUser.emailVerified
        });
      } else {
        // Update last login time
        await updateDoc(doc(clientDb, 'users', firebaseUser.uid), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Reset rate limits for this email on successful login
      resetRateLimit('login-email', email);

      // Set session duration based on remember me
      const sessionDuration = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day

      // Create response with user data
      const responseData = {
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: userDoc.exists() ? userDoc.data().name : firebaseUser.displayName,
          role: userDoc.exists() ? userDoc.data().role : 'CUSTOMER',
        },
        message: 'Login successful',
        expiresIn: sessionDuration
      };

      // Create response
      const response = createApiResponse(responseData);

      // Add rate limit headers
      Object.entries(rateLimit.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Set secure session cookie
      response.cookies.set('session', idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: sessionDuration,
        path: '/',
        sameSite: 'strict',
      });

      // Set a non-httpOnly cookie for client-side auth state detection
      response.cookies.set('auth-status', 'authenticated', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: sessionDuration,
        path: '/',
        sameSite: 'lax',
      });

      return response;
    } catch (error) {
      console.error('Firebase authentication error:', error);

      // Get remaining attempts from rate limit
      const remainingAttempts = parseInt(rateLimit.headers['X-RateLimit-Remaining'] || '0');

      const response = createErrorResponse('Invalid email or password', 401, { remainingAttempts });

      // Add rate limit headers
      Object.entries(rateLimit.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }
  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse(
      'Login failed due to a server error',
      500,
      { details: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
