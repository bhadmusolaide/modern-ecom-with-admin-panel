import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { serverTimestamp } from 'firebase-admin/firestore';
import { auth as adminAuth } from '@/lib/firebase/admin';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase/config';
import { checkAccess } from '@/lib/auth/checkAccess';
import { createApiResponse, createErrorResponse } from '@/lib/auth/apiResponse';
import { sign } from 'jsonwebtoken';








// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Hardcoded admin credentials for development only
// These are only used in development mode and are controlled by the checkAccess function
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message, 400);
    }

    const { email, password, rememberMe } = validation.data;

    let userId;
    let userRole = 'CUSTOMER';
    let userName = '';

    try {
      // In development, we can use hardcoded admin credentials
      if (process.env.NODE_ENV === 'development' && email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Create a consistent user ID based on the admin email for development
        userId = 'admin-' + Buffer.from(ADMIN_EMAIL).toString('hex');
        userRole = 'ADMIN';
        userName = 'Admin User';
        console.log('Using development admin credentials');
      } else {
        // In production or for non-admin credentials, use Firebase authentication
        console.log('Attempting Firebase authentication with:', { email });
        console.log('Firebase config:', {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + '...',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        });

        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
        const firebaseUser = userCredential.user;

        console.log('Firebase auth successful, user:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        });

        // Get user ID from Firebase
        userId = firebaseUser.uid;

        // Get additional user data from Firestore
        console.log('Fetching user data from Firestore for ID:', userId);
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
          console.log('User document not found in Firestore, creating basic record');
          // Create a basic user record if it doesn't exist
          await db.collection('users').doc(userId).set({
            email: email,
            name: firebaseUser.displayName || email.split('@')[0],
            role: 'CUSTOMER', // Default role
            emailVerified: firebaseUser.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });

          // Default role for new users
          userRole = 'CUSTOMER';
          userName = firebaseUser.displayName || email.split('@')[0];
        } else {
          // Get user data from Firestore
          const userData = userDoc.data();
          console.log('User data from Firestore:', {
            role: userData.role,
            name: userData.name
          });

          userRole = userData.role || 'CUSTOMER';
          userName = userData.name || firebaseUser.displayName || email.split('@')[0];
        }

        console.log('Firebase authentication successful for user:', userId, 'with role:', userRole);
      }
    } catch (firebaseError) {
      console.error('Firebase authentication error:', firebaseError);
      return createErrorResponse('Invalid email or password', 401);
    }

    // Create user object
    const user = {
      id: userId,
      email: email,
      name: userName,
      role: userRole,
    };

    // Update last login time in Firestore
    try {
      await db.collection('users').doc(userId).update({
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('User last login updated');
    } catch (error) {
      console.error('Error updating user last login in Firestore:', error);
      // Continue with login despite Firestore error
    }

    // Create JWT token
    const expiresIn = rememberMe ? '30d' : '1d';
    console.log('Creating JWT token for admin user with expiresIn:', expiresIn);

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
    const token = sign(
      { userId },
      jwtSecret,
      {
        expiresIn,
        algorithm: 'HS256'
      }
    );

    // Set cookie expiration
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

    // Create response
    const responseData = {
      user,
      message: 'Login successful',
      tokenSet: true,
    };

    const response = createApiResponse(responseData);

    // Set cookies
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production only
      maxAge,
      path: '/',
      sameSite: 'lax',
    });

    response.cookies.set('auth-status', 'authenticated', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production', // Secure in production only
      maxAge,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Direct login error:', error);
    return createErrorResponse('Login failed', 500, { details: error instanceof Error ? error.message : 'Unknown error' });
  }
}
